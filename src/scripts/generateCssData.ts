/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------
 * File originally from https://github.com/microsoft/vscode-css-languageservice/blob/main/build/generateData.js,
 * converted to typescript.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

import customData from '@vscode/web-custom-data/data/browsers.css-data.json';
import { CSSDataV1 } from '../autocomplete/autocomplete.interfaces';

function toJsonString(obj: CSSDataV1) {
	return JSON.stringify(obj, null, '\t');
}

const DATA_TYPE = 'CSSDataV1';
const output = [
	'/*---------------------------------------------------------------------------------------------',
	' *  Copyright (c) Microsoft Corporation. All rights reserved.',
	' *  Licensed under the MIT License. See License.txt in the project root for license information.',
	' *--------------------------------------------------------------------------------------------*/',
	'// file generated from @vscode/web-custom-data NPM package',
	'',
	`import { CSSDataV1 } from '../../autocomplete.interfaces';`,
	'',
	`export const cssData : ${DATA_TYPE} = ` + toJsonString(customData as CSSDataV1) + ';'
];

var outputPath = path.resolve(__dirname, '../autocomplete/schemas/generatedData/rawCssData.ts');
console.log('Writing to: ' + outputPath);
var content = output.join(os.EOL);
fs.writeFileSync(outputPath, content);
console.log('Done generating "rawCssData.ts"');
