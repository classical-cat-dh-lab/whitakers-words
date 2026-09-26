import test from 'node:test';
import assert from 'node:assert/strict';
import {createNodeAnalyzer} from '../node/index.mjs';
import {prepareLatinInput} from '../browser/input.mjs';
import {passageSegments} from '../browser/passage.mjs';
const analyzer=await createNodeAnalyzer();

test('passage occurrences retain exact submitted text and returned token correspondence',()=>{
  for(const original of ['  arma, arma!\nvirumque cano.','ama\u0304re, amāre;\r\nrem\tacū!','你好 rem 😀 acu','mecum multusque amatus est','<script>alert(1)</script>','123 ???']){
    const adapter=prepareLatinInput(original),result=analyzer.analyze(adapter.lookup);
    const segments=passageSegments(original,result.tokens,adapter);
    assert.equal(segments.map(part=>part.text).join(''),original);
    const words=segments.filter(part=>part.index!==undefined);
    assert.deepEqual(words.map(part=>part.index),result.tokens.map((_,index)=>index));
    for(const word of words){const span=result.tokens[word.index].span;assert.equal(word.text,original.slice(adapter.spans[span.start].start,adapter.spans[span.end-1].end));}
  }
  const text='arma arma',segments=passageSegments(text,analyzer.analyze(text).tokens);
  assert.deepEqual(segments,[{text:'arma',index:0},{text:' '},{text:'arma',index:1}]);
});
