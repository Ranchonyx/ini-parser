# INI-Parser

INI-Parser is a simplistic `ini` file format parser written in `typescript` for `node.js`.
I wrote this in my downtime at work to fend off boredom.
To use it, simply import it in your typescript files.

# Example

### Ini file
```ini
;Demo.ini
[details]
firstname=John
lastname=Doe
id=0123456789
alive=yes

[activity]
name=Reticulating splines
since=2023-08-02T14:54:11.840Z
```

### Typescript code
```typescript
//Demo.ts
import {INIParser} from "@ranchonyx/ini-parser"

const parser = INIParser.GetParser("./Demo.ini");

///Get the value of a key in a section as an INI entity.
parser.get("details", "firstname");
///>>> John

///Get all keys for a section
parser.getKeysForSection("details");
///>>> [ 'firstname', 'lastname', 'id', 'alive' ]

///Get sections
parser.getSections();
///>>> [ 'details', 'activity' ]

///Convert to JSON
parser.asJSON();
/*>>>
{
  details: { firstname: 'john', lastname: 'doe', id: 123456789, alive: true },
  activity: { name: 'reticulating splines', since: 2023-08-02T14:54:11.840Z }
}
*/
```

# Documentation
### Types
```typescript
type nativeType = string | number | boolean | Date;
type maybe<T> = undefined | T;

type INIEntity = {
    getKey: () => string;
    asNumber: () => maybe<number>;
    asString: () => maybe<string>;
    asBoolean: () => maybe<boolean>;
    asDate: () => maybe<Date>;
    asGuessedNative: () => nativeType;
}

type INIBlock = Record<string, INIEntity | string> & { __ini_section_name__: string };

type INIParseResult = Record<string, INIBlock>;
```

### Signatures
```typescript
public static INIParser.GetParser(INIContentOrFilePath: string): INIParser;
public INIParser.get(sectionKey: string, key: string): INIEntity;
public INIParser.getKeysForSection(sectionKey: string): string[];
public INIParser.getSections(): string[];
public INIParser.asJSON(): any;
```