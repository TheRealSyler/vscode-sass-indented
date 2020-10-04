import {
  DocumentFormattingEditProvider,
  ExtensionContext,
  TextDocument,
  ProviderResult,
  TextEdit,
  Range,
  FormattingOptions,
  workspace,
  Position,
  EndOfLine,
} from 'vscode';

import { SassFormatter } from 'sass-formatter';

class FormattingProvider implements DocumentFormattingEditProvider {
  context: ExtensionContext;
  constructor(context: ExtensionContext) {
    this.context = context;
  }
  provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions
  ): ProviderResult<TextEdit[]> {
    const config = workspace.getConfiguration('sass.format');
    if (config.get('enabled')) {
      return [
        new TextEdit(
          document.validateRange(
            new Range(new Position(0, 0), new Position(document.lineCount + 1, 10))
          ),
          SassFormatter.Format(document.getText(), {
            ...options,
            convert: config.get('convert'),
            debug: config.get('debug'),
            deleteEmptyRows: config.get('deleteEmptyRows'),
            deleteWhitespace: config.get('deleteWhitespace'),
            setPropertySpace: config.get('setPropertySpace'),
            lineEnding: EndOfLine[document.eol] as 'LF' | 'CRLF',
          })
        ),
      ];
    }
    return [];
  }
}

export default FormattingProvider;
