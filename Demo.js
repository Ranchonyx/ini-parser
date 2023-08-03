"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var INIParser_js_1 = require("./src/INIParser.js");
var parser = INIParser_js_1.default.GetParser("./Demo.ini");
console.log(parser.asJSON());
