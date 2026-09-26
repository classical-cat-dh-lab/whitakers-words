import {renderTokenContent} from './render-reader.mjs';

// Project returned token spans onto the exact submitted text. Never retokenize
// or normalize the displayed passage, including punctuation and repeated words.
export function passageSegments(original,tokens,adapter){
  const segments=[];let cursor=0;
  tokens.forEach((token,index)=>{
    const first=adapter?.spans[token.span.start],last=adapter?.spans[token.span.end-1];
    const start=adapter?first?.start:token.span.start,end=adapter?last?.end:token.span.end;
    if(!Number.isInteger(start)||!Number.isInteger(end)||start<cursor||end<=start||end>original.length)return;
    if(start>cursor)segments.push({text:original.slice(cursor,start)});
    segments.push({text:original.slice(start,end),index});cursor=end;
  });
  if(cursor<original.length)segments.push({text:original.slice(cursor)});
  return segments;
}

export function renderPassage(textRoot,detailRoot,segments,reading,selected=0,onSelect=()=>{}){
  const fragment=document.createDocumentFragment(),buttons=[];
  function select(index){
    const token=reading.tokens[index];
    for(const button of buttons)button.setAttribute('aria-pressed',String(Number(button.dataset.tokenIndex)===index));
    const heading=document.createElement('h3');heading.lang='la';heading.textContent=token.surface;
    detailRoot.replaceChildren(heading);renderTokenContent(detailRoot,token,reading.language);
    onSelect(index);
  }
  for(const segment of segments){
    if(segment.index===undefined){fragment.append(document.createTextNode(segment.text));continue;}
    const button=document.createElement('button');button.type='button';button.className='passage-word';
    button.lang='la';button.textContent=segment.text;button.dataset.tokenIndex=segment.index;
    button.setAttribute('aria-controls',detailRoot.id);button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>select(segment.index));buttons.push(button);fragment.append(button);
  }
  textRoot.replaceChildren(fragment);
  if(buttons.length)select(buttons.some(button=>Number(button.dataset.tokenIndex)===selected)?selected:Number(buttons[0].dataset.tokenIndex));
  else detailRoot.replaceChildren();
}
