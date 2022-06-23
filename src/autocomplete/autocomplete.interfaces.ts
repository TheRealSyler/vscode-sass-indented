import { MarkupContent } from 'vscode-languageserver-types';

export interface BasicRawCompletion {
  name: string;
  desc?: string;
  browsers?: string;
  body?: string;
  status?: string;
  mdn_url?: string;
  restriction?: string;
  values?: { name?: string; desc?: string; browsers?: string }[];
}

// Following types taken from https://github.com/microsoft/vscode-css-languageservice/blob/main/src/cssLanguageTypes.ts

export type EntityStatus =
  | 'standard'
  | 'experimental'
  | 'nonstandard'
  | 'obsolete';

export interface IReference {
  name: string;
  url: string;
}
export interface IPropertyData {
  name: string;
  description?: string | MarkupContent;
  browsers?: string[];
  restrictions?: string[];
  status?: EntityStatus;
  syntax?: string;
  values?: IValueData[];
  references?: IReference[];
  relevance?: number;
}
export interface IAtDirectiveData {
  name: string;
  description?: string | MarkupContent;
  browsers?: string[];
  status?: EntityStatus;
  references?: IReference[];
}
export interface IPseudoClassData {
  name: string;
  description?: string | MarkupContent;
  browsers?: string[];
  status?: EntityStatus;
  references?: IReference[];
}
export interface IPseudoElementData {
  name: string;
  description?: string | MarkupContent;
  browsers?: string[];
  status?: EntityStatus;
  references?: IReference[];
}

export interface IValueData {
  name: string;
  description?: string | MarkupContent;
  browsers?: string[];
  status?: EntityStatus;
  references?: IReference[];
}

export interface CSSData {
  version: number;
  properties?: IPropertyData[];
  atDirectives?: IAtDirectiveData[];
  pseudoClasses?: IPseudoClassData[];
  pseudoElements?: IPseudoElementData[];
}

export interface CSSDataV1 extends CSSData {
  version: 1 | 1.1
}


export type NonPropertyEntity =
  | IAtDirectiveData
  | IPseudoClassData
  | IPseudoElementData
  | IValueData;

export type RawCssEntity =
  | IPropertyData
  | IAtDirectiveData
  | IPseudoClassData
  | IPseudoElementData
  | IValueData;
