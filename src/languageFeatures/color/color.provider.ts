import {
  DocumentColorProvider,
  Color,
  TextDocument,
  Range,
  CancellationToken,
  ColorPresentation,
  ColorInformation,
  Position
} from 'vscode';
import { ColorUtilities as Utils } from './color.utils';
import { hasColor } from 'suf-regex';
import { StringToRGB } from 's.color';
export class SassColorProvider implements DocumentColorProvider {
  constructor() {}
  provideColorPresentations(
    color: Color,
    context: { document: TextDocument; range: Range },
    token: CancellationToken
  ): ColorPresentation[] {
    return [
      new ColorPresentation(Utils.convertColorToString(color, 'hex')),
      new ColorPresentation(Utils.convertColorToString(color, 'rgb'))
    ];
  }
  provideDocumentColors(document: TextDocument, token: CancellationToken): ColorInformation[] {
    const colors: ColorInformation[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      if (hasColor(line.text)) {
        const colorsPositions = SassColorProvider._GET_COLOR_POS(line.text);

        for (let j = 0; j < colorsPositions.length; j++) {
          const color = colorsPositions[j];
          const parsedColor = StringToRGB(color.text);
          if (!parsedColor) {
            continue;
          }
          const { r, g, b, a } = parsedColor;
          colors.push(
            new ColorInformation(
              new Range(
                new Position(line.range.start.line, color.start),
                new Position(line.range.start.line, color.end)
              ),
              new Color(r, g, b, a)
            )
          );
        }
      }
    }
    return colors;
  }
  /**
   * **assumes that the input is valid**
   */
  private static _GET_COLOR_POS(text: string) {
    let colors: { text: string; start: number; end: number }[] = [];
    let add = false;
    let type: 'hex' | 'rgb' = 'hex';
    let currentColor = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '#') {
        add = true;
        colors[currentColor] = { text: '', start: 0, end: 0 };
        colors[currentColor].start = i;
        colors[currentColor].text = colors[currentColor].text.concat(char);
        type = 'hex';
      } else if (/r/i.test(char) && /g/i.test(text[i + 1]) && /b/i.test(text[i + 2])) {
        type = 'rgb';
        add = true;
        colors[currentColor] = { text: '', start: 0, end: 0 };
        colors[currentColor].start = i;
        colors[currentColor].text = colors[currentColor].text.concat(char);
      } else if (add && char === ' ' && type === 'hex') {
        colors[currentColor].end = i;
        add = false;
        currentColor += 1;
      } else if (add && char === ')' && type === 'rgb') {
        colors[currentColor].text = colors[currentColor].text.concat(char);
        colors[currentColor].end = i + 1;
        add = false;
        currentColor += 1;
      } else if (add) {
        if (/[a-fA-F\d]/.test(char) && type === 'hex') {
          colors[currentColor].text = colors[currentColor].text.concat(char);
        } else if (type === 'rgb') {
          colors[currentColor].text = colors[currentColor].text.concat(char);
        } else {
          colors[currentColor].end = i;
          add = false;
          currentColor += 1;
        }
      }
      if (add && i + 1 === text.length) {
        colors[currentColor].end = i + 1;
      }
    }
    return colors;
  }
}
