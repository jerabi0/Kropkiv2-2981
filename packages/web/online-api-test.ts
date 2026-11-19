import {createORPCClient} from '@orpc/client';
import {RPCLink} from '@orpc/client/fetch';
import {eq,inArray} from 'drizzle-orm';
import {randomUUID} from 'node:crypto';
import {db} from './src/api/database';
import {privateGames as table} from './src/api/database/online-schema';
import {user} from './src/api/database/auth-schema';
import type {AppRouterClient} from './src/api';
const ids:string[]=[],rooms:string[]=[];
const assert=(x:unknown,m='assertion')=>{if(!x)throw new Error(m);};
const make=(token=''):AppRouterClient=>createORPCClient(new RPCLink({url:'http://localhost:4200/api/rpc',headers:()=>token?{Authorization:'Bearer '+token}:{}}));
const reject=async(f:()=>Promise<unknown>)=>{try{await f();}catch{return;}throw new Error('Expected server rejection');};
try{
 const clients:AppRouterClient[]=[];
 for(let i=0;i<3;i++){
  const r=await fetch('http://localhost:4200/api/auth/sign-up/email',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:4200'},body:JSON.stringify({name:'API Test '+i,email:'api-'+randomUUID()+'@example.test',password:randomUUID()})});
  const body=await r.json();assert(r.ok,'signup');ids.push(body.user.id);clients.push(make(r.headers.get('set-auth-token')??body.token));
 }
 const [b,r,x]=clients;
 const created=await b.privateGames.create({size:17,minutes:3});rooms.push(created.id);
 await reject(()=>make().privateGames.get(created));
 await r.privateGames.join(created);
 await reject(()=>x.privateGames.join(created));
 const hidden=await x.privateGames.get(created);assert(!('game' in hidden),'private board leaked');
 let s=await b.privateGames.get(created);
 const ready=(c:AppRouterClient)=>c.privateGames.action({...created,revision:s.revision,requestId:randomUUID(),action:{type:'ready'}});
 await Promise.all([ready(b),ready(r)]);
 s=await b.privateGames.get(created);assert('startedAt' in s&&s.startedAt===null&&s.deadline===null&&s.ready.every(Boolean),'readiness race waits for first move');
 await reject(()=>r.privateGames.action({...created,revision:s.revision,requestId:randomUUID(),action:{type:'move',x:1,y:1}}));
 const duplicateId=randomUUID(),revision=s.revision;
 const first={...created,revision,requestId:duplicateId,action:{type:'move' as const,x:3,y:2}};
 await b.privateGames.action(first);await b.privateGames.action(first);
 s=await b.privateGames.get(created);assert('game' in s&&s.game.moves.length===1,'duplicate request played twice');
 await reject(()=>r.privateGames.action({...created,revision,requestId:randomUUID(),action:{type:'move',x:3,y:3}}));
 for(const [i,xy] of [[3,3],[4,3],[10,10],[3,4],[11,10],[2,3]].entries()){
  const c=i%2?b:r;const latest=await c.privateGames.get(created);
  await c.privateGames.action({...created,revision:latest.revision,requestId:randomUUID(),action:{type:'move',x:xy[0],y:xy[1]}});
 }
 let row=(await db.select().from(table).where(eq(table.id,created.id)))[0];let state=JSON.parse(row.state);
 state.deadline=Date.now()-1;
 await db.update(table).set({state:JSON.stringify(state),revision:row.revision+1}).where(eq(table.id,row.id));
 const final=await r.privateGames.action({...created,revision:row.revision,requestId:randomUUID(),action:{type:'move',x:0,y:0}});
 assert('game' in final&&final.result?.reason==='time'&&final.result.winner===1&&final.game.moves.length===7,'score deadline');
 const another=await b.privateGames.create({size:13,minutes:3});rooms.push(another.id);
 await r.privateGames.join(another);s=await b.privateGames.get(another);
 await Promise.all([b.privateGames.action({...another,revision:s.revision,requestId:randomUUID(),action:{type:'ready'}}),r.privateGames.action({...another,revision:s.revision,requestId:randomUUID(),action:{type:'ready'}})]);
 s=await b.privateGames.get(another);
 const raced=await Promise.allSettled([0,1].map(x=>b.privateGames.action({...another,revision:s.revision,requestId:randomUUID(),action:{type:'move',x,y:0}})));
 assert(raced.filter(r=>r.status==='fulfilled').length===1,'CAS admitted competing moves');
 const last=await b.privateGames.get(another);assert('game' in last&&last.game.moves.length===1);
 console.log('PASS API: anonymous/outsider rejection, private board redaction, concurrent ready, duplicate/stale moves, server deadline score, concurrent CAS; test records cleaned');
}finally{
 if(rooms.length)await db.delete(table).where(inArray(table.id,rooms));
 if(ids.length)await db.delete(user).where(inArray(user.id,ids));
}