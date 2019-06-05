'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as types from './types';

import { parseProperty, CSharpProperty } from "./properties";
import { parseMethod, CSharpMethod, CSharpParameter, parseConstructor } from "./methods";

import { generateProperty, trimMemberName, generateMethod, generateConstructor, generateClass } from "./generators";
import { ExtensionConfig } from "./config";
import { ParseResult } from "./parse";
import compose = require("./compose");
import regexs = require("./regexs");
import { parseXmlDocBlock, generateJsDoc } from "./commentDoc";
import { parseClass } from "./classes";

function csFunction<T>(parse: (code: string) => ParseResult<T> | null, generate: (value: T, config: ExtensionConfig) => string) {
  return function (code: string, config: ExtensionConfig) {
    const parseResult = parse(code);
    if (!parseResult) {
      return null;
    } else {
      return {
        result: generate(parseResult.data, config),
        index: parseResult.index,
        length: parseResult.length
      } as MatchResult;
    }
  }
}

/**Convert a c# automatic or fat arrow property to a typescript property. Returns null if the string didn't match */
const csAutoProperty = csFunction(parseProperty, generateProperty);
/**Convert a C# method to a typescript method signature */
const csMethod = csFunction(parseMethod, generateMethod);
const csConstructor = csFunction(parseConstructor, generateConstructor);
const csCommentSummary = csFunction(parseXmlDocBlock, generateJsDoc);
const csClass = csFunction(parseClass, generateClass);

function csAttribute(code: string, config: ExtensionConfig): MatchResult {
  var patt = /[ \t]*\[\S*\][ \t]*\r?\n/;
  var arr = patt.exec(code);
  if (arr == null) return null;

  return {
    result: "",
    index: arr.index,
    length: arr[0].length
  };
}

interface Match {
  /**Replacement string */
  result: string;
  /**Original index */
  index: number;
  /**Original lenght */
  length: number;
}

type MatchResult = Match | null;




function csPublicMember(code: string, config: ExtensionConfig): MatchResult {
  var patt = /public\s*(?:(?:abstract)|(?:sealed))?(\S*)\s+(.*)\s*{/;
  var arr = patt.exec(code);

  var tsMembers: { [index: string]: string } = {
    'class': 'interface',
    'struct': 'interface'
  };

  if (arr == null) return null;
  var tsMember = tsMembers[arr[1]];
  var name = trimMemberName(arr[2], config);
  return {
    result: `export ${tsMember || arr[1]} ${name} {`,
    index: arr.index,
    length: arr[0].length
  };
}



/**Find the next match */
function findMatch(code: string, startIndex: number, config: ExtensionConfig): MatchResult {
  code = code.substr(startIndex);

  var functions: ((code: string, config: ExtensionConfig) => MatchResult)[] = [
    csClass,
    csAutoProperty,
    csConstructor,
    csMethod,
    csCommentSummary,
    csAttribute,
    csPublicMember
  ];

  var firstMatch: MatchResult = null;
  for (let i = 0; i < functions.length; i++) {
    var match = functions[i](code, config);
    if (match != null && (firstMatch == null || match.index < firstMatch.index)) {
      firstMatch = match;
    }
  }

  return firstMatch ? {
    result: firstMatch.result,
    index: firstMatch.index + startIndex,
    length: firstMatch.length
  } : null;
}

/**Convert c# code to typescript code */
export function cs2ts(code: string, config: ExtensionConfig): string {
  var ret = "";
  var index = 0;
  while (true) {
    var nextMatch = findMatch(code, index, config);
    if (nextMatch == null)
      break;
    //add the last unmatched code:
    ret += code.substr(index, nextMatch.index - index);

    //add the matched code:
    ret += nextMatch.result;

    //increment the search index:
    index = nextMatch.index + nextMatch.length;
  }
  //add the last unmatched code:
  ret += code.substr(index);

  return ret;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export function getConfiguration(
  preserveModifier = false,
methodType = 'signature',
  changeToInterface = false
): ExtensionConfig {

    /**True for camelCase, false for preserving original name */

    let propertiesToCamelCase: boolean = true;
    /**Removes specified postfixes from property names, types & class names. Can be array OR string. Case-sensitive. */
    let trimPostfixes: string[] = [];
    /**Whether or not trim postfixes recursive. (e.g. with postfixes 'A' & 'B' PersonAAB will become PersonAA when it's false & Person when it's true) */

    let recursiveTrimPostfixes: boolean = true;
    /**ignoreInitializer */
    let
    ignoreInitializer: boolean = true;
    /** True to remove method bodies, false to preserve the body as-is*/
    let
    removeMethodBodies: boolean = false;
    /**True to remove class constructors, false to treat then like any other method */
    let removeConstructors: boolean = true;
    /**'signature' to emit a method signature, 'lambda' to emit a lambda function. 'controller' to emit a lambda to call an async controller */
    let
    methodStyle/*: 'signature' | 'lambda' | 'controller'*/ = methodType ? methodType : 'signature';
    /**True to convert C# byte array type to Typescript string, defaults to true since the serialization of C# byte[] results in a string */
    let
    byteArrayToString: boolean = true;
    /**True to convert C# DateTime and DateTimeOffset to Typescript (Date | string), defaults to true since the serialization of C# DateTime results in a string */
    let
    dateToDateOrString: boolean = true;
    /**Remove fields or properties with the given modifiers. Ex. if you want to remove private and internal members set to ['private', 'internal'] */
    let
    removeWithModifier: string[] = [];
    /**If setted, any property or field that its name matches the given regex will be removed */
    let
    removeNameRegex: string = "";
    /**True to convert classes to interfaces, false to convert classes to classes. Default is true */
    let
    classToInterface: boolean = changeToInterface;
    /**True to preserve fields and property modifiers. Default is false */
    let
    preserveModifiers: boolean = preserveModifier;

    return {
    propertiesToCamelCase,
    trimPostfixes,
    recursiveTrimPostfixes,
    ignoreInitializer,
    removeMethodBodies,
    removeConstructors,
    methodStyle,
    byteArrayToString,
    dateToDateOrString,
    removeWithModifier,
    removeNameRegex,
    classToInterface,
    preserveModifiers
  };
}


