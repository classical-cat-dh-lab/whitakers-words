import {meaningLines} from './input.mjs';
import {compactTerm,READING_ABBREVIATIONS as ABBREVIATIONS} from './notation.mjs';
const element=(name,text,className)=>{const node=document.createElement(name);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
function terms(tokens,compact=false){
  const line=element('span',undefined,'reader-terms');
  tokens.forEach((original,i)=>{const token=compactTerm(original);if(i)line.append(document.createTextNode(compact?' ':' · '));const word=element(token.text===token.full?'span':'abbr',token.text);if(token.text!==token.full)word.title=token.full;line.append(word);});return line;
}
function entryLabels(item,className){
  const labels=element('span',undefined,className);labels.append(terms(item.labels));
  if(item.frequency){
    if(item.labels.length)labels.append(document.createTextNode(' · '));
    const frequency=element('span',item.frequency.label,'reader-frequency');
    frequency.title=item.frequency.rank===null?'Not ranked on the dictionary’s A–F frequency scale':'Original dictionary frequency: '+item.frequency.code;
    labels.append(frequency);
  }
  return labels;
}
function tokenSummary(token,language){
  const summary=element('summary',undefined,'reader-summary');
  const surface=element('span',token.surface,'reader-surface');surface.lang=language==='latin'?'la':'en';summary.append(surface);
  const entries=element('span',undefined,'reader-preview'),titles=new Set();
  for(const item of token.items){
    if(item.kind!=='entry'||titles.has(item.title))continue;
    titles.add(item.title);
    const row=element('span',undefined,'reader-preview-entry');
    const title=element('span',item.title,'reader-principal-parts');title.lang='la';row.append(title);
    entries.append(row);
  }
  if(token.status==='legacy-error')entries.append(element('span','Processing stopped','reader-error'));
  else if(!token.items.length)entries.append(element('span','No match','reader-unknown'));
  else if(!entries.childNodes.length)entries.append(element('span','See WORDS notes','reader-preview-labels'));
  summary.append(entries);return summary;
}
export function renderReader(root,result,{failed=false}={}){
  const fragment=document.createDocumentFragment();
  const batch=result.language==='latin'&&result.tokens.length>1,panels=[];
  if(!result.tokens.length)fragment.append(element('p',failed?'Processing stopped before a completed analysis was available.':'No Latin word forms were found in this input.'));
  if(batch)fragment.append(element('p','Select a word to see its meanings and forms.','reader-guide'));
  for(const token of result.tokens){
    const section=element(batch?'details':'section',undefined,batch?'reader-token reader-accordion':'reader-token');
    const content=batch?element('div',undefined,'reader-expanded'):section;
    if(batch){
      section.append(tokenSummary(token,result.language));panels.push(section);
      section.addEventListener('toggle',()=>{
        if(!section.open)return;
        if(!content.childNodes.length)renderTokenContent(content,token,result.language);
        for(const other of panels)if(other!==section)other.open=false;
      });
    }else{const heading=element('h3',token.surface);heading.lang=result.language==='latin'?'la':'en';section.append(heading);}
    if(!batch)renderTokenContent(content,token,result.language);
    if(batch)section.append(content);
    fragment.append(section);
  }
  root.replaceChildren(fragment);
}
export function renderTokenContent(content,token,language){
    if(!token.items.length)content.append(element('p',token.status==='legacy-error'?'Original WORDS stopped while processing this input; no completed analysis is available.':language==='english'?'No matching dictionary entries.':'No analysis found by WORDS.','reader-unknown'));
    for(const item of token.items){
      const article=element('article',undefined,item.kind==='entry'?'reader-entry':'reader-explanation');
      const heading=element('h4',item.title);if(item.kind==='entry')heading.lang='la';article.append(heading);
      for(const section of item.sections??[item]){
      const body=element('div',undefined,'reader-sense-group');
      if(section.labels.length||section.frequency){const line=element('p',undefined,'reader-labels');line.append(entryLabels(section,'reader-label-content'));body.append(line);}
      const meanings=(section.meanings??[section.meaning]).filter(Boolean);
      const meaningList=meanings.length>1?element('ul',undefined,'reader-meanings'):body;
      for(const text of meanings){const meaning=element(meanings.length>1?'li':'p',undefined,'reader-meaning');meaningLines(text).forEach((line,i)=>{if(i)meaning.append(document.createElement('br'));meaning.append(document.createTextNode(line));});meaningList.append(meaning);}
      if(meanings.length>1)body.append(meaningList);
      if(section.forms.length){
        body.append(element('p','Possible forms','reader-forms-heading'));
        const list=element('ul',undefined,'reader-forms');
        for(const form of section.forms){const row=element('li');row.append(terms(form.terms,true));for(const note of form.notes)row.append(element('span',' — '+note,'reader-form-note'));list.append(row);}body.append(list);
      }
      if(section.details.length){const details=element('details');details.append(element('summary',item.kind==='entry'?'Word details':'Original note'));const definition=element('dl');for(const detail of section.details){definition.append(element('dt',detail.label),element('dd',detail.value));}details.append(definition);body.append(details);}
      article.append(body);
      }
      content.append(article);
    }
}
export function renderLookupNotes(root,result){
  const fragment=document.createDocumentFragment();
  for(const note of result.notes)fragment.append(element('p',note));
  for(const token of result.tokens){
    if(!token.notes.length)continue;
    const section=element('section');section.append(element('h4',token.surface));
    for(const note of token.notes)section.append(element('p',note));
    fragment.append(section);
  }
  if(!fragment.childNodes.length)fragment.append(element('p','No lookup notes for this result.'));
  root.replaceChildren(fragment);
}
export function renderAbbreviations(root){
  const table=element('table'),head=element('thead'),row=element('tr');
  for(const title of ['Category','Display','Meaning']){const th=element('th',title);th.scope='col';row.append(th);}head.append(row);table.append(head);const body=element('tbody');
  for(const term of ABBREVIATIONS){const tr=element('tr');tr.append(element('td',term.category),element('td',term.text),element('td',term.full));body.append(tr);}table.append(body);root.replaceChildren(table);
}
