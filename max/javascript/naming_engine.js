/* ES5-compatible pure naming engine; also exports under Node for tests. */
(function (root) {
    "use strict";
    var ORDER = ["kick", "snare", "hihat", "tom", "cymbal"];
    var SHORT = {kick: "K", snare: "S", hihat: "HH", tom: "T", cymbal: "CY", unknown: "UNK"};
    var LONG = {kick: "Kick", snare: "Snare", hihat: "Hi-Hat", tom: "Tom", cymbal: "Cymbal", unknown: "Unknown"};

    function clean(value) { return String(value == null ? "" : value).replace(/^\s+|\s+$/g, "").replace(/\s+/g, " "); }
    function ordered(classes) {
        var seen = {}, out = [], i, c;
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
        if (name.length <= maxLength) { return name; }
        name = name.replace(/Hi-Hat/g, "HH").replace(/Cymbal/g, "CY").replace(/Snare/g, "S").replace(/Kick/g, "K").replace(/Unknown/g, "UNK").replace(/Tom/g, "T");
        return name.length <= maxLength ? name : name.slice(0, maxLength);
    }
    function defaults(options) {
        options = options || {};
        return {
            numbering: options.numbering || "duplicates",
            labelSeparator: options.labelSeparator == null ? "+" : String(options.labelSeparator),
            indexSeparator: options.indexSeparator == null ? " " : String(options.indexSeparator),
            indexWidth: Math.max(1, Number(options.indexWidth || 2)),
            longNames: !!options.longNames,
            maxLength: Math.max(1, Number(options.maxLength || 31)),
            preserveUnknown: !!options.preserveUnknown
        };
    }
    function generate(rows, options) {
        var opts = defaults(options), signatures = {}, indexes = {}, generated = [], i, sig, number, name, row;
        for (i = 0; i < rows.length; i += 1) { sig = token(rows[i].classes || [], opts); signatures[sig] = (signatures[sig] || 0) + 1; }
        for (i = 0; i < rows.length; i += 1) {
            row = rows[i]; sig = token(row.classes || [], opts); indexes[sig] = (indexes[sig] || 0) + 1; number = indexes[sig];
            name = sig;
            if (opts.numbering === "always" || (opts.numbering === "duplicates" && signatures[sig] > 1)) { name += opts.indexSeparator + pad(number, opts.indexWidth); }
            if (opts.preserveUnknown && sig === (opts.longNames ? LONG.unknown : SHORT.unknown)) { name = row.oldName; }
            generated.push({regionId: row.regionId, generatedName: shorten(clean(name), opts.maxLength), effectiveName: shorten(clean(name), opts.maxLength)});
        }
        return generated;
    }
    function validateUserName(value, maxLength) {
        var name = clean(value);
        if (!name) { return {ok: false, code: "EMPTY_NAME", message: "A proposed name cannot be empty."}; }
        if (name.length > (maxLength || 31)) { return {ok: false, code: "NAME_TOO_LONG", message: "The edited name exceeds the configured maximum length."}; }
        return {ok: true, value: name};
    }
    var api = {generate: generate, validateUserName: validateUserName, orderedClasses: ordered};
    root.SliceLabelerNaming = api;
    if (typeof module !== "undefined" && module.exports) { module.exports = api; }
}(this));
