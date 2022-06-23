import {
  TextDocument,
  Position,
  CancellationToken,
  HoverProvider,
  ProviderResult,
  Hover,
  TextLine,
  ExtensionContext,
} from 'vscode';

import { AutocompleteUtils } from '../../autocomplete/autocomplete.utility';
import { isProperty, isVar } from 'suf-regex';
import { basename } from 'path';
import { Searcher } from '../../autocomplete/search/autocomplete.search';

export class SassHoverProvider implements HoverProvider {
  search: Searcher;
  constructor(public context: ExtensionContext) {
    this.search = new Searcher(context);
  }
  provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Hover> {
    const line = document.lineAt(position.line);

    if (isProperty(line.text) || isVar(line.text)) {
      const currentWord = SassHoverProvider.getCurrentWord(line, position);

      const varName = currentWord.replace(/^var\((.+?)\)$/, '$1');
      if (/^(--|\$)/.test(varName)) {
        return this.variableHover(document, varName.replace(/:$/, ''));
      }

      if (currentWord.endsWith(':')) {
        const name = currentWord.replace(/:$/, '');
        const propData = AutocompleteUtils.findPropertySchema(name);

        if (propData) {
          return {
            contents: [
              `\`\`\`sass.hover\n${name}: CSS property\n\`\`\``,
              `${AutocompleteUtils.constructDocumentation(propData)}`,
            ],
          };
        }
      }
    }
    return null;
  }
  private variableHover(document: TextDocument, name: string) {
    let { imports } = AutocompleteUtils.getImports(document);
    imports.unshift({ path: basename(document.fileName), namespace: undefined });

    this.search.searchDocument(document);

    let result: ProviderResult<Hover> = null;

    AutocompleteUtils.ImportsLoop(imports, document, this.context, (element) => {
      if (element.item.title === name) {
        result = {
          contents: [element.item.detail],
        };
        return true;
      }
    });
    if (result === null) {
      return {
        contents: ['variable declaration not found.'],
      };
    }
    return result;
  }

  private static getCurrentWord(line: TextLine, position: Position) {
    let firstHalfArr = [];
    for (let i = position.character - 1; i >= 0; i--) {
      const char = line.text[i];
      if (char === ' ') {
        break;
      }

      firstHalfArr.unshift(char);
    }
    let firstHalf = firstHalfArr.join('');
    let secondHalf = '';
    for (let i = position.character; i < line.text.length; i++) {
      const char = line.text[i];
      if (char === ' ') {
        break;
      }

      secondHalf = secondHalf + char;
    }
    return firstHalf + secondHalf;
  }
}
