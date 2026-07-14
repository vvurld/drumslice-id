/* ES5-compatible pure naming engine; also exports under Node for tests. */
(function (root) {
    "use strict";
    var ORDER = ["kick", "snare", "hihat", "tom", "cymbal"];
    var SHORT = {kick: "K", snare: "S", hihat: "HH", tom: "T", cymbal: "CY", unknown: "UNK"};
    var LONG = {kick: "Kick", snare: "Snare", hihat: "Hi-Hat", tom: "Tom", cymbal: "Cymbal", unknown: "Unknown"};

    function clean(value) { return String(value == null ? "" : value).replace(/^\s+|\s+$/g, "").replace(/\s+/g, " "); }
    function codePointLength(value) {
        var count = 0, i = 0, first, second;
        value = String(value);
        while (i < value.length) {
            first = value.charCodeAt(i); second = i + 1 < value.length ? value.charCodeAt(i + 1) : 0;
            i += first >= 0xD800 && first <= 0xDBFF && second >= 0xDC00 && second <= 0xDFFF ? 2 : 1;
            count += 1;
        }
        return count;
    }
    function truncateCodePoints(value, maximum) {
        var count = 0, i = 0, next, first, second;
        value = String(value); maximum = Math.max(0, Math.floor(Number(maximum)));
        while (i < value.length && count < maximum) {
            first = value.charCodeAt(i); second = i + 1 < value.length ? value.charCodeAt(i + 1) : 0;
            next = i + (first >= 0xD800 && first <= 0xDBFF && second >= 0xDC00 && second <= 0xDFFF ? 2 : 1);
            i = next; count += 1;
        }
        return value.slice(0, i);
    }
    function ordered(classes) {
        var seen = {}, out = [], i, c;
        classes = classes instanceof Array ? classes : [];
        for (i = 0; i < classes.length; i += 1) { seen[classes[i]] = true; }
        for (i = 0; i < ORDER.length; i += 1) { c = ORDER[i]; if (seen[c]) { out.push(c); } }
        return out.length ? out : ["unknown"];
    }
    function token(classes, options) {
        var map = options.longNames ? LONG : SHORT;
        return ordered(classes).map(function (c) { return map[c] || SHORT.unknown; }).join(options.labelSeparator);
    }
    function pad(value, width) { var s = String(value); while (s.length < width) { s = "0" + s; } return s; }
    function shorten(name, maxLength) {
        if (codePointLength(name) <= maxLength) { return name; }
        name = name.replace(/Hi-Hat/g, "HH").replace(/Cymbal/g, "CY").replace(/Snare/g, "S").replace(/Kick/g, "K").replace(/Unknown/g, "UNK").replace(/Tom/g, "T");
        return codePointLength(name) <= maxLength ? name : truncateCodePoints(name, maxLength);
    }
    function finiteNumber(value, fallback) { value = Number(value); return isFinite(value) ? value : fallback; }
    function defaults(options) {
        options = options || {};
        return {
            numbering: options.numbering === "off" || options.numbering === "always" || options.numbering === "duplicates" ? options.numbering : "duplicates",
            labelSeparator: options.labelSeparator == null ? "+" : String(options.labelSeparator),
            indexSeparator: options.indexSeparator == null ? " " : String(options.indexSeparator),
            indexWidth: Math.max(1, Math.floor(finiteNumber(options.indexWidth, 2))),
            longNames: !!options.longNames,
            maxLength: Math.max(1, Math.floor(finiteNumber(options.maxLength, 31))),
            preserveUnknown: !!options.preserveUnknown
        };
    }
    function sortValue(row, key, fallback) {
        var value = row && row[key];
        if (typeof fallback === "number") { value = Number(value); return isFinite(value) ? value : fallback; }
        return value == null ? fallback : String(value);
    }
    function compareEntries(left, right) {
        var a = sortValue(left.row, "sourceFingerprint", sortValue(left.row, "sourceKey", ""));
        var b = sortValue(right.row, "sourceFingerprint", sortValue(right.row, "sourceKey", ""));
        if (a < b) { return -1; } if (a > b) { return 1; }
        a = sortValue(left.row, "sourceStartFrame", 0); b = sortValue(right.row, "sourceStartFrame", 0);
        if (a !== b) { return a - b; }
        a = sortValue(left.row, "padNote", 0); b = sortValue(right.row, "padNote", 0);
        if (a !== b) { return a - b; }
        a = String(left.row.regionId || ""); b = String(right.row.regionId || "");
        return a < b ? -1 : (a > b ? 1 : left.index - right.index);
    }
    function generate(rows, options) {
        var opts = defaults(options), signatures = {}, entries = [], numbers = {}, generated = [], i, sig, number, name, row, preserve;
        for (i = 0; i < rows.length; i += 1) { sig = token(rows[i].classes || [], opts); signatures[sig] = (signatures[sig] || 0) + 1; }
        for (i = 0; i < rows.length; i += 1) { entries.push({index: i, row: rows[i], signature: token(rows[i].classes || [], opts)}); }
        entries.sort(function (left, right) { return left.signature < right.signature ? -1 : (left.signature > right.signature ? 1 : compareEntries(left, right)); });
        sig = null; number = 0;
        for (i = 0; i < entries.length; i += 1) { if (entries[i].signature !== sig) { sig = entries[i].signature; number = 0; } number += 1; numbers[entries[i].index] = number; }
        for (i = 0; i < rows.length; i += 1) {
            row = rows[i]; sig = token(row.classes || [], opts); number = numbers[i]; preserve = opts.preserveUnknown && sig === (opts.longNames ? LONG.unknown : SHORT.unknown);
            name = sig;
            if (opts.numbering === "always" || (opts.numbering === "duplicates" && signatures[sig] > 1)) { name += opts.indexSeparator + pad(number, opts.indexWidth); }
            if (preserve) { name = String(row.oldName == null ? "" : row.oldName); }
            name = preserve ? name : shorten(clean(name), opts.maxLength);
            generated.push({regionId: row.regionId, generatedName: name, effectiveName: name, preserveOriginal: preserve});
        }
        return generated;
    }
    function validateUserName(value, maxLength) {
        var name = clean(value);
        if (!name) { return {ok: false, code: "EMPTY_NAME", message: "A proposed name cannot be empty."}; }
        if (codePointLength(name) > (maxLength || 31)) { return {ok: false, code: "NAME_TOO_LONG", message: "The edited name exceeds the configured maximum length."}; }
        return {ok: true, value: name};
    }
    var api = {generate: generate, validateUserName: validateUserName, orderedClasses: ordered, codePointLength: codePointLength};
    root.DrumSliceIDNaming = api;
    if (typeof module !== "undefined" && module.exports) { module.exports = api; }
}(this));
