from __future__ import annotations

import json
import sys
import threading
import traceback
from threading import Event
from typing import TextIO

from .errors import WorkerError
from .service import AnalysisService


class WorkerProtocol:
    def __init__(self, input_stream: TextIO = sys.stdin, output_stream: TextIO = sys.stdout) -> None:
        self.input = input_stream
        self.output = output_stream
        self.service = AnalysisService()
        self.cancellations: dict[str, Event] = {}
        self.write_lock = threading.Lock()
        self.shutdown = Event()

    def send(self, message: dict[str, object]) -> None:
        with self.write_lock:
            self.output.write(json.dumps(message, separators=(",", ":")) + "\n")
            self.output.flush()

    def run(self) -> None:
        for line in self.input:
            if self.shutdown.is_set():
                break
            try:
                message = json.loads(line)
                self.handle(message)
            except (json.JSONDecodeError, TypeError) as error:
                self.send({"schemaVersion": 1, "type": "error", "requestId": "unknown", "code": "MALFORMED_REQUEST", "message": str(error)})

    def handle(self, message: dict[str, object]) -> None:
        request_id = str(message.get("requestId", ""))
        if message.get("schemaVersion") != 1 or not request_id:
            raise TypeError("Every message requires schemaVersion 1 and requestId.")
        message_type = message.get("type")
        if message_type == "cancel":
            self.cancellations.setdefault(request_id, Event()).set()
        elif message_type == "shutdown":
            self.shutdown.set()
        elif message_type == "health":
            try:
                health = self.service.health(str(message.get("backend", "adtof")), message.get("options") if isinstance(message.get("options"), dict) else {})
                self.send({"schemaVersion": 1, "type": "health", "requestId": request_id, **health})
            except WorkerError as error:
                self.send({"schemaVersion": 1, "type": "error", "requestId": request_id, **error.as_dict()})
        elif message_type == "request" and message.get("method") == "analyze":
            cancellation = self.cancellations.setdefault(request_id, Event())
            threading.Thread(target=self._analyze, args=(request_id, message.get("params"), cancellation), daemon=True).start()
        else:
            self.send({"schemaVersion": 1, "type": "error", "requestId": request_id, "code": "UNKNOWN_METHOD", "message": "Unknown worker request."})

    def _analyze(self, request_id: str, params: object, cancellation: Event) -> None:
        try:
            if not isinstance(params, dict):
                raise WorkerError("INVALID_ANALYSIS_REQUEST", "params must be an object.")
            result, _ = self.service.analyze(params, cancellation, lambda item: self.send({"schemaVersion": 1, "type": "progress", "requestId": request_id, **item}))
            if cancellation.is_set():
                raise WorkerError("ANALYSIS_CANCELLED", "Analysis was cancelled.")
            self.send({"schemaVersion": 1, "type": "result", "requestId": request_id, **result})
        except WorkerError as error:
            self.send({"schemaVersion": 1, "type": "error", "requestId": request_id, **error.as_dict()})
        except Exception as error:
            traceback.print_exc(file=sys.stderr)
            self.send({"schemaVersion": 1, "type": "error", "requestId": request_id, "code": "INTERNAL_WORKER_ERROR", "message": "The worker encountered an unexpected error.", "details": {"exception": type(error).__name__}})
        finally:
            self.cancellations.pop(request_id, None)
