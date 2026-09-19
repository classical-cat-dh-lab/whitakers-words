import ts from '../.tools/typescript/lib/typescript.js';
import {readFile,writeFile,readdir} from 'node:fs/promises';
const directory=new URL('../src/',import.meta.url),printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed});
for(const name of await readdir(directory)){
  if(!name.endsWith('.ts')||name==='trick-tables.ts')continue;
  const target=new URL(name,directory),source=await readFile(target,'utf8');
  const result=printer.printFile(ts.createSourceFile(name,source,ts.ScriptTarget.Latest,true));
  if(process.argv.includes('--check')){if(result!==source)throw new Error('Source formatting differs: '+name);}else await writeFile(target,result);
}
