import INIParser from "./src/INIParser.js";

const parser = INIParser.GetParser("./Demo.ini")
console.log(parser.asJSON());