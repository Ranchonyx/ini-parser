export type JSNative = string | number | boolean | Date;
export type Maybe<T> = undefined | T;
export type INIEntity = {
    getKey: () => string;
    asNumber: () => Maybe<number>;
    asString: () => Maybe<string>;
    asBoolean: () => Maybe<boolean>;
    asDate: () => Maybe<Date>;
    asGuessedNative: () => JSNative;
};
export type INIBlock = Record<string, INIEntity | string> & {
    __ini_section_name__: string;
};
export type INIParseResult = Record<string, INIBlock>;
export declare class INIParser {
    private content;
    private result;
    static GetParser: (INIContentOrFilePath: string) => INIParser;
    private constructor();
    private parseSelf;
    get(section: string, key: string): INIEntity;
    getKeysForSection(section: string): string[];
    asJSON(): any;
    private toJSON;
    getSections(): string[];
}
//# sourceMappingURL=index.d.ts.map