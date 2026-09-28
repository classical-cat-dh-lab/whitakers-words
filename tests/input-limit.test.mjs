import test from 'node:test';
import assert from 'node:assert/strict';
import {withinInputLimit} from '../browser/input-limit.mjs';

test('browser admission accepts exact boundaries and rejects excess without whitespace loopholes',()=>{
  for(const separator of [' ', ',', '\n', '.', '\t']){
    assert.equal(withinInputLimit(Array(2000).fill('ārmā').join(separator)),true);
    assert.equal(withinInputLimit(Array(2001).fill('ārmā').join(separator)),false);
  }
  assert.equal(withinInputLimit('a'.repeat(20000)),true);
  assert.equal(withinInputLimit('a'.repeat(20001)),false);
  assert.equal(withinInputLimit(' '.repeat(20001)),false);
  assert.equal(withinInputLimit(''),true);
});
test('browser admission counts Unicode code points and keeps combining marks inside words',()=>{
  assert.equal(withinInputLimit('𐀀'.repeat(20000)),true);
  assert.equal(withinInputLimit('😀'.repeat(20001)),false);
  assert.equal(withinInputLimit(Array(2000).fill('a\u0304').join(',')),true);
  assert.equal(withinInputLimit(Array(2001).fill('a\u0304').join(',')),false);
  assert.equal(withinInputLimit('123!'.repeat(5000)),true);
  assert.equal(withinInputLimit('a'.repeat(1000000)),false);
});
