declare module '@ranchonyx/ini-parser' {
    /**
     * @description Union type describing several JS native types
     */
    export type JSNative = string | number | boolean | Date;

    /**
     * @template T
     * @description Generic union type describing either undefined or T
     */
    export type Maybe<T> = undefined | T;

    /**
     * Interface describing an INI entity.
     * @method getKey() - Returns the INI key of the entity
     * @method asNumber() - Interprets the entity value as a number
     * @method asString() - Interprets the entity value as a string
     * @method asBoolean() - Interprets the entity value as a boolean
     * @method asDate() - Interprets the entity value as a date
     * @method asGuessedNative() - Interprets the entity as a js native value
     */
    export interface INIEntity {
        getKey: () => string;
        asNumber: () => Maybe<number>;
        asString: () => Maybe<string>;
        asBoolean: () => Maybe<boolean>;
        asDate: () => Maybe<Date>;
        asGuessedNative: () => JSNative;
    }

    /**
     * Dictionary type representing a section of an INI file
     */
    export type INIBlock = Record<string, INIEntity> & { __ini_section_name__: string };
    
    /**
     * Dictionary type representing an INI file
     */
    export type INIParseResult = Record<string, INIBlock>;

    /**
     * The INI Parser
     */
    export class INIParser {
        private content: string;
        private result: INIParseResult;
        /**
         * Factory to parse an INI file or INI content directly
         * @param INIContentOrFilePath Either direct INI text, or a path to an INI file
         */
        public static GetParser: (INIContentOrFilePath: string) => INIParser;

        private constructor(INIContent: string, viaGetParser: boolean);
        private parseSelf: () => void;
        
        /**
         * Get the INI entity for a key in a section
         * @param section The section name
         * @param key The key name
         */
        public get(section: string, key: string): INIEntity;

        /**
         * Get the keys for an INI section
         * @param section The section name which to query the keys for
         */
        public getKeysForSection(section: string): string[];

        /**
         * Query all INI sections
         */
        public getSections(): string[];

        /**
         * Convert the INI directly to JSON
         */
        public asJSON(): any;

        /**
         * Used by JSON.stringify(), simply returns asJSON()
         */
        private toJSON(): ReturnType<INIParser["asJSON"]>;
    }
}