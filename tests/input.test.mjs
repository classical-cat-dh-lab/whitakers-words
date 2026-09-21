import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareLatinInput,originalSurface,meaningLines} from '../browser/input.mjs';
import {createNodeAnalyzer} from '../node/index.mjs';
import {adapterLimit,comparisonView} from '../scripts/acceptance.mjs';
const analyzer=await createNodeAnalyzer();
test('macron adapter handles NFC/NFD, sentences and original spans without changing legacy',()=>{
  for(const input of ['amāre','ama\u0304re','ĀĒĪŌŪȲ āēīōūȳ','😀 amāre, amātus est!','rēm\tacū\ntetigistī']){
    const prepared=prepareLatinInput(input),result=analyzer.analyze(prepared.lookup);
    assert.ok(!/[\u0304āēīōūȳĀĒĪŌŪȲ]/u.test(prepared.lookup));
    for(const token of result.tokens){const surface=originalSurface(prepared,token.span);assert.equal(prepareLatinInput(surface).lookup,prepared.lookup.slice(token.span.start,token.span.end));}
  }
  assert.deepEqual(analyzer.analyze('amāre').tokens.map(t=>t.surface),['am','re']);
  assert.deepEqual(analyzer.analyze(prepareLatinInput('amāre').lookup).tokens.map(t=>t.surface),['amare']);
  assert.equal(prepareLatinInput('ă á ä æ œ j v λ').lookup,'ă á ä æ œ j v λ');
  assert.equal(prepareLatinInput('ā́').lookup,'á');
});
test('reading lines preserve all alternatives and the comparator preserves order and internal blanks',()=>{
  assert.deepEqual(meaningLines('event/affair/business; fact;'),['event','affair','business; fact;']);
  assert.notEqual(comparisonView('a\n\nb'),comparisonView('a\nb'));
  assert.equal(adapterLimit('@file'),'interactive-command');assert.equal(adapterLimit('amātus est'),null);
});
