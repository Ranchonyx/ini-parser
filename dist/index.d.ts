type nativeType = string | number | boolean | Date;
type maybe<T> = undefined | T;
type INIEntity = {
    getKey: () => string;
    asNumber: () => maybe<number>;
    asString: () => maybe<string>;
    asBoolean: () => maybe<boolean>;
    asDate: () => maybe<Date>;
    asGuessedNative: () => nativeType;
};
export declare class INIParser {
    private content;
    private result;
    static GetParser: (INIContentOrFilePath: string) => INIParser;
    private constructor();
    private parseSelf;
    get(section: string, key: string): INIEntity;
    getKeysForSection(section: string): string[];
    asJSON(): any;
    toJSON(): any;
    getSections(): string[];
}
export {};
//# sourceMappingURL=index.d.ts.map