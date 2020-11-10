import {
  CompletionItem,
  CompletionItemKind,
  SnippetString,
  TextDocument,
  Position,
  ExtensionContext,
} from 'vscode';

import sassSchemaUnits from './schemas/autocomplete.units';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, normalize, basename } from 'path';
import { BasicRawCompletion } from './autocomplete.interfaces';
import { isClassOrId, isAtRule } from 'suf-regex';
import { StateElement, State } from '../extension';
import { getSassModule } from './schemas/autocomplete.builtInModules';
import { generatedPropertyData } from './schemas/autocomplete.generatedData';
import { positionValues, lineStyleValues, lineWidthValues, repeatValues } from './schemas/autocomplete.valueGroups';
import { GetPropertyDescription } from '../utilityFunctions';

export const importCssVariableRegex = /^[\t ]*\/\/[\t ]*import[\t ]*css-variables[\t ]*from/;
const importPathRegex = /(@import|@use|\/\/[\t ]*import[\t ]*css-variables[\t ]*from)[\t ]*['"]?([\w-]*)['"]?/;
const getImportsRegex = /^[\t ]*(@import|@use|\/\/[\t ]*import[\t ]*css-variables[\t ]*from){1}.*/gm;
const importAtPathRegex = /^[\t ]*(@import|@use)[\t ]*['"]?(.*?)['"]?[\t ]*([\t ]+as.*)?$/;
const replaceQuotesRegex = /[\t ]*['"]?([\w-]*?)['"]?[\t ]*/;

export interface ImportsItem {
  path: string;
  namespace: string | undefined;
  cssVarsOnly?: boolean;
}

export class AutocompleteUtils {
  /** Formats property name */
  static getPropertyName(currentWord: string): string {
    return currentWord.trim().replace(':', ' ').split(' ')[0];
  }

  /** Search for property in cssSchema */
  static findPropertySchema(property: string): BasicRawCompletion {
    return generatedPropertyData[property];
  }

  /** Returns property list for completion */
  static getProperties(currentWord: string): CompletionItem[] {
    if (isClassOrId(currentWord) || isAtRule(currentWord)) {
      return [];
    }
    return Object.values(generatedPropertyData).map(AutocompleteUtils.mapPropertyCompletionItem);
  }

  private static mapPropertyCompletionItem(prop: BasicRawCompletion): any {
    const item = new CompletionItem(prop.name);
    item.insertText = prop.name.concat(': ');
    item.detail = prop.desc;
    item.tags = prop.status === 'obsolete' ? [1] : [];
    item.documentation = GetPropertyDescription(prop.name, prop);
    item.kind = CompletionItemKind.Property;
    item.sortText = "5";
    return item;
  }

  /** Returns values for current property for completion list */
  static getPropertyValues(currentWord: string): CompletionItem[] {
    const property = AutocompleteUtils.getPropertyName(currentWord);
    const schema = AutocompleteUtils.findPropertySchema(property);
    if(!schema) {
      return [];
    };

    let values = [];

    if (schema.values) {
      values.push(...schema.values);
    }

    if(schema.restriction) {
      const restrictions = schema.restriction.split(", ");
      if(restrictions.includes("position")) {
        values.push(...positionValues);
      }
      if(restrictions.includes("repeat")) {
        values.push(...repeatValues);
      }
      if(restrictions.includes("line-style")) {
        values.push(...lineStyleValues);
      }
      if(restrictions.includes("line-width")) {
        values.push(...lineWidthValues);
      }
    }

    return values.map((property) => {
      const item = new CompletionItem(property.name);
      item.detail = property.desc;
      item.kind = CompletionItemKind.Value;
      item.sortText = "3";
      return item;
    });
  }

  /** Get the imports. */
  static getImports(document: TextDocument) {
    const text = document.getText();

    let m: RegExpExecArray;
    const imports: ImportsItem[] = [];
    const propertyScopedModules: any[] = [];
    const globalScopeModules: any[] = [];
    while ((m = getImportsRegex.exec(text)) !== null) {
      if (m.index === getImportsRegex.lastIndex) {
        getImportsRegex.lastIndex++;
      }
      const match = m[0];
      // prevent commented lines from being imported.
      if (!match.startsWith('//')) {
        let path = match.replace(importAtPathRegex, '$2');
        let namespace = match
          .replace(/(.*?as |@use)[\t ]*['"]?.*?([\w-]*?)['"]?[\t ]*$/, '$2')
          .trim();
        namespace = namespace === '*' || match.startsWith('@import') ? undefined : namespace;
        if (/sass:(math|color|string|list|map|selector|meta)/.test(path)) {
          switch (path) {
            case 'sass:math':
              propertyScopedModules.push(...getSassModule('MATH', namespace));
              break;
            case 'sass:color':
              propertyScopedModules.push(...getSassModule('COLOR', namespace));
              break;
            case 'sass:string':
              propertyScopedModules.push(...getSassModule('STRING', namespace));
              break;
            case 'sass:list':
              propertyScopedModules.push(...getSassModule('LIST', namespace));
              break;
            case 'sass:map':
              propertyScopedModules.push(...getSassModule('MAP', namespace));
              break;
            case 'sass:selector':
              globalScopeModules.push(...getSassModule('SELECTOR', namespace));
              break;
            case 'sass:meta':
              // TODO
              propertyScopedModules.push(...getSassModule('META', namespace));
              break;
          }
        } else {
          path = AutocompleteUtils.addDotSassToPath(path);

          imports.push({ path, namespace });
        }
      } else if (importCssVariableRegex.test(match)) {
        let path = match.replace(importCssVariableRegex, '').replace(replaceQuotesRegex, '$1');

        path = AutocompleteUtils.addDotSassToPath(path);

        imports.push({ path, namespace: undefined, cssVarsOnly: true });
      }
    }
    return { imports, propertyScopedModules, globalScopeModules };
  }

  private static addDotSassToPath(path: string) {
    if (!/\.sass$/.test(path)) {
      path = path.concat('.sass');
    }
    return path;
  }

  /** gets unit completions.*/
  static getUnits(currentword: string) {
    const units = [];

    sassSchemaUnits.forEach((item) => {
      const lastWord = currentword.split(' ');
      const rep = lastWord[lastWord.length - 1];
      const completionItem = new CompletionItem(rep + item.name);
      completionItem.insertText = new SnippetString(rep + item.body);
      completionItem.detail = item.desc;
      completionItem.kind = CompletionItemKind.Unit;
      completionItem.sortText = "1";
      units.push(completionItem);
    });
    return units;
  }

  static getImportSuggestionsForCurrentWord(
    document: TextDocument,
    currentWord: string
  ): CompletionItem[] {
    const suggestions: CompletionItem[] = [];
    const path = normalize(
      join(document.fileName, '../', currentWord.replace(importPathRegex, '$2').trim())
    );

    const dir = readdirSync(path);
    for (const file of dir) {
      if (/.sass$/.test(file) && file !== basename(document.fileName)) {
        const rep = file.replace('.sass', '');
        const item = new CompletionItem(rep);
        item.insertText = rep;
        item.detail = `Import - ${rep}`;
        item.kind = CompletionItemKind.Reference;
        item.sortText = "1";
        suggestions.push(item);
      } else if (statSync(path + '/' + file).isDirectory()) {
        const item = new CompletionItem(file);
        item.insertText = file;
        item.detail = `Folder - ${file}`;
        item.kind = CompletionItemKind.Folder;
        item.sortText = "2";
        suggestions.push(item);
      }
    }
    return suggestions;
  }

  static getHtmlClassOrIdCompletions(document: TextDocument) {
    const path = normalize(join(document.fileName, '../', './'));
    const dir = readdirSync(path);
    const classesAndIds = this.getDocumentClassesAndIds(document);
    const res: CompletionItem[] = [];
    const addedClasses: string[] = [];
    const regex = /class="([\w ]*)"|id="(\w*)"/g;
    for (const file of dir) {
      const fileName = basename(document.fileName).replace('.sass', '.html');
      if (new RegExp(fileName).test(file)) {
        const text = readFileSync(
          normalize(document.fileName).replace('.sass', '.html')
        ).toString();
        let m;
        while ((m = regex.exec(text)) !== null) {
          if (m.index === regex.lastIndex) {
            regex.lastIndex++;
          }
          m.forEach((match: string, groupIndex) => {
            if (groupIndex !== 0 && match !== undefined) {
              if (groupIndex === 1) {
                const classes = match.split(' ');
                classes.forEach((className) => {
                  if (
                    classesAndIds.find((value) => value === '.'.concat(className)) === undefined
                  ) {
                    if (addedClasses.find((item) => className === item) === undefined) {
                      addedClasses.push(className);
                      const item = new CompletionItem('.'.concat(className));
                      item.kind = CompletionItemKind.Class;
                      item.detail = `Class From: ${fileName}`;
                      item.insertText = new SnippetString('.'.concat(className, '\n\t$0'));
                      item.sortText = "7";
                      res.push(item);
                    }
                  }
                });
              } else {
                if (classesAndIds.find((value) => value === '#'.concat(match)) === undefined) {
                  const item = new CompletionItem('#'.concat(match));
                  item.kind = CompletionItemKind.Class;
                  item.detail = `Id From: ${fileName}`;
                  item.insertText = new SnippetString('#'.concat(match, '\n\t$0'));
                  item.sortText = "7";
                  res.push(item);
                }
              }
            }
          });
        }
      }
    }
    return res;
  }
  /** don't get confused by the return values. */
  static isInVueOrSvelteStyleBlock(start: Position, document: TextDocument) {
    for (let i = start.line; i > 0; i--) {
      const line = document.lineAt(i);
      if (/^ *<[\w"'= ]*(lang|type)=['"](text\/)?sass['"][\w"'= ]*>/.test(line.text)) {
        if (!(i === start.line)) {
          return false;
        }
        break;
      } else if (/<\/ *style *>/.test(line.text)) {
        if (!(i === start.line)) {
          return true;
        }
        break;
      }
    }
    return true;
  }

  static isInMixinBlock(start: Position, document: TextDocument): CompletionItem[] | false {
    for (let i = start.line; i > 0; i--) {
      const line = document.lineAt(i);
      if (/^ *@mixin/.test(line.text)) {
        const firstSplit = line.text.split('(');
        if (firstSplit[1] !== undefined) {
          const resVar: CompletionItem[] = [];
          const mixinName = firstSplit[0].replace('@mixin', '').trim();
          firstSplit[1].split('$').forEach((variable) => {
            if (variable) {
              const rep = '$'.concat(variable.split(/[,: \)]/)[0]);
              const completionItem = new CompletionItem(rep);
              completionItem.insertText = new SnippetString(rep.replace('$', '\\$'));
              completionItem.detail = `@mixin ${mixinName}\n(${rep.replace(
                '$',
                ''
              )}) - Local Variable`;
              completionItem.kind = CompletionItemKind.Variable;
              resVar.push(completionItem);
            }
          });
          return resVar;
        } else {
          return [];
        }
      } else if (/^\S.*/.test(line.text)) {
        return false;
      }
    }
    return false;
  }
  static getDocumentClassesAndIds(document: TextDocument) {
    const classesAndIds: string[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      if (isClassOrId(line.text)) {
        classesAndIds.push(line.text.trim());
      }
    }
    return classesAndIds;
  }

  static ImportsLoop(
    imports: ImportsItem[],
    document: TextDocument,
    context: ExtensionContext,
    /**returning true breaks the loop. */
    callback: (element: StateElement, namespace: string | undefined) => void | true
  ) {
    let breakLoop = false;
    for (let i = 0; i < imports.length; i++) {
      const item = imports[i];
      let importPath = item.path;

      const STATE: State = context.workspaceState.get(
        normalize(join(document.fileName, '../', importPath))
      );

      if (STATE) {
        for (const key in STATE) {
          if (STATE.hasOwnProperty(key)) {
            if (!item.cssVarsOnly) {
              breakLoop = !!callback(STATE[key], item.namespace);
            } else if (STATE[key].type === 'Css Variable') {
              breakLoop = !!callback(STATE[key], item.namespace);
            }
          }
          if (breakLoop) {
            break;
          }
        }
      }

      if (breakLoop) {
        break;
      }
    }
  }
  static mergeNamespace(text: string, namespace: string | undefined) {
    return `${namespace ? namespace.concat('.') : ''}${text}`;
  }
}
