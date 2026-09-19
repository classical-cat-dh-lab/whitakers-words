import {createServer} from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
const root=resolve(fileURLToPath(new URL('../',import.meta.url))),port=Number(process.env.WORDS_PORT??4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.woff2':'font/woff2','.md':'text/plain; charset=utf-8'};
const allowed=new Set(['browser','dist','data','docs','licenses']);
createServer(async(req,res)=>{
  try{
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405).end();return;}
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname),parts=path.split('/').filter(Boolean);
    if(!parts.length){res.writeHead(302,{location:'/browser/'}).end();return;}
    if(!allowed.has(parts[0])||parts.some(p=>p.startsWith('.'))){res.writeHead(404).end();return;}
    let target=resolve(root,...parts);if((await stat(target)).isDirectory())target=resolve(target,'index.html');target=await realpath(target);
    if(!target.startsWith(root+sep)){res.writeHead(404).end();return;}
    const bytes=await readFile(target);res.writeHead(200,{'Content-Type':types[extname(target)]??'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Validation harness: http://127.0.0.1:${port}/browser/`));
