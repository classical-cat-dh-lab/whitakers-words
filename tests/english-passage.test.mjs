import test from 'node:test';
import assert from 'node:assert/strict';
import {createNodeAnalyzer} from '../node/index.mjs';
import {presentAnalysis} from '../dist/reader.js';
import {lookupEnglishPassage,presentEnglishPassage} from '../browser/english-passage.mjs';
import {passageSegments} from '../browser/passage.mjs';
const analyzer=await createNodeAnalyzer();

test('English passage keeps every occurrence and exact text, including unknown words first',()=>{
  const input='  the love, QUEEN!\nqueen -- dog; the. 😀',result=lookupEnglishPassage(analyzer,input);
  const view=presentEnglishPassage(result),segments=passageSegments(input,result.tokens);
  assert.equal(segments.map(part=>part.text).join(''),input);
  assert.deepEqual(view.tokens.map(token=>token.surface),['the','love','QUEEN','queen','dog','the']);
  assert.deepEqual(segments.filter(part=>part.index!==undefined).map(part=>part.index),[0,1,2,3,4,5]);
  assert.equal(view.tokens[0].status,'unknown');assert.equal(view.tokens[5].items.length,0);
  assert.match(view.tokens[1].items[0].title,/amor/);
  assert.match(view.tokens[3].items[0].title,/regina/);
  for(const token of result.tokens){
    assert.deepEqual(token.result,analyzer.lookupEnglish(token.surface));
    assert.deepEqual(view.tokens[result.tokens.indexOf(token)].items,presentAnalysis(token.result).tokens[0].items);
  }
});

test('a native error stays local to its word and does not stop later lookups',()=>{
  const result=lookupEnglishPassage(analyzer,'make queen make dog'),before=JSON.stringify(result);
  assert.equal(result.failures,2);
  const view=presentEnglishPassage(result);
  assert.equal(view.tokens[0].status,'legacy-error');assert.equal(view.tokens[2].status,'legacy-error');
  assert.ok(view.tokens[1].items.length);assert.ok(view.tokens[3].items.length);
  assert.equal(JSON.stringify(result),before);
});

test('unsupported whole spellings never fall through to misleading ASCII prefix matches',()=>{
  const input="don't can’t naïve e\u0301té 你好 queen",calls=[];
  const result=lookupEnglishPassage({lookupEnglish(word){calls.push(word);return analyzer.lookupEnglish(word);}},input);
  assert.deepEqual(calls,['queen']);
  assert.deepEqual(result.tokens.map(token=>token.surface),["don't",'can’t','naïve','e\u0301té','你好','queen']);
  assert.ok(presentEnglishPassage(result).tokens.slice(0,-1).every(token=>token.status==='unknown'&&!token.items.length));
  assert.equal(passageSegments(input,result.tokens).map(part=>part.text).join(''),input);
  assert.deepEqual(presentEnglishPassage(lookupEnglishPassage(analyzer,'123 😀 ???')).tokens,[]);
});

test('batching preserves exact plural spelling and remains bounded at the browser word cap',()=>{
  const calls=[],input='dogs '.repeat(2000),result=lookupEnglishPassage({lookupEnglish(word){calls.push(word);return analyzer.lookupEnglish(word);}},input);
  assert.equal(result.tokens.length,2000);assert.deepEqual(calls,['dogs']);
  assert.deepEqual(result.tokens[1999].result,analyzer.lookupEnglish('dogs'));
  assert.notEqual(result.tokens[0].result.totalHits,analyzer.lookupEnglish('dog').totalHits);
});
