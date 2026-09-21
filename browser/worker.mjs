import {prepareLatinInput} from './input.mjs';
import {createAnalyzer,applyCorrectedLayer} from '../dist/index.js';
const files={dictionary:'legacy/DICTLINE.GEN',inflections:'legacy/INFLECTS.LAT',addons:'legacy/ADDONS.LAT',uniques:'legacy/UNIQUES.LAT',dictionaryForms:'dictionary-forms.tsv',englishIndex:'english-index.tsv'};
const ready=(async()=>{
  const start=performance.now();
  const sources=Object.fromEntries(await Promise.all(Object.entries(files).map(async([key,file])=>{const response=await fetch(new URL('../data/'+file,import.meta.url));if(!response.ok)throw new Error('Cannot load '+file+': '+response.status);return[key,await response.text()];})));
  const analyzer=await createAnalyzer(sources);
  self.postMessage({type:'ready',loadMilliseconds:performance.now()-start});return analyzer;
})();
ready.catch(error=>self.postMessage({type:'error',message:error.message}));
self.addEventListener('message',async({data})=>{
  try{
    const analyzer=await ready,start=performance.now();
    const inputAdapter=data.mode==='latin'?prepareLatinInput(data.input):undefined;
    const result=data.mode==='english'?analyzer.lookupEnglish(data.input):analyzer.analyze(inputAdapter?.lookup??data.input);
    self.postMessage({type:'result',id:data.id,inputAdapter,result:data.mode==='corrected'?applyCorrectedLayer(result):result,milliseconds:performance.now()-start});
  }catch(error){self.postMessage({type:'error',id:data.id,message:error.message});}
});
