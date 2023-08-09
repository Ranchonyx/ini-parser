import { existsSync, readFileSync } from "node:fs"
import { EOL } from "node:os";

export type JSNative = string | number | boolean | Date;
export type Maybe<T> = undefined | T;

export type INIEntity = {
    getKey: () => string;
    asNumber: () => Maybe<number>;
    asString: () => Maybe<string>;
    asBoolean: () => Maybe<boolean>;
    asDate: () => Maybe<Date>;
    asGuessedNative: () => JSNative;
    toString: () => string;
}

export type INIBlock = Record<string, INIEntity> & { __ini_section_name__: string };

export type INIParseResult = Record<string, INIBlock>;

export class INIParser {
    private result: INIParseResult = {};

    public static GetParser = (INIContentOrFilePath: string): INIParser => {
        if (!existsSync(INIContentOrFilePath))
            return new INIParser(INIContentOrFilePath, true);
        else return new INIParser(readFileSync(INIContentOrFilePath, "utf-8"), true);
    }

    private constructor(INIContent: string, viaGetParser: boolean = false) {
        if (!viaGetParser) throw new Error("Can only instantiate INIParser via \'INIParser.GetParser()\' !")
        this.parseSelf(INIContent);
    }

    private parseSelf(content: string) {
        let line = 0;

        let cleanedINI: string[] = [];
        const lnDelm = content.split(EOL).length <= 1 ? "\n" : EOL;

        for(const line of content.split(lnDelm)) {
            if(line.length !== 0 && line !== "\t" && !line.startsWith(";")) {
                cleanedINI.push(line.trim().toLowerCase());
            }
        }

        const iniBlocks: INIBlock[] = [];

        //Subparser functions
        function skip_ini_comment(line: string) {
            let col = 0, tok = [], elm = "";
            if (line) {
                while (!(col > line.length)) {
                    if ((elm = line[col++]) && elm !== ";" && elm !== "") {
                        tok.push(elm);
                    } else {
                        break;
                    }
                }
            }

            return tok.join("").trim();
        }

        function skip_ini_while(cleanINIContent: string[], predicate: (line: string) => boolean): string[] {
            const linesBetween: string[] = [];

            while (true) {
                const ln = skip_ini_comment(cleanINIContent[line++]);
                if (ln) {
                    if (predicate(ln)) {
                        linesBetween.push(ln)
                    } else {
                        --line;
                        break;
                    };
                } else break;
            }

            return linesBetween;
        }

        const skip_ini_header = (cleanINIContent: string[]) =>
            skip_ini_while(cleanINIContent, (line: string) => line.match(/\[.*?\]/) === null);

        const skip_ini_pair = (cleanINIContent: string[]) =>
            skip_ini_while(cleanINIContent, (line: string) => line.match(/\[.*?\]/) !== null);

        function consume_ini_toks(cleanINIContent: string[]) {
            //Get ini block header
            const headers = skip_ini_pair(cleanINIContent);
            const header = (headers[0] || "").slice(1, -1);

            //Get ini block pairs
            const pairs = (skip_ini_header(cleanINIContent)).map(pair => pair.split("="));

            //Create ini-entity subparsers from pairs
            const entities: INIEntity[] = [];
            for (const pair of pairs) {
                if (pair.length < 2) throw new Error(`Invalid INI pair \'${JSON.stringify(pair, null, 2)}\' in section \'${header}\'`);
                const isBool = () => (pair[1] === "true" || pair[1] === "yes") || (pair[1] === "false" || pair[1] === "no");
                const isNumber = () => !Number.isNaN(parseFloat(pair[1]));
                const isDate = () => !Number.isNaN(Date.parse(pair[1])) && pair[1].length >= 10;
                const coerceIniBool = (iniBool: string) => iniBool === "yes" ? true : (iniBool === "no" ? false : iniBool === "true");

                entities.push({
                    getKey: () => pair[0],
                    asString: () => pair[1],
                    asBoolean: () => isBool() ? coerceIniBool(pair[1]) : undefined,
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
                        else return p1;
                    },
                    toString: () => pair[0]
                });
            }

            //Create the ini block from the subparsers
            ///@ts-expect-error
            const block: INIBlock = {};

            Object.defineProperty(block, "__ini_section_name__", {
                configurable: false,
                enumerable: false,
                writable: false,
                value: header
            });

            for (const entity of entities) {
                block[entity as unknown as string] = entity;
            }

            //Push ini block
            iniBlocks.push(block);

            //Calculate slice length
            const sliceLen = (headers || []).length + pairs.length;

            //Reset line
            line = 0;

            //Bail if sliceLen === 0
            if (sliceLen === 0) return;

            //Slice cleanedINI so it consumes less memory for each iteration
            cleanedINI = cleanedINI.slice(sliceLen);
        }

        //Consume self...
        while (cleanedINI.length > 0) {
            consume_ini_toks(cleanedINI);
        }

        for (const block of iniBlocks) {
            this.result[block.__ini_section_name__] = block;
        }
    }

    public get(section: string, key: string): INIEntity {
        if (section in this.result)
            if (key in this.result[section])
                return this.result[section][key] as INIEntity;
            else
                throw new Error(`Unknown INI key \'${key}\' for INI section \'${section}\'`);
        else
            throw new Error(`Unknown INI section \'${section}\'`);
    }

    public getKeysForSection(section: string): string[] {
        if (section in this.result)
            return Object.keys(this.result[section]);
        else
            throw new Error(`Unknown INI section \'${section}\'`);
    }

    public asJSON(): any {
        const obj: any = {};

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

    private toJSON(): ReturnType<INIParser["asJSON"]> {
        return this.asJSON();
    }

    public get [Symbol.toStringTag](): string {
        return "INIParser";
    }

    public getSections(): string[] {
        return Object.keys(this.result);
    }
}