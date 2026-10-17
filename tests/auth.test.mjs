import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {accountRequest} from '../src/lib/account-server.mjs';
function fixture(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../drizzle/0000_pink_loa.sql',import.meta.url),'utf8'));
 const DB={prepare(sql){let args=[];return {bind(...a){args=a;return this;},async first(){return db.prepare(sql).get(...args)||null;},async run(){const result=db.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}};}};},async batch(list){db.exec('BEGIN');try{const results=[];for(const q of list)results.push(await q.run());db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}};
 const env={DB,ACCOUNT_PEPPER:'test-only-pepper-not-used-in-production-123456789'};
 async function call(body,cookie='',origin='https://shop.test'){
  const headers={'Content-Type':'application/json',Origin:origin,'cf-connecting-ip':'192.0.2.1',Cookie:cookie};
  return accountRequest(new Request('https://shop.test/api/account/',{method:body?'POST':'GET',headers,...(body?{body:JSON.stringify(body)}:{})}),env);
 }
 return {db,call};
}
const credentials={phone:'9000000001',pin:'0628'};
const cookieOf=r=>r.headers.get('set-cookie').split(';')[0];
test('guest, registration, fresh-device login, logout, hashed storage and cookie flags',async()=>{
 const {db,call}=fixture();assert.deepEqual(await (await call()).json(),{account:null});
 const created=await call({action:'register',...credentials});assert.equal(created.status,200);
 const cookie=cookieOf(created);assert.match(created.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax/);
 const row=db.prepare('SELECT * FROM shop_accounts').get();assert.notEqual(row.pin_hash,credentials.pin);assert.equal(row.pin_hash.length,64);
 assert.notEqual(db.prepare('SELECT token_hash FROM shop_sessions').get().token_hash,cookie.split('=')[1]);
 assert.deepEqual(await (await call(null,cookie)).json(),{account:{phone:credentials.phone}});
 const second=await call({action:'login',...credentials});assert.equal(second.status,200);assert.notEqual(cookieOf(second),cookie);
 assert.equal((await call({action:'logout'},cookie)).status,200);assert.deepEqual(await (await call(null,cookie)).json(),{account:null});
 assert.deepEqual(await (await call(null,cookieOf(second))).json(),{account:{phone:credentials.phone}});
 db.close();
});
test('wrong PIN, invalid input, duplicate registration, and CSRF are rejected',async()=>{
 const {db,call}=fixture();await call({action:'register',...credentials});
 assert.equal((await call({action:'login',...credentials,pin:'0000'})).status,401);
 assert.equal((await call({action:'register',...credentials})).status,409);
 assert.equal((await call({action:'login',...credentials,pin:'628'})).status,400);
 assert.equal((await call({action:'login',...credentials},'','https://evil.test')).status,403);
 assert.equal((await call({action:'logout'},'','')).status,403);db.close();
});
test('account throttles unknown numbers and distributed IP attempts',async()=>{
 const {db,call}=fixture();for(let i=0;i<5;i++)assert.equal((await call({action:'login',...credentials})).status,401);
 const response=await call({action:'login',...credentials});assert.equal(response.status,429);assert.ok(response.headers.get('Retry-After'));db.close();
});
test('expired sessions are ignored; deletion revokes every session',async()=>{
 const {db,call}=fixture();const first=await call({action:'register',...credentials});const second=await call({action:'login',...credentials});
 assert.equal((await call({action:'delete',...credentials})).status,401);
 assert.equal((await call({action:'delete',...credentials},cookieOf(first))).status,200);
 assert.equal(db.prepare('SELECT count(*) n FROM shop_accounts').get().n,0);
 assert.deepEqual(await (await call(null,cookieOf(second))).json(),{account:null});db.close();
 const f=fixture();const r=await f.call({action:'register',...credentials});f.db.exec('UPDATE shop_sessions SET expires_at=0');assert.deepEqual(await (await f.call(null,cookieOf(r))).json(),{account:null});f.db.close();
});
test('unconfigured account service fails closed',async()=>{
 const response=await accountRequest(new Request('https://shop.test/api/account/'),{});assert.equal(response.status,503);
});
