import {originalSurface} from './input.mjs';
import {presentAnalysis} from '../dist/reader.js';
import {renderReader,renderLookupNotes} from './render-reader.mjs';
import {orderReading} from './reading-order.mjs';
import {groupReading} from './group-reading.mjs';
import {passageSegments,renderPassage} from './passage.mjs';
import {createAnalyzerClient} from './analyzer-client.mjs';
import {withinInputLimit} from './input-limit.mjs';
const $=selector=>document.querySelector(selector);
let analyzerState='loading', lookupRunning=false, validationRunning=false, validationAbort;
function updateAnalyzerControls(){
  $('#analyze').disabled=analyzerState!=='ready'||lookupRunning;
  $('#validate').disabled=analyzerState!=='ready'||validationRunning;
  $('#clear-input').disabled=lookupRunning;
  $('#retry-analyzer').hidden=analyzerState!=='failed';
  $('#cancel-lookup').hidden=!(lookupRunning||validationRunning);
}
const client=createAnalyzerClient({
  createWorker:()=>new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'}),
  onState:(state,message)=>{analyzerState=state;$('#status').textContent=state==='ready'?'Ready to look up.':state==='loading'?'Loading dictionary…':message+' Use Reload dictionary to try again.';updateAnalyzerControls();}
});
$('#retry-analyzer').addEventListener('click',()=>client.start());
$('#cancel-lookup').addEventListener('click',()=>{validationAbort?.abort();client.stop('Analysis stopped.');});
const query=(input,mode)=>client.query(input,mode);
let currentReading, resultView='text';
function renderTechnicalOutput(){
  if(!currentReading)return;
  if($('#json-panel').open&&!$('#json-output').textContent)$('#json-output').textContent=JSON.stringify(currentReading.structured,null,2);
  if($('#legacy-panel').open&&!$('#legacy-output').textContent)$('#legacy-output').textContent=currentReading.analysis.legacyText||'No output.';
  if($('#notes-panel').open&&!$('#notes-output').childNodes.length)renderLookupNotes($('#notes-output'),currentReading.view);
}
for(const id of ['json-panel','legacy-panel','notes-panel'])$('#'+id).addEventListener('toggle',renderTechnicalOutput);
function updateDisplayOptions(){
  for(const [option,panel] of [['legacy','legacy-panel'],['json','json-panel'],['notes','notes-panel'],['validation','validation']]){
    const target=$('#'+panel);target.hidden=!$('#show-'+option).checked;
    if(target.hidden)target.open=false;
  }
  const passage=currentReading?.view.language==='latin'&&currentReading.view.tokens.length>1;
  $('#result-view-tabs').hidden=!passage;
  $('#passage-view').hidden=!passage||resultView==='list';
  $('#reader-output').hidden=passage&&resultView==='text';
  for(const tab of document.querySelectorAll('[role="tab"]')){
    const selected=tab.dataset.view===resultView;
    tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
  }
  if(passage){$('#reader-output').setAttribute('role','tabpanel');$('#reader-output').setAttribute('aria-labelledby','view-list');}
  else{$('#reader-output').removeAttribute('role');$('#reader-output').removeAttribute('aria-labelledby');}
}
const viewTabs=[...document.querySelectorAll('#result-view-tabs [role="tab"]')];
for(const [index,tab] of viewTabs.entries()){
  tab.addEventListener('click',()=>{resultView=tab.dataset.view;updateDisplayOptions();});
  tab.addEventListener('keydown',event=>{
    const next=event.key==='Home'?0:event.key==='End'?viewTabs.length-1:event.key==='ArrowRight'?(index+1)%viewTabs.length:event.key==='ArrowLeft'?(index+viewTabs.length-1)%viewTabs.length:null;
    if(next===null)return;
    event.preventDefault();viewTabs[next].click();viewTabs[next].focus();
  });
}
function updateConnection(){
  $('#connection-status').textContent=(navigator.onLine?'Online':'Offline')+' · On-device lookup';
}
window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);updateConnection();
for(const checkbox of document.querySelectorAll('.display-options input'))checkbox.addEventListener('change',updateDisplayOptions);
updateDisplayOptions();
function updateInputPrompt(){
  const mode=$('#mode').value,english=mode==='english';
  $('label[for="input"]').textContent=english?'English word':'Latin word, phrase or sentence';
  $('#input').lang=english?'en':'la';
  $('#input').placeholder=english?'Type an English word, then press Enter / Return.':'Type Latin here, then press Enter / Return.';
  $('#input-help').textContent=english?'Enter / Return to look up one English word.':'Enter / Return to look up · Shift + Enter / Return for a new line.';
}
$('#mode').addEventListener('change',updateInputPrompt);updateInputPrompt();
function clearInputError(){
  $('#input-error').hidden=true;$('#input').removeAttribute('aria-invalid');
}
$('#input').addEventListener('input',clearInputError);
$('#clear-input').addEventListener('click',()=>{
  clearInputError();
  $('#input').value='';currentReading=undefined;$('#results').hidden=true;
  for(const id of ['reader-output','passage-text','passage-detail','legacy-output','json-output','notes-output'])$('#'+id).replaceChildren();
  for(const panel of document.querySelectorAll('#results details'))panel.open=false;
  updateDisplayOptions();if(!$('#analyze').disabled)$('#status').textContent='Ready to look up.';$('#input').focus();$('#input').scrollIntoView({block:'center'});
});
$('#back-to-top').addEventListener('click',event=>{event.preventDefault();$('#page-title').focus({preventScroll:true});window.scrollTo(0,0);});
function renderCurrentReading(preserveOpen=false){
  const openIndex=preserveOpen?[...document.querySelectorAll('.reader-accordion')].findIndex(panel=>panel.open):-1;
  const {view,analysis}=currentReading;
  const ordered=groupReading(orderReading(view,analysis,$('#original-order').checked?'original':'frequency'));
  renderReader($('#reader-output'),ordered,{failed:analysis.status==='legacy-error'});
  if(view.language==='latin'&&view.tokens.length>1)renderPassage($('#passage-text'),$('#passage-detail'),currentReading.segments,ordered,currentReading.selected,index=>{currentReading.selected=index;});
  else{$('#passage-text').replaceChildren();$('#passage-detail').replaceChildren();}
  updateDisplayOptions();
  if(openIndex>=0){const panel=document.querySelectorAll('.reader-accordion')[openIndex];if(panel)panel.open=true;}
}
$('#original-order').addEventListener('change',()=>{if(currentReading)renderCurrentReading(true);});
$('#input').addEventListener('keydown',event=>{
  if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing&&event.keyCode!==229){event.preventDefault();if(!$('#analyze').disabled&&$('#input').value.trim())$('#analysis-form').requestSubmit();}
});
$('#analysis-form').addEventListener('submit',async event=>{
  event.preventDefault();if($('#analyze').disabled)return;
  if(!withinInputLimit($('#input').value)){
    $('#input-error').hidden=false;$('#input').setAttribute('aria-invalid','true');$('#input').focus();return;
  }
  clearInputError();if(!$('#input').value.trim())return;lookupRunning=true;updateAnalyzerControls();$('#status').textContent='Looking up…';
  try{
    const original=$('#input').value;
    const {result,inputAdapter,milliseconds}=await query(original,$('#mode').value);
    const analysis=result.corrected??result,view=presentAnalysis(analysis);
    if(inputAdapter){
      view.tokens.forEach((token,i)=>token.surface=originalSurface(inputAdapter,analysis.tokens[i].span));
      if(inputAdapter.lookup!==inputAdapter.original)view.notes.unshift('Macrons are ignored for lookup; the reading view retains your original spelling.');
    }
    currentReading={analysis,view,structured:inputAdapter?{inputAdapter,result}:result,selected:0,segments:view.language==='latin'?passageSegments(original,analysis.tokens,inputAdapter):[]};renderCurrentReading();
    $('#results').hidden=false;
    for(const id of ['legacy-output','json-output','notes-output'])$('#'+id).replaceChildren();
    renderTechnicalOutput();
    $('#status').textContent=analysis.status==='legacy-error'?'Stopped: original WORDS encountered an error.':`Complete (${milliseconds<0.1?'<0.1':milliseconds.toFixed(1)} ms).`;
    if(matchMedia('(max-width: 48rem) and (pointer: coarse)').matches){$('#input').blur();$('#result-heading').focus({preventScroll:true});$('#result-heading').scrollIntoView({block:'start'});}
  }
  catch(error){if(analyzerState!=='failed')$('#status').textContent='Error: '+error.message;}finally{lookupRunning=false;updateAnalyzerControls();}
});
$('#validate').addEventListener('click',async()=>{
  validationAbort=new AbortController();
  validationRunning=true;updateAnalyzerControls();$('#validation-results').replaceChildren();$('#validation-status').textContent='Checking validation cases…';
  try{
    const response=await fetch(new URL('./validation-cases.json',import.meta.url),{signal:validationAbort.signal});if(!response.ok)throw new Error('Cannot load validation cases');const cases=await response.json();let passed=0;
    for(const c of cases){const {result}=await query(c.input,c.mode);const actual=JSON.stringify(result),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(actual))),x=>x.toString(16).padStart(2,'0')).join('');const ok=digest===c.sha256;passed+=Number(ok);const item=document.createElement('li');item.textContent=`${ok?'PASS':'FAIL'} — ${c.label}`;item.className=ok?'pass':'fail';$('#validation-results').append(item);}
    $('#validation-status').textContent=`Validation: ${passed}/${cases.length} match the Node structured results.`;
  }catch(error){$('#validation-status').textContent=error.name==='AbortError'?'Validation stopped.':'Error: '+error.message;}finally{validationAbort=undefined;validationRunning=false;updateAnalyzerControls();}
});

client.start();
