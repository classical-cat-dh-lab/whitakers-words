import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const css = await readFile(new URL('../browser/night-theme.css', import.meta.url), 'utf8');
const colors = Object.fromEntries([...css.matchAll(/--((?:ds|words)-color-[\w-]+):\s*(#[0-9A-F]{6})/g)].map(([,role,value]) => [role,value]));
const color = role => colors['ds-color-' + role] ?? colors['words-color-' + role];
function luminance(hex) {
  return hex.slice(1).match(/../g).map(value => parseInt(value,16)/255)
    .map(value => value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4)
    .reduce((total,value,index) => total + value*[.2126,.7152,.0722][index], 0);
}
function contrast(first, second) {
  const values = [luminance(color(first)),luminance(color(second))].sort((a,b) => b-a);
  return (values[0]+.05)/(values[1]+.05);
}

test('night text, actions, focus and control edges retain readable contrast without bright fills', () => {
  for (const foreground of ['text-primary','text-muted','text-muted-bw','brand-title','section-title','link','source','caption','table-header','success','error','warning-text']) {
    for (const surface of ['surface-base','surface-raised']) assert.ok(contrast(foreground,surface) >= 4.5, foreground + '/' + surface);
  }
  assert.ok(contrast('text-primary','surface-raised') >= 7);
  assert.ok(contrast('action-ink','action-primary') >= 4.5);
  for (const surface of ['surface-base','surface-raised']) {
    assert.ok(contrast('control-border',surface) >= 3);
    assert.ok(contrast('focus',surface) >= 3);
    assert.ok(contrast('action-border',surface) >= 3);
  }
  assert.ok(contrast('action-border','action-primary') >= 3);
  assert.ok(contrast('focus','action-primary') >= 3);
  assert.ok(luminance(color('action-primary')) < .1);
  assert.ok(luminance(color('text-primary')) < luminance('#DFE2DA'));
  assert.ok(luminance(color('brand-title')) < luminance('#D4AF37'));
  assert.ok(Object.values(colors).every(value => !['#000000','#FFFFFF'].includes(value)));
});
