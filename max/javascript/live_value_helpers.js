/* Defensive helpers for Max's legacy js runtime. */
(function (root) {
    "use strict";
    function scalar(value) {
        if (value instanceof Array) {
            if (value.length === 2 && value[0] === "id") { return Number(value[1]); }
            return value.length === 1 ? value[0] : value;
        }
        return value;
    }
    function number(value, fallback) { var n = Number(scalar(value)); return isFinite(n) ? n : fallback; }
    function string(value) {
        value = scalar(value);
        if (value instanceof Array) { return value.join(" "); }
        return value == null ? "" : String(value);
    }
    function idList(value) {
        var a = value instanceof Array ? value : [value], out = [], i;
        for (i = 0; i < a.length; i += 1) { if (a[i] === "id" && i + 1 < a.length) { out.push(Number(a[i + 1])); i += 1; } }
        return out;
    }
    /* Compact SHA-256 implementation used only for opaque, session-scoped IDs. */
    function sha256(text) {
        function rr(v, n) { return (v >>> n) | (v << (32 - n)); }
        function hex(v) { var s = (v >>> 0).toString(16); while (s.length < 8) { s = "0" + s; } return s; }
        var k = [], h = [], primes = [], candidate = 2, i, j, prime, bytes = [], bitLength, w = [], a, b, c, d, e, f, g, hh, t1, t2;
        while (primes.length < 64) {
            prime = true; for (i = 2; i * i <= candidate; i += 1) { if (candidate % i === 0) { prime = false; break; } }
            if (prime) { primes.push(candidate); if (h.length < 8) { h.push((Math.pow(candidate, 0.5) * 4294967296) | 0); } k.push((Math.pow(candidate, 1 / 3) * 4294967296) | 0); }
            candidate += 1;
        }
        text = unescape(encodeURIComponent(String(text)));
        for (i = 0; i < text.length; i += 1) { bytes.push(text.charCodeAt(i)); }
        bitLength = bytes.length * 8; bytes.push(128);
        while ((bytes.length % 64) !== 56) { bytes.push(0); }
        for (i = 7; i >= 0; i -= 1) { bytes.push(i < 4 ? (bitLength >>> (i * 8)) & 255 : 0); }
        for (i = 0; i < bytes.length; i += 64) {
            for (j = 0; j < 16; j += 1) { w[j] = (bytes[i + j * 4] << 24) | (bytes[i + j * 4 + 1] << 16) | (bytes[i + j * 4 + 2] << 8) | bytes[i + j * 4 + 3]; }
            for (j = 16; j < 64; j += 1) { a = rr(w[j - 15], 7) ^ rr(w[j - 15], 18) ^ (w[j - 15] >>> 3); b = rr(w[j - 2], 17) ^ rr(w[j - 2], 19) ^ (w[j - 2] >>> 10); w[j] = (w[j - 16] + a + w[j - 7] + b) | 0; }
            a = h[0]; b = h[1]; c = h[2]; d = h[3]; e = h[4]; f = h[5]; g = h[6]; hh = h[7];
            for (j = 0; j < 64; j += 1) { t1 = (hh + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & f) ^ ((~e) & g)) + k[j] + w[j]) | 0; t2 = ((rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0; hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0; }
            h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0; h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
        }
        return h.map(hex).join("");
    }
    var api = {scalar: scalar, number: number, string: string, idList: idList, sha256: sha256};
    root.SliceLabelerValues = api;
    if (typeof module !== "undefined" && module.exports) { module.exports = api; }
}(this));
