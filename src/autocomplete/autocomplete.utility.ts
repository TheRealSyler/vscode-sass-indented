import {
  CompletionItem,
  CompletionItemKind,
  SnippetString,
  TextDocument,
  Position,
  ExtensionContext,
  MarkdownString,
  workspace,
} from 'vscode';
import sassSchemaUnits from './schemas/autocomplete.units';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, normalize, basename, sep } from 'path';
import { EntityStatus, IPropertyData, IPseudoClassData, IPseudoElementData, IReference, IValueData, NonPropertyEntity, RawCssEntity } from './autocomplete.interfaces';
import { isClassOrId, isAtRule } from 'suf-regex';
import { StateElement, State } from '../extension';
import { getSassModule } from './schemas/autocomplete.builtInModules';
import {
  positionValues,
  lineStyleValues,
  lineWidthValues,
  repeatValues,
} from './schemas/autocomplete.valueGroups';
import { htmlTags } from './schemas/autocomplete.html';
import { cssData } from './schemas/generatedData/rawCssData';
import { CompletionItemTag, MarkupContent } from 'vscode-languageserver-types';

export const importCssVariableRegex =
  /^[\t ]*\/\/[\t ]*import[\t ]*css-variables[\t ]*from/;
const importPathRegex =
  /(@import|@use|\/\/[\t ]*import[\t ]*css-variables[\t ]*from)[\t ]*['"]?([\w-]*)['"]?/;
const getImportsRegex =
  /^[\t ]*(@import|@use|\/\/[\t ]*import[\t ]*css-variables[\t ]*from){1}.*/gm;
const importAtPathRegex =
  /^[\t ]*(@import|@use)[\t ]*['"]?(.*?)['"]?[\t ]*([\t ]+as.*)?$/;
const replaceQuotesRegex = /[\t ]*['"]?([\w-]*?)['"]?[\t ]*/;

export interface ImportsItem {
  path: string;
  namespace: string | undefined;
  cssVarsOnly?: boolean;
}

// markdown line break constant
export const mdLineBreak = '  \n';

export class AutocompleteUtils {

  /** Formats property name */
  static getPropertyName(currentWord: string): string {
    return currentWord.trim().replace(':', ' ').split(' ')[0];
  }

  /** Search for property in cssSchema */
  static findPropertySchema(property: string) {
    return cssData.properties.find(prop => prop.name === property);
  }

  /** Creates the documentation for a css entity.
   *  Returns a string with markdown formatting.
   */
  static constructDocumentation(rawEntity: RawCssEntity): string {
    const formattedStatus = function(status?: EntityStatus): string {
      switch (status) {
        case 'nonstandard':
          return '⚠️ **Attention** this Property is **`nonStandard`**.\n';
        case 'experimental':
          return '⚠️ **Attention** this Property is **`Experimental`**.\n';
        case 'obsolete':
          return '⛔️ **Attention** this Property is **`Obsolete`**.\n';
        default:
          // Treat undefined status the same as 'standard', no special comment
          return '';
      }
    }(rawEntity.status);

    const formattedDescription = rawEntity.description ? `\n${rawEntity.description}` : '';

    const formattedRefs = function(refs: IReference[] = []): string {
      // add google search to references
      const allRefs = refs.concat({
        name: 'Google',
        url: `https://www.google.com/search?q=css+${rawEntity.name}`
      });

      return (
        '\n\n'
        + allRefs.map(ref => `[${ref.name}](${ref.url})`).join(mdLineBreak)
      );

    }(rawEntity.references);

    // the following formatted fields should only be in IPropertyData (currently only formattedValues)
    const formattedValues = function(values: IValueData[] = []): string {
      if (values.length === 0) {
        return '';
      }

      let text = '\n\n**Values**';
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        text = text.concat(
          '\n- ',
          value.name ? '**`' + value.name + '`**' : '',
          value.description ? ' *' + value.description + '*' : ''
        );
      }
      return text;
    }("values" in rawEntity ? rawEntity.values : undefined);

    // unused fields of rawEntity: browsers, restrictions, syntax, relevance
    // could be used in future

    const documentation = (
      formattedStatus
      + formattedDescription
      + formattedRefs
      + formattedValues
    );

    return documentation;
  }

  /** Constructs the snippet string to be used as the CompletionItem's insertText
   *  for entities that could be functions.
   *  Assumes that the parentheses are in the names if the entity is indeed a function.
   */
  static getInsertText({ name }: NonPropertyEntity): SnippetString {
    let snipString: string;
    const functionRegex = /(?<funcName>.*)\((?<argName>.*)\)$/;
    const matchedGroups = functionRegex.exec(name)?.groups;
    if (matchedGroups) {
      const { funcName, argName } = matchedGroups;
      snipString = `${funcName}($\{1:${argName}\})`;
    } else {
      snipString = name;
    }

    return new SnippetString(`${snipString}\n\t$0`);
  }

  /** Returns css property list for completion */
  static getProperties(currentWord: string): CompletionItem[] {
    if (isClassOrId(currentWord) || isAtRule(currentWord) || !cssData.properties) {
      return [];
    }

    return cssData.properties.map((rawProp) => {
      const completionItem = new CompletionItem(rawProp.name);
      completionItem.detail = AutocompleteUtils.convertOptionalMarkup(rawProp.description);
      completionItem.tags =
        rawProp.status === 'obsolete' ? [CompletionItemTag.Deprecated] : [];
      completionItem.sortText = '5';

      completionItem.insertText = rawProp.name.concat(': ');
      completionItem.kind = CompletionItemKind.Property;
      completionItem.documentation = new MarkdownString(this.constructDocumentation(rawProp));

      return completionItem;
    });
  }

  /** Converts [string | MarkupContent] -> string, or returns undefined */
  private static convertOptionalMarkup(val: string | MarkupContent | undefined): string | undefined {
    if (val === undefined) {
      return undefined;
    } else if (typeof val === 'string') {
      return val;
    } else {
      return val.value;
    }
  }

  /** Gets all CSS pseudo elements and classes completion items */
  static getCssPseudos(): CompletionItem[] {
    const completionPseudos: CompletionItem[] = [];
    function convertRawPseudo(rawPseudo: IPseudoClassData | IPseudoElementData): CompletionItem {
      // appends a star to the front of the pseudo's name if it is starred in the settings
      const starredEntities: string[] | undefined = workspace.getConfiguration().get('sass.andStared');
      const pseudoBareName = rawPseudo.name.replace(/:*\(*\)*/g, '');
      let itemName: string;
      if (starredEntities?.includes(pseudoBareName)) {
        itemName = '*'.concat(rawPseudo.name);
      } else {
        itemName = rawPseudo.name;
      }

      const completionItem = new CompletionItem(itemName);
      completionItem.detail = AutocompleteUtils.convertOptionalMarkup(rawPseudo.description);
      completionItem.tags =
        rawPseudo.status === 'obsolete' ? [CompletionItemTag.Deprecated] : [];
      const docs = new MarkdownString(AutocompleteUtils.constructDocumentation(rawPseudo));
      // console.log(AutocompleteUtils.constructDocumentation(rawPseudo));
      completionItem.documentation = docs;
      completionItem.insertText = AutocompleteUtils.getInsertText(rawPseudo);
      completionItem.kind = CompletionItemKind.Class;

      return completionItem;
    }

    // add pseudoClasses to completion array
    completionPseudos.push(...cssData.pseudoClasses?.map(convertRawPseudo) ?? []);
    // add pseudoElements to completion array
    completionPseudos.push(...cssData.pseudoElements?.map(convertRawPseudo) ?? []);

    return completionPseudos;
  }

  static getHtmlElements(currentWord: string): CompletionItem[] {
    if (isClassOrId(currentWord) || isAtRule(currentWord)) {
      return [];
    }
    return htmlTags.map((tagName) => {
      const item = new CompletionItem(tagName);
      item.kind = CompletionItemKind.Class;
      item.sortText = '3';
      return item;
    });
  }

  /** Returns values for current property for completion list */
  static getPropertyValues(currentWord: string): CompletionItem[] {
    const property = AutocompleteUtils.getPropertyName(currentWord);
    const schema = AutocompleteUtils.findPropertySchema(property);
    if (!schema) {
      return [];
    }

    let values = [];

    if (schema.values) {
      values.push(...schema.values);
    }

    if (schema.restrictions) {
      const restrictions = schema.restrictions;
      if (restrictions.includes('position')) {
        values.push(...positionValues);
      }
      if (restrictions.includes('repeat')) {
        values.push(...repeatValues);
      }
      if (restrictions.includes('line-style')) {
        values.push(...lineStyleValues);
      }
      if (restrictions.includes('line-width')) {
        values.push(...lineWidthValues);
      }
    }

    return values.map((property) => {
      const item = new CompletionItem(property.name);
      item.detail = property.desc;
      item.kind = CompletionItemKind.Value;
      item.sortText = '3';
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
        namespace = namespace === '*' || match.startsWith('@import')
          ? undefined
          : namespace;
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
        let path = match
          .replace(importCssVariableRegex, '')
          .replace(replaceQuotesRegex, '$1');

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
      completionItem.sortText = '1';
      units.push(completionItem);
    });
    return units;
  }

  static getDocumentWorkspacePath(
    document: TextDocument
  ) {
    for (let i = 0; i < workspace.workspaceFolders.length; i++) {
      const path = workspace.workspaceFolders[i].uri.fsPath;
      if (document.fileName.startsWith(path)) {
        return path;
      }
    }
    return ''
  }

  static getWorkspaceImportPath(
    document: TextDocument,
    importPath: string
  ) {
    const importRoot: string | undefined = workspace.getConfiguration().get('sass.importRoot');
    if (importRoot) {
      const workspacePath = this.getDocumentWorkspacePath(document);
      return normalize(
        join(
          workspacePath,
          importRoot,
          importPath
        )
      );
    }
    else {
      return normalize(
        join(
          document.fileName,
          '../',
          importPath
        )
      );
    }
  }

  static getImportSuggestionsForCurrentWord(
    document: TextDocument,
    currentWord: string
  ): CompletionItem[] {
    const suggestions: CompletionItem[] = [];
    const path = this.getWorkspaceImportPath(document, currentWord.replace(importPathRegex, '$2').trim());

    const dir = readdirSync(path);
    for (const file of dir) {
      if (/.sass$/.test(file) && file !== basename(document.fileName)) {
        const rep = file.replace('.sass', '');
        const item = new CompletionItem(rep);
        item.insertText = rep;
        item.detail = `Import - ${rep}`;
        item.kind = CompletionItemKind.Reference;
        item.sortText = '1';
        suggestions.push(item);
      } else if (statSync(path + '/' + file).isDirectory()) {
        const item = new CompletionItem(file);
        item.insertText = file;
        item.detail = `Folder - ${file}`;
        item.kind = CompletionItemKind.Folder;
        item.sortText = '2';
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
    const regex = /class='([\w ]*)'|id='(\w*)'/g;
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
                    classesAndIds.find(
                      (value) => value === '.'.concat(className)
                    ) === undefined
                  ) {
                    if (
                      addedClasses.find((item) => className === item) ===
                      undefined
                    ) {
                      addedClasses.push(className);
                      const item = new CompletionItem('.'.concat(className));
                      item.kind = CompletionItemKind.Class;
                      item.detail = `Class From: ${fileName}`;
                      item.insertText = new SnippetString(
                        '.'.concat(className, '\n\t$0')
                      );
                      item.sortText = '7';
                      res.push(item);
                    }
                  }
                });
              } else {
                if (
                  classesAndIds.find((value) => value === '#'.concat(match)) ===
                  undefined
                ) {
                  const item = new CompletionItem('#'.concat(match));
                  item.kind = CompletionItemKind.Class;
                  item.detail = `Id From: ${fileName}`;
                  item.insertText = new SnippetString(
                    '#'.concat(match, '\n\t$0')
                  );
                  item.sortText = '7';
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
      if (
        /^ *<[\w''= ]*(lang|type)=['"](text\/)?sass['"][\w''= ]*>/.test(
          line.text
        )
      ) {
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

  static isInMixinBlock(
    start: Position,
    document: TextDocument
  ): CompletionItem[] | false {
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
              completionItem.insertText = new SnippetString(
                rep.replace('$', '\\$')
              );
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
    callback: (
      element: StateElement,
      namespace: string | undefined
    ) => void | true
  ) {
    let breakLoop = false;
    for (const item of imports) {
      let importPath = this.getWorkspaceImportPath(document, item.path);

      let STATE: State = context.workspaceState.get(importPath);
      if (STATE == undefined) {
        // Failed to find import, attempt again with _ before filename
        const index = importPath.lastIndexOf(sep);
        if (index != -1) {
          importPath = importPath.substring(0, index + 1) + '_' + importPath.substring(index + 1);
          STATE = context.workspaceState.get(importPath);
        }
      }

      if (STATE) {
        for (const key in STATE) {
          if (STATE.hasOwnProperty(key)) {
            if (!item.cssVarsOnly || STATE[key].type === 'Css Variable') {
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
