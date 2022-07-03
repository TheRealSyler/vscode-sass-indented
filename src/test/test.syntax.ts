import { TestGrammar } from 'test-grammar';
import type { Run } from 'test-grammar/dist/interfaces';
export function RunSyntaxTests() {

      new TestGrammar(`syntaxes/sass.tmLanguage.json`, null, testFunction);
}
function testFunction(run: Run) {
      const propName = 'support.type.property-name.css.sass.prop.name';
      const prop = 'meta.property-list.css.sass.prop';
      const propVal = 'meta.property-value.css.sass support.constant.property-value.css.sass';
      const constNum = 'constant.numeric.css.sass';
      const constChar = 'constant.character.css.sass';
      const supType = 'support.type.css.sass';
      const unit = 'keyword.control.unit.css.sass';
      const _class = 'entity.other.attribute-name.class.css.sass';
      const id = 'entity.other.attribute-name.id.css.sass';
      const operator = 'keyword.operator.sass';
      const comma = 'comment.punctuation.comma.sass';
      const tag = 'entity.name.tag.css.sass.symbol';
      const pseudo = 'entity.other.attribute-name.pseudo-class.css.sass';
      const color = 'constant.language.color.rgb-value.css.sass';
      const commentBlock = 'comment.block.sass';
      const commentLine = 'comment.line.sass';
      const func = 'entity.name.function';
      const funcClose = 'entity.name.function.close';
      const quote = 'string.quoted.double.css.sass';
      const varSSM = 'sass.script.maps';
      const varSSMn = 'variable.other.name';
      const varRoot = 'variable.other.root';
      const _var = 'variable.other.value';
      const at = 'keyword.control.at-rule.css.sass';
      const atFunc = 'support.function.name.sass keyword.control.at-rule.css.sass';
      const atFuncName = 'support.function.name.sass entity.name.function';
      const funcBase = 'support.function.name.sass';
      const atInclude = 'support.function.name.sass.library';
      const atIncludeName = 'keyword.control.at-rule.css.sass';
      const atUseBase = 'sass.use';
      const atUse = 'keyword.control.at-rule.css.sass.use';
      const parenOpen = 'entity.name.function.parenthesis.open';
      const parenClose = 'entity.name.function.parenthesis.close';
      const colon = 'meta.property-list.css.sass.colon';
      const flag = 'keyword.other.important.css.sass';
      const invalid = 'invalid';
      const _module = 'constant.character.module';
      const moduleName = 'constant.character.module.name';
      const moduleDot = 'constant.numeric.module.dot';
      const cssVariable = 'variable.css';
      const importCssVar = 'comment.import.css.variables';
      const control = 'keyword.control';
      const jsDoc = 'storage.type.class.jsdoc';
      console.log(''); // add new line for visual purposes.
      run(
            'Property ',
            `  margin: 100px
-moz-binding: none
width: $width
border: solid 2px #234
top: 43.5%
left: MATH.abs(-2px)`,
            `|${propName}|${prop}|${prop}|${prop} ${constNum}|${prop} ${unit}
${propName}|${prop}|${prop}|${prop} ${propVal}
${propName}|${prop}|${prop}|${prop} ${_var}
${propName}|${prop}|${prop}|${prop} ${propVal}|${prop}|${prop} ${constNum}|${prop} ${unit}|${prop}|${prop} ${color}
${propName}|${prop}|${prop}|${prop} ${constNum}|${prop} ${unit}
${propName}|${prop}|${prop}|${prop} ${_module} ${moduleName}|${prop} ${_module} ${moduleDot}|${prop} ${func}|${prop} ${constNum}|${prop} ${unit}|${prop} ${funcClose}`
      );
      run(
            'Class    ',
            `.class
.class + #id
.class::after
div.class
#id.class
.class#id`,
            `${_class}|${_class}
${_class}|${_class}||${operator}||${id}|${id}
${_class}|${_class}|${_class} ${pseudo}
${tag}|${_class}|${_class}
${id}|${id}|${_class}|${_class}
${_class}|${_class}`
      );
      run(
            'Id       ',
            `#id
#id + .class
#id::after
div#id
.class #id`,
            `${id}|${id}
${id}|${id}||${operator}||${_class}|${_class}
${id}|${id}|${id} ${pseudo}
${tag}|${id}|${id}
${_class}|${_class}||${id}|${id}`
      );
      run(
            'Comma    ',
            `#id,
.class,
div,
div + .class,`,
            `${id}|${id}|${comma}
${_class}|${_class}|${comma}
${tag}|${comma}
${tag}||${operator}||${_class}|${_class}|${comma}`
      );
      run(
            'Comment  ',
            `/**
 Comment
 * @at test
 */
// Comment
/* a */`,
            `${commentBlock}|${commentBlock}
${commentBlock}
${commentBlock}|${commentBlock} ${jsDoc}|${commentBlock}
${commentBlock}|${commentBlock}
${commentLine}|${commentLine}
${commentBlock}|${commentBlock}|${commentBlock}`
      );

      run(
            '@        ',
            `@debug ((unquote(".main"))
@mixin name($property, $value)
@function name($property: 2fr)
@include reset-list;
@use 'buttons' as btn
@use 'library' with ($black: #222)
@use './sass'`,
            `${at}|${at}|${at}|${func}|${func}|${func}|${quote}|${quote}|${quote}|${funcClose}|${funcClose}
${atFunc}|${funcBase}|${atFuncName}|${func}|${varRoot}|${comma}||${varRoot}|${funcClose}
${atFunc}|${funcBase}|${atFuncName}|${func}|${varSSM} ${varSSMn}|${varSSM}|${varSSM} ${constNum}|${varSSM} ${unit}|${funcClose}
${atInclude} ${atIncludeName}|${atInclude}
${atUseBase} ${atUse}|${atUseBase}|${atUseBase} ${constChar}|${atUseBase}|${atUseBase} ${supType}|${atUseBase}|${atUseBase} ${constChar}
${atUseBase} ${atUse}|${atUseBase}|${atUseBase} ${constChar}|${atUseBase}|${atUseBase} ${supType}|${atUseBase}|${atUseBase} ${parenOpen}|${atUseBase} ${varRoot}|${atUseBase} ${colon}|${atUseBase}|${atUseBase} ${color}|${atUseBase} ${parenClose}
${atUseBase} ${atUse}|${atUseBase}|${atUseBase} ${constChar}`
      );
      run(
            'Variables',
            `$border-dark: rgba($base-color, 0.88);
$black: #000 !default
corners.$radius`,
            `${varSSM} ${varSSMn}|${varSSM}|${varSSM} ${funcBase}|${varSSM}|${varSSM} ${_var}|${varSSM} ${comma}|${varSSM}|${varSSM} ${constNum}|${varSSM}|${varSSM} ${invalid}
${varSSM} ${varSSMn}|${varSSM}|${varSSM} ${color}|${varSSM}|${varSSM} ${flag}
${_module} ${moduleName}|${_module} ${moduleDot}|${varRoot}`
      );

      run(
            'Css Variables',
            `margin: var(--test) calc(1 + 1)
// import css-variables from '../folder/file'`,
            `${propName}|${prop}|${prop}|${prop} ${func}|${prop} ${cssVariable}|${prop} ${funcClose}|${prop}|${prop} ${func}|${prop} ${constNum}|${prop}|${prop} ${operator}|${prop}|${prop} ${constNum}|${prop} ${funcClose}
${importCssVar}|${importCssVar} ${control}|${importCssVar}|${importCssVar} variable|${importCssVar}|${importCssVar} ${control}|${importCssVar}|${importCssVar} ${constChar}`
      );
      run(
            'Html Root',
            `:root
  slot`,
            `${pseudo}
|${tag}`
      );

}
