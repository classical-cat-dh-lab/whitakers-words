import {ABBREVIATIONS} from '../dist/terminology.js';

const ordinals = {first: '1st', second: '2nd', third: '3rd', fourth: '4th', fifth: '5th'};

// Shorten reading labels only; preserve the frozen result and expanded meaning.
export function compactTerm(term) {
  if (term.id === 'declension') return {...term, text: 'decl'};
  if (term.id === 'conjugation') return {...term, text: 'conj'};
  if (!/\b(?:first|second|third|fourth|fifth)\b.*\b(?:decl|conj)\./.test(term.text)) return term;
  return {...term, text: term.text
    .replace(/\b(first|second|third|fourth|fifth)\b/g, word => ordinals[word])
    .replace(/\b(decl|conj)\./g, '$1')};
}

export const READING_ABBREVIATIONS = ABBREVIATIONS.map(compactTerm);
