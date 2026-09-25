import {originalSurface} from './input.mjs';
import {presentAnalysis} from '../dist/reader.js';
import {renderReader,renderAbbreviations} from './render-reader.mjs';
const worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});
const $=selector=>document.querySelector(selector),pending=new Map();let sequence=0;
function updateInputPrompt(){
  const mode=$('#mode').value,english=mode==='english';
  $('label[for="input"]').textContent=english?'English word':'Latin word, phrase or sentence';
  $('#input').lang=english?'en':'la';
  $('#input').placeholder=english?'Type an English word, then press Enter / Return.':'Type Latin here, then press Enter / Return.';
  $('#input-help').textContent=english?'Enter / Return to look up an English word.':mode==='latin'?'Enter / Return to look up · Shift + Enter for a new line. Macrons are welcome.':'Original WORDS input rules: macrons are not removed and may split words. Use Latin lookup for text with macrons. Enter / Return to look up.';
}
$('#mode').addEventListener('change',updateInputPrompt);updateInputPrompt();
$('#new-lookup').addEventListener('click',event=>{event.preventDefault();$('#input').focus();$('#input').select();$('#input').scrollIntoView({block:'center'});});
renderAbbreviations($('#abbreviation-table'));
$('#abbreviations-link').addEventListener('click',()=>{$('#abbreviations').open=true;});
function query(input,mode='legacy'){return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});worker.postMessage({id,input,mode});});}
worker.addEventListener('message',({data})=>{
  if(data.type==='ready'){$('#status').textContent=`Data verified. Ready (${Math.round(data.loadMilliseconds)} ms to load).`;$('#analyze').disabled=false;$('#validate').disabled=false;}
  if(data.type==='error'){$('#status').textContent='Error: '+data.message;pending.get(data.id)?.reject(new Error(data.message));pending.delete(data.id);}
  if(data.type==='result'){pending.get(data.id)?.resolve(data);pending.delete(data.id);}
});
worker.addEventListener('error',error=>{$('#status').textContent='Worker error: '+error.message;for(const p of pending.values())p.reject(error);pending.clear();});
$('#input').addEventListener('keydown',event=>{
  if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing&&event.keyCode!==229){event.preventDefault();if(!$('#analyze').disabled&&$('#input').value.trim())$('#analysis-form').requestSubmit();}
});
$('#analysis-form').addEventListener('submit',async event=>{
  event.preventDefault();if($('#analyze').disabled||!$('#input').value.trim())return;$('#analyze').disabled=true;$('#status').textContent='Analyzing…';
  try{const {result,milliseconds,inputAdapter}=await query($('#input').value,$('#mode').value);const analysis=result.corrected??result;const view=presentAnalysis(analysis);if(inputAdapter){view.tokens.forEach((token,i)=>token.surface=originalSurface(inputAdapter,analysis.tokens[i].span));if(inputAdapter.lookup!==inputAdapter.original)view.notes.unshift('Macrons are ignored for lookup; your original spelling is shown below.');}renderReader($('#reader-output'),view);$('#legacy-output').textContent=analysis.legacyText||'No Latin tokens.';$('#json-output').textContent=JSON.stringify(inputAdapter?{inputAdapter,result}:result,null,2);$('#status').textContent=`Complete (${milliseconds.toFixed(1)} ms).`;if(matchMedia('(max-width: 48rem) and (pointer: coarse)').matches){$('#input').blur();$('#result-heading').focus({preventScroll:true});$('#result-heading').scrollIntoView({block:'start'});}}
  catch(error){$('#status').textContent='Error: '+error.message;}finally{$('#analyze').disabled=false;}
});
$('#validate').addEventListener('click',async()=>{
  $('#validate').disabled=true;$('#validation').open=true;$('#validation-results').replaceChildren();
  try{
    const response=await fetch('./validation-cases.json');if(!response.ok)throw new Error('Cannot load validation cases');const cases=await response.json();let passed=0;
    for(const c of cases){const {result}=await query(c.input,c.mode);const actual=JSON.stringify(result),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(actual))),x=>x.toString(16).padStart(2,'0')).join('');const ok=digest===c.sha256;passed+=Number(ok);const item=document.createElement('li');item.textContent=`${ok?'PASS':'FAIL'} — ${c.label}`;item.className=ok?'pass':'fail';$('#validation-results').append(item);}
    $('#status').textContent=`Validation: ${passed}/${cases.length} match the Node structured results.`;
  }catch(error){$('#status').textContent='Error: '+error.message;}finally{$('#validate').disabled=false;}
});
