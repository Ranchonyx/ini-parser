"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_fs_1 = require("node:fs");
var node_os_1 = require("node:os");
var INIParser = /** @class */ (function () {
    function INIParser(INIContent, viaGetParser) {
        if (viaGetParser === void 0) { viaGetParser = false; }
        this.result = {};
        if (!viaGetParser)
            throw new Error("Can only instantia INIParser via \'INIParser.GetParser()\' !");
        this.content = INIContent;
        this.parseSelf();
    }
    INIParser.prototype.parseSelf = function () {
        var line = 0;
        var cleanedINI = this.content.split(node_os_1.EOL)
            .filter(function (line) { return (line.length !== 0) && (line !== "\t"); }) //Filter trailing or empty filler lines
            .filter(function (line) { return !line.startsWith(";"); }) //Filter comments
            .map(function (line) { return line.trimEnd().trimStart(); }) //Trim ends
            .map(function (line) { return line.toLowerCase(); }); //Ignore text case
        var iniBlocks = [];
        //Subparser functions
        function skip_ini_comment(line) {
            var col = 0, tok = [], elm = "";
            if (line) {
                while (!(col > line.length)) {
                    if ((elm = line[col++]) && elm !== ";" && elm !== "") {
                        tok.push(elm);
                    }
                    else {
                        break;
                    }
                }
            }
            return tok.join("").trim();
        }
        function skip_ini_while(cleanINIContent, predicate) {
            var linesBetween = [];
            while (true) {
                var ln = skip_ini_comment(cleanINIContent[line++]);
                if (ln) {
                    if (predicate(ln)) {
                        linesBetween.push(ln);
                    }
                    else {
                        --line;
                        break;
                    }
                    ;
                }
                else
                    break;
            }
            return linesBetween;
        }
        var skip_ini_header = function (cleanINIContent) {
            return skip_ini_while(cleanINIContent, function (line) { return line.match(/\[.*?\]/) === null; });
        };
        var skip_ini_pair = function (cleanINIContent) {
            return skip_ini_while(cleanINIContent, function (line) { return line.match(/\[.*?\]/) !== null; });
        };
        function consumeCleanedINI(cleanINIContent) {
            //Get ini block header
            var headers = skip_ini_pair(cleanINIContent);
            var header = (headers[0] || "").slice(1, -1);
            //Get ini block pairs
            var pairs = (skip_ini_header(cleanINIContent)).map(function (pair) { return pair.split("="); });
            //Create ini-entity subparser from pairs
            var entities = [];
            var _loop_1 = function (pair) {
                if (pair.length < 2)
                    throw new Error("Invalid INI pair '".concat(JSON.stringify(pair, null, 2), "' in section '").concat(header, "'"));
                var isBool = function () { return (pair[1] === "true" || pair[1] === "yes") || (pair[1] === "false" || pair[1] === "no"); };
                var isNumber = function () { return !Number.isNaN(parseFloat(pair[1])); };
                var isDate = function () { return !Number.isNaN(Date.parse(pair[1])) && pair[1].length >= 10; };
                var coerceIniBool = function (iniBool) { return iniBool === "yes" ? true : (iniBool === "no" ? false : iniBool === "true"); };
                entities.push({
                    getKey: function () { return pair[0]; },
                    asString: function () { return pair[1]; },
                    asBoolean: function () { return isBool() ? Boolean(coerceIniBool(pair[1])) : undefined; },
                    asNumber: function () { return isNumber() ? parseFloat(pair[1]) : undefined; },
                    asDate: function () { return isDate() ? new Date(pair[1]) : undefined; },
                    asGuessedNative: function () {
                        var p1 = pair[1];
                        if (isDate())
                            return new Date(p1);
                        else if (isNumber())
                            return parseFloat(p1);
                        else if (isBool())
                            return Boolean(p1);
                        else
                            return p1;
                    }
                });
            };
            for (var _i = 0, pairs_1 = pairs; _i < pairs_1.length; _i++) {
                var pair = pairs_1[_i];
                _loop_1(pair);
            }
            //Create the ini block from the subparsers
            ///@ts-expect-error
            var block = {};
            Object.defineProperty(block, "__ini_section_name__", {
                configurable: false,
                enumerable: false,
                writable: false,
                value: header
            });
            for (var _a = 0, entities_1 = entities; _a < entities_1.length; _a++) {
                var entity = entities_1[_a];
                block[entity.getKey()] = entity;
            }
            //Push ini block
            iniBlocks.push(block);
            //Calculate slice length
            var sliceLen = (headers || []).length + pairs.length;
            //Reset line
            line = 0;
            //Bail if sliceLen === 0
            if (sliceLen === 0)
                return;
            //Recursively call self with increasingly smaller slices
            cleanedINI = cleanedINI.slice(sliceLen);
        }
        //Consume self...
        while (cleanedINI.length > 0) {
            consumeCleanedINI(cleanedINI);
        }
        for (var _i = 0, iniBlocks_1 = iniBlocks; _i < iniBlocks_1.length; _i++) {
            var block = iniBlocks_1[_i];
            this.result[block.__ini_section_name__] = block;
        }
    };
    INIParser.prototype.get = function (section, key) {
        if (section in this.result)
            if (key in this.result[section])
                return this.result[section][key];
            else
                throw new Error("Unknown INI key '".concat(key, "' for INI section '").concat(section, "'"));
        else
            throw new Error("Unknown INI section '".concat(section, "'"));
    };
    INIParser.prototype.getKeysForSection = function (section) {
        if (section in this.result)
            return Object.keys(this.result[section]);
        else
            throw new Error("Unknown INI section '".concat(section, "'"));
    };
    INIParser.prototype.asJSON = function () {
        var obj = {};
        for (var _i = 0, _a = this.getSections(); _i < _a.length; _i++) {
            var sectionKey = _a[_i];
            Object.defineProperty(obj, sectionKey, {
                writable: true,
                enumerable: true,
                value: {},
            });
            for (var _b = 0, _c = this.getKeysForSection(sectionKey); _b < _c.length; _b++) {
                var key = _c[_b];
                Object.defineProperty(obj[sectionKey], key, {
                    writable: true,
                    enumerable: true,
                    value: this.get(sectionKey, key).asGuessedNative()
                });
            }
        }
        return obj;
    };
    INIParser.prototype.toJSON = function () {
        return this.asJSON();
    };
    INIParser.prototype.getSections = function () {
        return Object.keys(this.result);
    };
    INIParser.GetParser = function (INIContentOrFilePath) {
        if (!(0, node_fs_1.existsSync)(INIContentOrFilePath))
            return new INIParser(INIContentOrFilePath, true);
        else
            return new INIParser((0, node_fs_1.readFileSync)(INIContentOrFilePath, "utf-8"), true);
    };
    return INIParser;
}());
exports.default = INIParser;
