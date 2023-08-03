"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INIParser = void 0;
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
class INIParser {
    constructor(INIContent, viaGetParser = false) {
        this.result = {};
        if (!viaGetParser)
            throw new Error("Can only instantia INIParser via \'INIParser.GetParser()\' !");
        this.content = INIContent;
        this.parseSelf();
    }
    parseSelf() {
        let line = 0;
        let cleanedINI = this.content.split(node_os_1.EOL)
            .filter(line => (line.length !== 0) && (line !== "\t")) //Filter trailing or empty filler lines
            .filter(line => !line.startsWith(";")) //Filter comments
            .map(line => line.trimEnd().trimStart()) //Trim ends
            .map(line => line.toLowerCase()); //Ignore text case
        const iniBlocks = [];
        //Subparser functions
        function skip_ini_comment(line) {
            let col = 0, tok = [], elm = "";
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
            const linesBetween = [];
            while (true) {
                const ln = skip_ini_comment(cleanINIContent[line++]);
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
        const skip_ini_header = (cleanINIContent) => skip_ini_while(cleanINIContent, (line) => line.match(/\[.*?\]/) === null);
        const skip_ini_pair = (cleanINIContent) => skip_ini_while(cleanINIContent, (line) => line.match(/\[.*?\]/) !== null);
        function consumeCleanedINI(cleanINIContent) {
            //Get ini block header
            const headers = skip_ini_pair(cleanINIContent);
            const header = (headers[0] || "").slice(1, -1);
            //Get ini block pairs
            const pairs = (skip_ini_header(cleanINIContent)).map(pair => pair.split("="));
            //Create ini-entity subparser from pairs
            const entities = [];
            for (const pair of pairs) {
                if (pair.length < 2)
                    throw new Error(`Invalid INI pair \'${JSON.stringify(pair, null, 2)}\' in section \'${header}\'`);
                const isBool = () => (pair[1] === "true" || pair[1] === "yes") || (pair[1] === "false" || pair[1] === "no");
                const isNumber = () => !Number.isNaN(parseFloat(pair[1]));
                const isDate = () => !Number.isNaN(Date.parse(pair[1])) && pair[1].length >= 10;
                const coerceIniBool = (iniBool) => iniBool === "yes" ? true : (iniBool === "no" ? false : iniBool === "true");
                entities.push({
                    getKey: () => pair[0],
                    asString: () => pair[1],
                    asBoolean: () => isBool() ? Boolean(coerceIniBool(pair[1])) : undefined,
                    asNumber: () => isNumber() ? parseFloat(pair[1]) : undefined,
                    asDate: () => isDate() ? new Date(pair[1]) : undefined,
                    asGuessedNative: () => {
                        const p1 = pair[1];
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
            }
            //Create the ini block from the subparsers
            ///@ts-expect-error
            const block = {};
            Object.defineProperty(block, "__ini_section_name__", {
                configurable: false,
                enumerable: false,
                writable: false,
                value: header
            });
            for (const entity of entities) {
                block[entity.getKey()] = entity;
            }
            //Push ini block
            iniBlocks.push(block);
            //Calculate slice length
            const sliceLen = (headers || []).length + pairs.length;
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
        for (const block of iniBlocks) {
            this.result[block.__ini_section_name__] = block;
        }
    }
    get(section, key) {
        if (section in this.result)
            if (key in this.result[section])
                return this.result[section][key];
            else
                throw new Error(`Unknown INI key \'${key}\' for INI section \'${section}\'`);
        else
            throw new Error(`Unknown INI section \'${section}\'`);
    }
    getKeysForSection(section) {
        if (section in this.result)
            return Object.keys(this.result[section]);
        else
            throw new Error(`Unknown INI section \'${section}\'`);
    }
    asJSON() {
        const obj = {};
        for (const sectionKey of this.getSections()) {
            Object.defineProperty(obj, sectionKey, {
                writable: true,
                enumerable: true,
                value: {},
            });
            for (const key of this.getKeysForSection(sectionKey)) {
                Object.defineProperty(obj[sectionKey], key, {
                    writable: true,
                    enumerable: true,
                    value: this.get(sectionKey, key).asGuessedNative()
                });
            }
        }
        return obj;
    }
    toJSON() {
        return this.asJSON();
    }
    get [Symbol.toStringTag]() {
        return "[object INIParser]";
    }
    getSections() {
        return Object.keys(this.result);
    }
}
INIParser.GetParser = (INIContentOrFilePath) => {
    if (!(0, node_fs_1.existsSync)(INIContentOrFilePath))
        return new INIParser(INIContentOrFilePath, true);
    else
        return new INIParser((0, node_fs_1.readFileSync)(INIContentOrFilePath, "utf-8"), true);
};
exports.INIParser = INIParser;
//# sourceMappingURL=index.js.map