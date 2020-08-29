'use strict';
import * as vscode from 'vscode';
import FormattingProvider from './languageFeatures/format/format.provider';
import { Searcher } from './autocomplete/search/autocomplete.search';
import SassCompletion from './autocomplete/autocomplete';
import { SassHoverProvider } from './languageFeatures/hover/hover.provider';
import { SassColorProvider } from './languageFeatures/color/color.provider';
import { DiagnosticsProvider } from './diagnostics/diagnostics.provider';
import { SassCodeActionProvider } from './languageFeatures/codeActions/codeActoins.provider';
import { CommandManager } from './utils/commandManager';

export interface State {
  [name: string]: StateElement;
}
export interface StateElement {
  item: StateItem;
  type: 'Mixin' | 'Variable' | 'Css Variable';
}

export type StateItem = {
  title: string;
  insert: string;
  detail: string;
  kind: vscode.CompletionItemKind;
};

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration();
  setSassLanguageConfiguration(config);

  const commandManager = new CommandManager();

  const SassFormatterRegister = vscode.languages.registerDocumentFormattingEditProvider(
    [
      { language: 'sass', scheme: 'file' },
      { language: 'sass', scheme: 'untitled' },
    ],
    new FormattingProvider(context)
  );

  // Events
  const searcher = new Searcher(context);

  let previousDocument: vscode.TextDocument = vscode.window.activeTextEditor.document;
  const activeDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (previousDocument !== undefined) {
      searcher.searchDocument(previousDocument);
    }
    if (editor !== undefined) {
      previousDocument = editor.document;
      searcher.searchDocument(editor.document);
    }
  });

  const hoverDisposable = vscode.languages.registerHoverProvider(
    [
      { language: 'sass', scheme: 'file' },
      { language: 'sass', scheme: 'untitled' },
    ],
    new SassHoverProvider(context)
  );

  const colorDisposable = vscode.languages.registerColorProvider(
    [
      { language: 'sass', scheme: 'file' },
      { language: 'sass', scheme: 'untitled' },
    ],
    new SassColorProvider()
  );

  const actionsProviderDisposable = vscode.languages.registerCodeActionsProvider(
    [
      { language: 'sass', scheme: 'file' },
      { language: 'sass', scheme: 'untitled' },
    ],
    new SassCodeActionProvider(commandManager),
    { providedCodeActionKinds: SassCodeActionProvider.providedCodeActionKinds }
  );

  const sassCompletion = new SassCompletion(context);
  const sassCompletionDisposable = vscode.languages.registerCompletionItemProvider(
    [
      { language: 'sass', scheme: 'file' },
      { language: 'sass', scheme: 'untitled' },
      { language: 'vue', scheme: 'file' },
      { language: 'vue', scheme: 'untitled' },
      { language: 'svelte', scheme: 'file' },
      { language: 'svelte', scheme: 'untitled' },
    ],
    sassCompletion,
    '\\.',
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '@',
    '/',
    '?',
    '?.',
    '+',
    '&'
  );

  const diagnostics = new DiagnosticsProvider();
  const diagnosticsCollection = vscode.languages.createDiagnosticCollection('sass');

  if (vscode.window.activeTextEditor) {
    if (config.get('sass.lint.enable')) {
      diagnostics.update(vscode.window.activeTextEditor.document, diagnosticsCollection);
    }
  }

  const changeDisposable = vscode.workspace.onDidChangeTextDocument((l) => {
    if (config.get('sass.lint.enable')) {
      diagnostics.update(l.document, diagnosticsCollection);
    }
  });

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        if (config.get('sass.lint.enable')) {
          diagnostics.update(editor.document, diagnosticsCollection);
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((configEvent: vscode.ConfigurationChangeEvent) => {
      if (configEvent.affectsConfiguration('sass')) {
        setSassLanguageConfiguration(config, diagnosticsCollection);
      }
    })
  );

  context.subscriptions.push(commandManager);

  context.subscriptions.push(changeDisposable);

  context.subscriptions.push(hoverDisposable);
  context.subscriptions.push(colorDisposable);
  context.subscriptions.push(actionsProviderDisposable);
  context.subscriptions.push(sassCompletionDisposable);
  context.subscriptions.push(SassFormatterRegister);
  context.subscriptions.push(activeDisposable);

  // context.subscriptions.push(saveDisposable);
}

function setSassLanguageConfiguration(
  config: vscode.WorkspaceConfiguration,
  diagnosticsCollection?: vscode.DiagnosticCollection
) {
  const disableAutoIndent: boolean = config.get('sass.disableAutoIndent');

  if (!config.get('sass.lint.enable') && diagnosticsCollection !== undefined) {
    diagnosticsCollection.clear();
  }

  vscode.languages.setLanguageConfiguration('sass', {
    wordPattern: /(#?-?\d*\.\d\w*%?)|([$@#!.:]?[\w-?]+%?)|[$@#!.]/g,
    onEnterRules: [
      {
        beforeText: /^((?!^(\/n|\s+|.*: .*|.*@.*|.*,|\s+\+.*)$).*|.*@media(?!^\s+$).*)$/,
        action: {
          indentAction: disableAutoIndent ? vscode.IndentAction.None : vscode.IndentAction.Indent,
        },
      },
    ],
  });
}

export function deactivate() {}
