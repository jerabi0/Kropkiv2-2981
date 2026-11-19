import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from './src/api/database';
import { privateGames as rooms } from './src/api/database/online-schema';
import { user } from './src/api/database/auth-schema';
import { matchQueue, ratingResults } from './src/api/database/ranked-schema';
import { eloDelta } from './src/api/services/elo';
import type { AppRouterClient } from './src/api';
const ids:string[]=[],roomIds:string[]=[];
const assert=(x:unknown,m:string)=>{if(!x)throw Error(m);};
const clients:AppRouterClient[]=[];
try {
 for(let i=0;i<4;i++) {
  const r=await fetch('http://localhost:4200/api/auth/sign-up/email',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:4200'},body:JSON.stringify({name:'Classé test '+i,email:'ranked-'+randomUUID()+'@example.test',password:randomUUID()})});const b=await r.json();assert(r.ok,'signup');ids.push(b.user.id);
  clients.push(createORPCClient(new RPCLink({url:'http://localhost:4200/api/rpc',headers:()=>({Authorization:'Bearer '+(r.headers.get('set-auth-token')??b.token)})})));
 }
 const [a,b,c,d]=clients;
 assert((await a.ranked.stats()).elo===1200,'initial rating');
 const found=await Promise.all([a.ranked.search({size:17,minutes:3}),b.ranked.search({size:17,minutes:3})]);
 const id=found.find(x=>x.roomId)?.roomId ?? '';assert(id,'concurrent matching');roomIds.push(id);
 assert((await a.ranked.status()).roomId===id&&(await b.ranked.status()).roomId===id,'both assigned same room');
 assert((await a.ranked.cancel()).roomId===id,'cancel race does not lose assigned room');
 assert((await a.ranked.search({size:13,minutes:5})).roomId===id,'cannot join second queue during active match');
 assert((await c.ranked.search({size:13,minutes:3})).status==='waiting','different size');
 assert((await d.ranked.search({size:13,minutes:5})).status==='waiting','different time');
 assert((await c.ranked.cancel()).roomId===null,'cancel waiting');
 assert((await c.ranked.status()).status==='idle','cancel persistent');
 await db.update(matchQueue).set({expiresAt:Date.now()-1}).where(eq(matchQueue.userId,ids[3]));assert((await d.ranked.status()).status==='idle','expired queue');
 const room={id};let s=await a.privateGames.get(room);assert('ranked' in s && s.ranked,'ranked marker');
 await Promise.all(clients.slice(0,2).map(x=>x.privateGames.action({id,revision:s.revision,requestId:randomUUID(),action:{type:'ready'}})));
 assert((await a.ranked.stats()).ranked.total===0,'no rating before finished');
 s=await a.privateGames.get(room);const opener=('player' in s&&s.player===1)?a:b;await opener.privateGames.action({id,revision:s.revision,requestId:randomUUID(),action:{type:'move',x:1,y:1}});
 s=await b.privateGames.get(room);await b.privateGames.action({id,revision:s.revision,requestId:randomUUID(),action:{type:'resign'}});
 await Promise.all(Array.from({length:8},()=>a.privateGames.get(room)));
 const pa=await a.ranked.stats(),pb=await b.ranked.stats();assert(pa.elo===1216&&pb.elo===1184&&pa.ranked.wins===1&&pb.ranked.losses===1,'resignation updates both ratings');
 assert(pa.history.length===1&&pa.history[0].delta===16,'history signed delta');
 const ledger=await db.select().from(ratingResults).where(eq(ratingResults.roomId,id));assert(ledger.length===1,'single unique ledger');
 const privateRoom=await a.privateGames.create({size:17,minutes:3});roomIds.push(privateRoom.id);await b.privateGames.join(privateRoom);s=await a.privateGames.get(privateRoom);
 await Promise.all(clients.slice(0,2).map(x=>x.privateGames.action({...privateRoom,revision:s.revision,requestId:randomUUID(),action:{type:'ready'}})));
 s=await b.privateGames.get(privateRoom);await b.privateGames.action({...privateRoom,revision:s.revision,requestId:randomUUID(),action:{type:'resign'}});
 const privateStats=await a.ranked.stats();assert(privateStats.elo===1216&&privateStats.private.wins===1&&privateStats.ranked.total===1,'private never ranked');
 async function pair(){await a.ranked.search({size:17,minutes:3});const f=await b.ranked.search({size:17,minutes:3});assert(f.roomId,'new pair');roomIds.push(f.roomId!);return {id:f.roomId!};}
 const draw=await pair();s=await a.privateGames.get(draw);await Promise.all(clients.slice(0,2).map(x=>x.privateGames.action({...draw,revision:s.revision,requestId:randomUUID(),action:{type:'ready'}})));
 const [row]=await db.select().from(rooms).where(eq(rooms.id,draw.id));const state=JSON.parse(row.state);state.startedAt=Date.now()-1000;state.deadline=Date.now()-1;await db.update(rooms).set({state:JSON.stringify(state),revision:row.revision+1}).where(eq(rooms.id,draw.id));
 await Promise.all([a.privateGames.get(draw),b.privateGames.get(draw),a.ranked.stats(),b.ranked.stats()]);
 const after=await a.ranked.stats();const expected=eloDelta(1216,1184,null);assert(after.elo===1216+expected&&after.ranked.draws===1&&after.ranked.total===2,'draw deadline rated exactly once');
 const unready=await pair();const [u]=await db.select().from(rooms).where(eq(rooms.id,unready.id));const us=JSON.parse(u.state);us.expiresAt=Date.now()-1;await db.update(rooms).set({state:JSON.stringify(us)}).where(eq(rooms.id,unready.id));const cancelled=await a.privateGames.get(unready);assert('cancelled' in cancelled&&cancelled.cancelled,'ready deadline cancels');assert((await a.ranked.stats()).ranked.total===2,'no Elo for unstarted');
 await Promise.all([c.ranked.search({size:21,minutes:7}),c.ranked.search({size:21,minutes:7})]);assert((await c.ranked.status()).status==='waiting','same account never paired with itself');
 console.log('PASS ranked API: concurrent matchmaking, one active queue, criteria, cancellation/expiry, ready, atomic Elo, unique finalization, private isolation, draw deadline, unstarted no penalty, personal stats');
} finally {
 if(ids.length) await db.delete(matchQueue).where(inArray(matchQueue.userId,ids));
 if(roomIds.length) await db.delete(rooms).where(inArray(rooms.id,roomIds));
 if(ids.length) await db.delete(user).where(inArray(user.id,ids));
}