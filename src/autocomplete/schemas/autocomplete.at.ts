import { CompletionItem, SnippetString, CompletionItemKind } from 'vscode';

export const sassAtArr = [
  {
    name: '@debug',
    body: '@debug ',
    desc: 'Prints the value to the standard error output stream',
  },
  {
    name: '@error',
    body: '@error ',
    desc: 'Throws the value as a fatal error',
  },
  {
    name: '@extend',
    body: '@extend ',
    desc: 'Inherit the styles of another selector',
  },
  {
    name: '@warn',
    body: '@warn ',
    desc: 'Prints the value to the standard error output stream',
  },
  {
    name: '@at-root',
    body: '@at-root ',
    desc: 'Causes one or more rules to be emitted at the root of the document',
  },
  {
    name: '@if',
    body: '@if ${1:statement}\n\t$0 ',
    desc: '@if statement (e.g @if 1 + 1 == 2)',
  },
  {
    name: '@for',
    body: '@for $${1:var} from ${2:1} through ${3:10}\n\t$0 ',
    desc: 'Create a new for loop',
  },
  {
    name: '@else',
    body: '@else \n\t$0',
    desc: '@else',
  },
  {
    name: '@each',
    body: '@each $${1:var} in ${2:list/map}\n\t$0 ',
    desc: 'Create a new for each loop',
  },
  {
    name: '@import',
    body: '@import ${1:filePath}',
    desc: 'Includes content of another file, will be depreciated in the future use @use instead. ',
  },
  {
    name: '@use',
    body:
      "@use ${1|.,'sass:math','sass:color','sass:string','sass:list','sass:map','sass:selector','sass:meta'|}",
    desc: `Includes content of another file or loads a built in module.

Note: Only Dart Sass currently supports loading built-in modules with @use. Users of other implementations must call functions using their global names instead.

November 2019, this will change in the future check the sass-lang.com website for more up to Date info`,
  },
  {
    name: '@media',
    body:
      '@media ${1:screen} ${2:and} ( ${3|max-width: ,min-width: ,max-height: ,min-height: |} )\n\t$0',
    desc: '@media',
  },
  {
    name: '@mixin',
    body: '@mixin ${1:name}($2)\n\t$0',
    desc: 'Create a new mixin',
  },
  {
    name: '@keyframes',
    body: '@keyframes ${1:name}\n\t0%\n\t\t$2\n\t100%\n\t\t$3',
    desc: 'Create a new animation',
  },
  {
    name: '@while',
    body: '@while $${1:i} ${2:statement}\n\t$0\n\t$${1:i}: $${1:i} ${3://increment/decrement}',
    desc: 'Create a new while loop',
  },
];

export const sassAtRaw = sassAtArr;

export const sassAt = sassAtArr.map((item) => {
  const completionItem = new CompletionItem(item.name);
  completionItem.insertText = new SnippetString(item.body);
  completionItem.detail = item.desc;
  completionItem.kind = CompletionItemKind.Function;

  return completionItem;
});
