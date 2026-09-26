// Synthetic states mirror the native caller probe; no canonical data is changed.
export function capacityRows(Core, ParseBuffer, emptyEntry, emptyRule) {
  const rows=[];
  const make=(stem,count,number=1,pron=false)=>{
    const part=pron?{pos:'PRON',codes:['1','1','X']}:{pos:'N',codes:['1','1','F','X']};
    const candidates=Array.from({length:number},(_,i)=>({stem,key:1,entry:{...emptyEntry,id:i+1,part}}));
    const rule={...emptyRule,key:1,ending:pron?'uuxa':'a',quality:{pos:pron?'PRON':'N',codes:['1','1','NOM','S','F']}};
    const rules=Array.from({length:count},(_,i)=>pron&&i<count-1?{...rule,quality:{...rule.quality,codes:['1','2','NOM','S','F']}}:rule);
    const data={entries:[],affixes:[],uniques:[],rules,english:[],stems:new Map([[stem,candidates]]),orderedStems:candidates,stemKeys:candidates.map(()=>stem),stemRanges:new Map(),endings:new Map([[pron?'4:a':'1:a',rules]])};
    const core=new Core(data,{fixes:false});core.onlyFixes=true;
    return {core,candidates};
  };
  const capture=(kind,count,core,failed,pa)=>rows.push({kind,count,failed,last:pa.last,pdl:core.candidateRows?core.candidateCount:core.candidates.length,stem:core.reducedStem});
  for(const count of [80,81]){
    const {core,candidates}=make('a',1,count);
    // Native BDL repeats the same dictionary record, rather than distinct entries.
    for(const c of candidates)c.entry=candidates[0].entry;
    let failed=false;try{core.search(['a']);}catch{failed=true;}
    const pa=new ParseBuffer(100);core.wordInto('aa',pa);capture('PDL',count,core,failed,pa);
  }
  for(const count of [249,250,251]){
    const {core,candidates}=make('xx',count);
    let failed=false;try{core.pairs('xxa');}catch{failed=true;}
    core.candidates=candidates;core.candidateCount=1;core.reducedStem='kept';
    const pa=new ParseBuffer(100);core.wordInto('xxa',pa);capture('SL',count,core,failed,pa);
  }
  for(const count of [125,126]){
    const {core,candidates}=make('xx',count,2);core.candidates=candidates;core.candidateCount=2;
    const pa=new ParseBuffer(100);core.wordInto('xxa',pa);capture('SXX',count*2,core,false,pa);
  }
  for(const count of [249,250,251]){
    const {core,candidates}=make('q',count,1,true);core.candidates=Array(7).fill(candidates[0]);core.candidateCount=7;core.reducedStem='kept';
    const pa=new ParseBuffer(100);core.wordInto('quuxa',pa);capture('QU',count,core,false,pa);
  }
  return rows;
}
