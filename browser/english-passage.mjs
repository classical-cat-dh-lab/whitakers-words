import {presentAnalysis} from '../dist/reader.js';

// Browser-only batching. Each result is an unchanged single-word engine result;
// spans refer to UTF-16 offsets in the exact submitted text.
export function lookupEnglishPassage(analyzer,input){
  const tokens=[],cache=new Map();
  for(const match of input.matchAll(/\p{L}[\p{L}\p{M}]*(?:['’][\p{L}\p{M}]+)*/gu)){
    const surface=match[0];let result=null;
    // Do not let the native ASCII scanner silently search a prefix of a word
    // containing an apostrophe or an unsupported letter.
    if(/^[a-z]+$/i.test(surface)){
      if(!cache.has(surface))cache.set(surface,analyzer.lookupEnglish(surface));
      result=cache.get(surface);
    }
    tokens.push({surface,span:{start:match.index,end:match.index+surface.length},result});
  }
  return {adapter:'english-passage-v1',input,tokens,
    failures:tokens.filter(token=>token.result?.status==='legacy-error').length,
    legacyText:tokens.map(token=>token.result?.legacyText??'').join('\n')};
}

export function presentEnglishPassage(passage){
  return {language:'english',tokens:passage.tokens.map(({surface,result})=>{
    if(!result)return {surface,status:'unknown',items:[],notes:['This spelling is not supported by the original English index.']};
    const view=presentAnalysis(result),token=view.tokens[0];
    return {...token,surface,notes:[...view.notes,...token.notes]};
  }),notes:[]};
}
