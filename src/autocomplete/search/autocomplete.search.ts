import { State, StateItem, StateElement } from '../../extension';
import { CompletionItemKind, ExtensionContext, TextDocument, workspace } from 'vscode';
import { normalize, relative } from 'path';
import { AutocompleteUtils } from '../autocomplete.utility';

export class Searcher {
  context: ExtensionContext;
  constructor(context: ExtensionContext) {
    this.context = context;
  }

  /** searches for variables and mixin. */
  searchDocument(document: TextDocument) {
    if (document.languageId === 'sass' && workspace.workspaceFolders) {
      const text = document.getText();

      let workspacePath = AutocompleteUtils.getDocumentWorkspacePath(document);

      const pathBasename = relative(workspacePath, document.fileName);

      const STATE: State = {};

      this.searchVars(text, pathBasename, STATE);

      this.searchMixins(text, pathBasename, STATE);

      this.context.workspaceState.update(normalize(document.fileName), STATE);
    }
  }

  /** handles finding the variables in a file. */
  private searchVars(text: string, pathBasename: string, SEARCH_STATE: State) {
    const varRegex = /^[\t ]*(\$|--)\S+:.*/gm;
    let varMatches: RegExpExecArray;
    while ((varMatches = varRegex.exec(text)) !== null) {
      if (varMatches.index === varRegex.lastIndex) {
        varRegex.lastIndex++;
      }
      const match = varMatches[0];
      if (match !== '$' && match !== '--') {
        this.createVar(
          match,
          pathBasename,
          SEARCH_STATE,
          match.trim().startsWith('$') ? 'Variable' : 'Css Variable'
        );
      }
    }
  }

  /** handles finding the mixins in a file. */
  private searchMixins(text: string, pathBasename: string, SEARCH_STATE: State) {
    const mixinRegex = /^[ \t]*(@mixin ?|=)\S+ ?\(?.{2,}\)?/gm;
    let mixinMatches: RegExpExecArray;
    while ((mixinMatches = mixinRegex.exec(text)) !== null) {
      if (mixinMatches.index === mixinRegex.lastIndex) {
        mixinRegex.lastIndex++;
      }
      const match = mixinMatches[0];

      this.createMixin(match, pathBasename, SEARCH_STATE);
    }
  }

  /** creates a mixin state item. */
  private createMixin(match: string, pathBasename: string, SEARCH_STATE: State) {
    let argNum = 0;
    const mixinName = match.replace(/@mixin|=/, '').trim();
    const namespace = `${pathBasename}/${mixinName}`;
    const item: StateItem = {
      title: `${mixinName.split('(')[0]}`,
      insert: `${mixinName
        .replace(/(\$\w*:? ?[#\w-]*,?)/g, (r) => {
          argNum++;
          return `$\{${argNum}:${r.replace(/\$/, '\\$').replace(/,/, '').split(/:/)[0]}: \},`;
        })
        .replace(/,\)$/, ')')}\n`,
      detail: `Include ${mixinName} - ${pathBasename} Mixin.`,
      kind: CompletionItemKind.Method,
    };
    SEARCH_STATE[namespace] = { item, type: 'Mixin' };
  }
  /** creates a variable snippet. */
  private createVar(
    match: string,
    pathBasename: string,
    SEARCH_STATE: State,
    type: StateElement['type']
  ) {
    let [varName, value] = match.split(':').map((i) => i.trim());

    const namespace = `${pathBasename}/${varName}`;
    const item: StateItem = {
      title: varName,
      insert: varName,
      detail: `\`\`\`sass\n${varName}: ${value} \n\`\`\`\n\`\`\`sass.hover\nPath: ${pathBasename}\n\`\`\``,
      kind: CompletionItemKind.Variable,
    };
    SEARCH_STATE[namespace] = { item, type };
  }
}
