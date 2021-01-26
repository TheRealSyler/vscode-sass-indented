import {
  TextLine,
  Diagnostic,
  DiagnosticSeverity as Severity,
  Range,
  Position,
  DiagnosticRelatedInformation as RelatedInfo,
  Location,
  TextDocument
} from 'vscode';

import { DiagnosticUtility as utility } from './diagnostics.utility';
import { isProperty, isHtmlTag, isVar, hasPropertyValueSpace, isScssOrCss } from 'suf-regex';

export class DiagnosticRules {
  private _VARS: { [key: string]: { range: Range } } = {};
  private _DOCUMENT: TextDocument;
  constructor() { }
  reset(document: TextDocument) {
    this._VARS = {};
    this._DOCUMENT = document;
  }
  check(line: TextLine) {
    const diagnostics: Diagnostic[] = [];
    const range = new Range(new Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex), line.range.end);
    if (isProperty(line.text) && !isHtmlTag(line.text)) {
      diagnostics.push(...this._CHECK_PROPERTY(line, range));
    } else if (isVar(line.text)) {
      diagnostics.push(...this._CHECK_VAR(line, range));
    } else {
      diagnostics.push(...this._CHECK_INVALID(line, range));
    }
    return diagnostics;
  }

  private _CHECK_PROPERTY(line: TextLine, range: Range) {
    const diagnostics: Diagnostic[] = [];
    if (isProperty(line.text, true)) {
      const warning = new Diagnostic(range, utility.ruleMessages.property[0], Severity.Warning);
      warning.code = 'Property: 0';
      warning.source = 'Sass ';
      diagnostics.push(warning);
    }

    if (!hasPropertyValueSpace(line.text)) {
      const warning = new Diagnostic(utility.getPropertySpaceRange(line.text, range), utility.ruleMessages.property[1], Severity.Warning);
      warning.code = 'Property: 1';
      warning.source = 'Sass ';
      diagnostics.push(warning);
    }
    diagnostics.push(...this._CHECK_INVALID(line, range));
    return diagnostics;
  }
  private _CHECK_INVALID(line: TextLine, range: Range) {
    const diagnostics: Diagnostic[] = [];

    if (isScssOrCss(line.text)) {
      let isInQuotes = false;
      for (let i = 0; i < line.text.length; i++) {
        const char = line.text[i];
        if (!isInQuotes && char === '/' && line.text[i + 1] === '/') {
          break;
        } else if (/['"]/.test(char)) {
          isInQuotes = !isInQuotes;
        }
        if (/[;{}]/.test(char) && !isInQuotes) {
          const error = new Diagnostic(
            new Range(new Position(range.start.line, i), new Position(range.end.line, i + 1)),
            utility.ruleMessages.invalid[0],
            Severity.Error
          );
          error.source = 'Sass ';
          switch (char) {
            case ';':
              error.message = utility.ruleMessages.invalid[0];
              error.code = 'Invalid: 0';
              break;
            case '{':
            case '}':
              error.message = utility.ruleMessages.invalid[1];
              error.code = 'Invalid: 1';
              break;
          }
          diagnostics.push(error);
        }
      }
    }

    return diagnostics;
  }
  private _CHECK_VAR(line: TextLine, range: Range) {
    const diagnostics: Diagnostic[] = [];
    const key = line.text.split(/:.*/)[0]
    const key_T = key.trim();
    if (this._VARS.hasOwnProperty(key_T)) {
      const error = new Diagnostic(range, utility.ruleMessages.variable[0], Severity.Warning);
      error.code = 'Variable: 0';
      error.relatedInformation = [new RelatedInfo(new Location(this._DOCUMENT.uri, this._VARS[key_T].range), 'Already Declared Here')];
      error.source = 'Sass ';
      diagnostics.push(error);
    } else {
      this._VARS[key_T] = { range };
    }

    diagnostics.push(...this._CHECK_INVALID(line, range));
    return diagnostics;
  }
}
