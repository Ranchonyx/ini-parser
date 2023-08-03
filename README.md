# INI-Parser

INI-Parser is a simplistic `ini` file format parser written in `typescript` for `node.js`.

To use it, simply import it in your typescript files.
# Example

### .ini file
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