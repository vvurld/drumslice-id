from __future__ import annotations

import json
import sys
import threading
import time
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
        self.analysis_threads: dict[str, threading.Thread] = {}
        self.request_lock = threading.Lock()
        self.write_lock = threading.Lock()
        self.shutdown = Event()

    def send(self, message: dict[str, object]) -> None:
        with self.write_lock:
            self.output.write(json.dumps(message, separators=(",", ":"), allow_nan=False) + "\n")
            self.output.flush()

    def run(self) -> None:
        for line in self.input:
            if self.shutdown.is_set():
                break
            message: object = None
            try:
                message = json.loads(line)
                if not isinstance(message, dict):
                    raise WorkerError("MALFORMED_REQUEST", "Every worker message must be an object.")
                self.handle(message)
            except json.JSONDecodeError as error:
                self.send({"schemaVersion": 1, "type": "error", "requestId": "unknown", "code": "MALFORMED_REQUEST", "message": str(error)})
            except WorkerError as error:
                self.send({"schemaVersion": 1, "type": "error", "requestId": _request_id(message), **error.as_dict()})
            except Exception as error:
                traceback.print_exc(file=sys.stderr)
                self.send({"schemaVersion": 1, "type": "error", "requestId": _request_id(message), "code": "INTERNAL_WORKER_ERROR", "message": "The worker encountered an unexpected error.", "details": {"exception": type(error).__name__}})
            if self.shutdown.is_set():
                break
        self._finish_shutdown()

    def handle(self, message: dict[str, object]) -> None:
        if type(message.get("schemaVersion")) is not int or message.get("schemaVersion") != 1:
            raise WorkerError("SCHEMA_VERSION_MISMATCH", "Every message requires integer schemaVersion 1.")
        request_id = message.get("requestId")
        if not isinstance(request_id, str) or not request_id:
            raise WorkerError("MALFORMED_REQUEST", "Every message requires a non-empty string requestId.")
        message_type = message.get("type")
        if not isinstance(message_type, str):
            raise WorkerError("MALFORMED_REQUEST", "Every message requires a string type.")
        if message_type == "cancel":
            with self.request_lock:
                self.cancellations.setdefault(request_id, Event()).set()
        elif message_type == "shutdown":
            with self.request_lock:
                for cancellation in self.cancellations.values():
                    cancellation.set()
            self.shutdown.set()
        elif message_type == "health":
            backend = message.get("backend", "adtof")
            options = message.get("options", {})
            if not isinstance(backend, str) or not backend:
                raise WorkerError("MALFORMED_REQUEST", "health backend must be a non-empty string.")
            if not isinstance(options, dict):
                raise WorkerError("MALFORMED_REQUEST", "health options must be an object.")
            health = self.service.health(backend, options)
            self.send({"schemaVersion": 1, "type": "health", "requestId": request_id, **health})
        elif message_type == "request" and message.get("method") == "analyze":
            with self.request_lock:
                if request_id in self.analysis_threads:
                    self.send({"schemaVersion": 1, "type": "error", "requestId": request_id, "code": "DUPLICATE_REQUEST_ID", "message": "An analysis with this requestId is already active."})
                    return
                cancellation = self.cancellations.setdefault(request_id, Event())
                thread = threading.Thread(target=self._analyze, args=(request_id, message.get("params"), cancellation), daemon=True)
                self.analysis_threads[request_id] = thread
                thread.start()
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
            with self.request_lock:
                self.cancellations.pop(request_id, None)
                self.analysis_threads.pop(request_id, None)

    def _finish_shutdown(self) -> None:
        with self.request_lock:
            threads = list(self.analysis_threads.values())
            for cancellation in self.cancellations.values():
                cancellation.set()
        # Inference cannot be interrupted mid-file. Give it a short grace period;
        # Node will terminate the dedicated child if it exceeds its own deadline.
        deadline = time.monotonic() + 1.5
        for thread in threads:
            thread.join(timeout=max(0.0, deadline - time.monotonic()))


def _request_id(message: object) -> str:
    if isinstance(message, dict) and isinstance(message.get("requestId"), str) and message["requestId"]:
        return message["requestId"]
    return "unknown"
