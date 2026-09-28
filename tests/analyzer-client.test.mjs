import test from 'node:test';
import assert from 'node:assert/strict';
import {createAnalyzerClient} from '../browser/analyzer-client.mjs';
class Worker extends EventTarget {
  messages=[]; terminated=false;
  postMessage(data){this.messages.push(data);}
  terminate(){this.terminated=true;}
  message(data){this.dispatchEvent(new MessageEvent('message',{data}));}
}
test('failed initialization can restart; stale workers cannot resolve new queries',async()=>{
  const workers=[],states=[];
  const client=createAnalyzerClient({createWorker:()=>{const worker=new Worker();workers.push(worker);return worker;},onState:(...state)=>states.push(state)});
  client.start();workers[0].message({type:'error',message:'Unavailable dictionary'});
  assert.equal(states.at(-1)[0],'failed');await assert.rejects(client.query('amo'),/Reload/);
  client.start();workers[0].message({type:'ready'});assert.equal(states.at(-1)[0],'loading');
  workers[1].message({type:'ready'});const result=client.query('amo');const {id}=workers[1].messages[0];
  workers[1].message({type:'unrecognized',id});
  workers[0].message({type:'result',id,result:'stale'});workers[1].message({type:'result',id,result:'current'});
  assert.equal((await result).result,'current');client.stop('Finished');
});
test('worker failures and cancellation settle all requests; fresh initialization is bounded',async()=>{
  let worker;const states=[];
  const client=createAnalyzerClient({createWorker:()=>worker=new Worker(),onState:(...state)=>states.push(state),startupTimeout:10});
  client.start();worker.message({type:'ready'});
  const first=client.query('amo'),second=client.query('arma');
  worker.dispatchEvent(new Event('error'));
  await assert.rejects(first,/unexpectedly/);await assert.rejects(second,/unexpectedly/);assert.ok(worker.terminated);
  client.start();worker.message({type:'ready'});const third=client.query('sum');client.stop('Analysis stopped.');await assert.rejects(third,/stopped/);
  client.start();await new Promise(resolve=>setTimeout(resolve,25));assert.match(states.at(-1)[1],/finish loading/);
});
