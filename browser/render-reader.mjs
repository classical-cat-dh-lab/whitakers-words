import {ABBREVIATIONS} from '../dist/terminology.js';
const element=(name,text,className)=>{const node=document.createElement(name);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
function terms(tokens,compact=false){
  const line=element('span',undefined,'reader-terms');
  tokens.forEach((token,i)=>{if(i)line.append(document.createTextNode(compact?' ':' · '));const word=element(token.text===token.full?'span':'abbr',token.text);if(token.text!==token.full)word.title=token.full;line.append(word);});return line;
}
export function renderReader(root,result){
  const fragment=document.createDocumentFragment();
  for(const note of result.notes)fragment.append(element('p',note,'reader-notice'));
  if(!result.tokens.length)fragment.append(element('p','No Latin word forms were found in this input.'));
  for(const token of result.tokens){
    const section=element('section',undefined,'reader-token');section.append(element('h3',token.surface));
    if(!token.items.length)section.append(element('p',result.language==='english'?'No matching dictionary entries.':'No analysis found by WORDS.','reader-unknown'));
    for(const item of token.items){
      const article=element('article',undefined,item.kind==='entry'?'reader-entry':'reader-explanation');
      const heading=element('h4',item.title);if(item.kind==='entry')heading.lang='la';article.append(heading);
      if(item.labels.length){const line=element('p',undefined,'reader-labels');line.append(terms(item.labels));article.append(line);}
      if(item.forms.length){
        const list=element('ul',undefined,'reader-forms');
        for(const form of item.forms){const row=element('li');row.append(terms(form.terms,true));for(const note of form.notes)row.append(element('span',' — '+note,'reader-form-note'));list.append(row);}article.append(list);
      }
      if(item.meaning)article.append(element('p',item.meaning,'reader-meaning'));
      if(item.details.length){const details=element('details');details.append(element('summary',item.kind==='entry'?'Word details':'Original note'));const definition=element('dl');for(const detail of item.details){definition.append(element('dt',detail.label),element('dd',detail.value));}details.append(definition);article.append(details);}
      section.append(article);
    }
    for(const note of token.notes)section.append(element('p',note,'reader-profile-note'));
    fragment.append(section);
  }
  root.replaceChildren(fragment);
}
export function renderAbbreviations(root){
  const table=element('table'),head=element('thead'),row=element('tr');
  for(const title of ['Category','Display','Meaning']){const th=element('th',title);th.scope='col';row.append(th);}head.append(row);table.append(head);const body=element('tbody');
  for(const term of ABBREVIATIONS){const tr=element('tr');tr.append(element('td',term.category),element('td',term.text),element('td',term.full));body.append(tr);}table.append(body);root.replaceChildren(table);
}
