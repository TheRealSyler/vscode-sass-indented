/*
  The core functionality of the autocomplete is work done by Stanislav Sysoev (@d4rkr00t)
  in his stylus extension and been adjusted to account for the slight differences between
  the languages.

  Original stylus version: https://github.com/d4rkr00t/language-stylus
*/
import {
  CancellationToken,
  CompletionItem,
  CompletionItemProvider,
  Position,
  Range,
  TextDocument,
  workspace,
  ExtensionContext,
  extensions,
  commands,
  SnippetString,
  MarkdownString,
} from 'vscode';

import sassSchema from './schemas/autocomplete.schema';

import { sassAt } from './schemas/autocomplete.at';
import { sassPseudo } from './schemas/autocomplete.pseudo';
import { isNumber } from 'util';
import {
  AutocompleteUtils as Utility,
  ImportsItem,
  importCssVariableRegex,
} from './autocomplete.utility';
import { Searcher } from './search/autocomplete.search';
import { sassCommentCompletions } from './schemas/autocomplete.commentCompletions';
import { isPath, isProperty, isVar } from 'suf-regex';
import { basename } from 'path';
import { StateElement } from '../extension';

class SassCompletion implements CompletionItemProvider {
  search: Searcher;
  constructor(public context: ExtensionContext) {
    this.context = context;
    this.search = new Searcher(context);
  }
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): CompletionItem[] {
    const start = new Position(position.line, 0);
    const range = new Range(start, position);
    const currentWord = document.getText(range).trim();
    const currentWordUT = document.getText(range);

    const config = workspace.getConfiguration();
    const disableUnitCompletion: boolean = config.get('sass.disableUnitCompletion');
    let block = false;
    let isInMixinBlock: CompletionItem[] | false = false;
    let atRules = [];
    let Units = [];
    let properties = [];
    let values = [];
    let classesAndIds = [];
    let functions = [];
    let variables: CompletionItem[] = [];

    let completions: CompletionItem[] = [];
    if (document.languageId === 'vue' || document.languageId === 'svelte') {
      block = Utility.isInVueOrSvelteStyleBlock(start, document);
    }
    if (
      !block &&
      extensions.getExtension('syler.sass-next') !== undefined &&
      currentWord.startsWith('?')
    ) {
      commands.executeCommand('sass.abbreviations').then(
        () => '',
        (err) => console.log('[Sass Abbreviations Error]: ', err)
      );
    }

    if (!block && /^@import|^@use/.test(currentWord)) {
      completions = Utility.getImportSuggestionsForCurrentWord(document, currentWord);
      block = true;
    }

    if (!block && currentWord.startsWith('&')) {
      completions = sassPseudo(config.get('sass.andStared'));
      block = true;
    }

    if (!block && !disableUnitCompletion && isNumber(currentWordUT)) {
      Units = Utility.getUnits(currentWord);
    }

    if (!block && currentWord.startsWith('/')) {
      if (importCssVariableRegex.test(currentWord)) {
        completions = Utility.getImportSuggestionsForCurrentWord(document, currentWord);
      } else {
        completions = sassCommentCompletions();
      }
      block = true;
    }
    if (!block && isPath(currentWord)) {
      block = true;
    }

    if (!block) {
      let { imports, propertyScopedModules, globalScopeModules } = Utility.getImports(document);
      // also get current file from the workspace State.
      imports.push({ path: basename(document.fileName), namespace: undefined });
      isInMixinBlock = Utility.isInMixinBlock(start, document);
      this.search.searchDocument(document);

      if (isProperty(currentWord)) {
        values = Utility.getPropertyValues(currentWord);
        if (isInMixinBlock === false) {
          if (/var\([\w\$-]*$/.test(currentWord)) {
            return this.getVariables(imports, document, 'Css Variable');
          } else {
            variables = this.getVariables(imports, document, 'Variable');
          }
        } else {
          variables = isInMixinBlock;
        }
        functions = sassSchema;
      } else if (isVar(currentWord)) {
        // TODO
      } else {
        propertyScopedModules = [];
        variables = [];
        Utility.ImportsLoop(imports, document, this.context, (element, namespace) => {
          if (element.type === 'Mixin') {
            /** is sass only syntax */
            const isSS = currentWord.endsWith('+');
            const completionItem = new CompletionItem(
              `${isSS ? '+' : '$'}${Utility.mergeNamespace(element.item.title, namespace)}`
            );
            completionItem.insertText = new SnippetString(
              `${isSS ? '' : '@include '}${Utility.mergeNamespace(element.item.insert, namespace)}`
            );
            completionItem.detail = element.item.detail;
            completionItem.kind = element.item.kind;
            variables.push(completionItem);
          }
        });

        classesAndIds = Utility.getHtmlClassOrIdCompletions(document);
        atRules = sassAt;
        properties = Utility.getProperties(currentWord);
      }

      completions = [].concat(
        properties,
        values,
        functions,
        Units,
        variables,
        atRules,
        classesAndIds,
        propertyScopedModules,
        globalScopeModules
      );
    }

    return completions;
  }

  private getVariables(imports: ImportsItem[], document: TextDocument, type: StateElement['type']) {
    const variables: CompletionItem[] = [];
    Utility.ImportsLoop(imports, document, this.context, (element, namespace) => {
      if (element.type === type) {
        const completionItem = new CompletionItem(
          Utility.mergeNamespace(element.item.title, namespace)
        );
        completionItem.insertText = Utility.mergeNamespace(element.item.insert, namespace);
        completionItem.documentation = new MarkdownString(element.item.detail);
        completionItem.kind = element.item.kind;
        variables.push(completionItem);
      }
    });
    return variables;
  }
}

export default SassCompletion;
