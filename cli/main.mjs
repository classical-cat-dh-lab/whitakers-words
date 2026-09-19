#!/usr/bin/env node
import {createNodeAnalyzer} from '../node/index.mjs';
import {applyCorrectedLayer,VERSION} from '../dist/index.js';
const args=process.argv.slice(2);
if(args.includes('--help')){
  console.log('Usage: whitaker-words [--legacy | --jsonl] [--english | --corrected] [text ...]\nWithout text, read UTF-8 stdin. Default: structured JSON.\n--legacy: analysis text in legacy order; --jsonl: one result per input line.\n--english selects English gloss lookup; --corrected selects the empty corrected layer.');
}else if(args.includes('--version'))console.log(VERSION);
else{
  try{
    for(const arg of args)if(arg.startsWith('--')&&!['--legacy','--jsonl','--corrected','--english'].includes(arg))throw new Error('Unknown option: '+arg);
    if(args.includes('--legacy')&&args.includes('--jsonl'))throw new Error('Choose --legacy or --jsonl');
    if(args.includes('--english')&&args.includes('--corrected'))throw new Error('Corrected layers apply to Latin analysis');
    const analyzer=await createNodeAnalyzer(),words=args.filter(a=>!a.startsWith('--'));
    let input=words.join(' ');if(!words.length){process.stdin.setEncoding('utf8');for await(const chunk of process.stdin)input+=chunk;}
    const analyze=text=>args.includes('--english')?analyzer.lookupEnglish(text):args.includes('--corrected')?applyCorrectedLayer(analyzer.analyze(text)):analyzer.analyze(text);
    if(args.includes('--legacy')){const result=analyze(input);process.stdout.write((result.corrected??result).legacyText);}
    else if(args.includes('--jsonl')){for(const line of input.replace(/\n$/,'').split('\n'))process.stdout.write(JSON.stringify(analyze(line))+'\n');}
    else process.stdout.write(JSON.stringify(analyze(input),null,2)+'\n');
  }catch(error){process.stderr.write('whitaker-words: '+error.message+'\n');process.exitCode=1;}
}
