const encoder = new TextEncoder();
const COOKIE = '__Host-mahima_session';
const LIFE = 30 * 86400;
const hex = bytes => Array.from(new Uint8Array(bytes), b=>b.toString(16).padStart(2,'0')).join('');
const random = size => hex(crypto.getRandomValues(new Uint8Array(size)));
const digest = async text => hex(await crypto.subtle.digest('SHA-256',encoder.encode(text)));
function json(body,status=200,extra={}){return Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',...extra}});}
function cookie(token,age=LIFE){return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;}
function tokenFrom(request){const tokens=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(COOKIE+'='));return tokens.length===1?tokens[0].slice(COOKIE.length+1):'';}
async function keyed(value,pepper){const key=await crypto.subtle.importKey('raw',encoder.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,encoder.encode(value)));}
async function pinHash(phone,pin,salt,pepper){
  const secret=await keyed(`${phone}:${pin}`,pepper);
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),'PBKDF2',false,['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:encoder.encode(salt),iterations:100000},key,256));
}
function equal(a,b){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
async function session(request,db,now){
  const token=tokenFrom(request);if(!/^[a-f0-9]{64}$/.test(token))return null;
  return db.prepare('SELECT a.id, a.phone FROM shop_sessions s JOIN shop_accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>?').bind(await digest(token),now).first();
}
async function limited(db,key,max,seconds,now){
  const window=Math.floor(now/seconds);
  const row=await db.prepare('INSERT INTO shop_auth_limits (key,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(`${key}:${window}`,(window+1)*seconds).first();
  return row.attempts>max;
}
async function bodyJSON(request){
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw new Error('body');
  const reader=request.body?.getReader();if(!reader)throw new Error('body');let size=0;const chunks=[];
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2048){await reader.cancel();throw new Error('body');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
export async function accountRequest(request,env){
  const now=Math.floor(Date.now()/1000),db=env.DB,pepper=env.ACCOUNT_PEPPER;
  if(!db||!pepper||pepper.length<32)return json({error:'Sign-in is temporarily unavailable. You can still shop as a guest.'},503);
  try{
    if(request.method==='GET'){const account=await session(request,db,now);return json({account:account?{phone:account.phone}:null});}
    if(request.method!=='POST')return json({error:'Method not allowed.'},405,{'Allow':'GET, POST'});
    if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Please open this form on the shop website.'},403);
    let body;try{body=await bodyJSON(request);}catch{return json({error:'Please check the form and try again.'},400);}
    if(!body||typeof body!=='object')return json({error:'Please check the form.'},400);
    const {action}=body;
    if(action==='logout'){
      const token=tokenFrom(request);if(token)await db.prepare('DELETE FROM shop_sessions WHERE token_hash=?').bind(await digest(token)).run();
      return json({account:null},200,{'Set-Cookie':cookie('',0)});
    }
    if(!['login','register','delete'].includes(action))return json({error:'Unknown action.'},400);
    const phone=typeof body.phone==='string'?body.phone.replace(/^\+91/,''):'';
    const pin=typeof body.pin==='string'?body.pin:'';
    if(!/^[6-9][0-9]{9}$/.test(phone)||!/^\d{4}$/.test(pin))return json({error:'Enter a 10-digit Indian mobile number and a 4-digit PIN.'},400);
    const phoneKey=await keyed(`phone:${phone}`,pepper),ipKey=await keyed(`ip:${request.headers.get('cf-connecting-ip')||'unknown'}`,pepper);
    // Atomic counters cover unknown numbers and successful attempts too.
    if(await limited(db,ipKey,30,900,now)||await limited(db,phoneKey,5,900,now)||await limited(db,phoneKey+'daily',20,86400,now))return json({error:'Too many attempts. Please try later, or continue as a guest.'},429,{'Retry-After':'900'});
    await db.batch([db.prepare('DELETE FROM shop_auth_limits WHERE expires_at<?').bind(now),db.prepare('DELETE FROM shop_sessions WHERE expires_at<?').bind(now)]);
    let account=await db.prepare('SELECT * FROM shop_accounts WHERE phone=?').bind(phone).first();
    if(action==='register'){
      if(await limited(db,ipKey+'register',5,3600,now))return json({error:'Please try setting up your PIN later.'},429,{'Retry-After':'3600'});
      if(account)return json({error:'A PIN may already be set for this number. Try signing in instead.'},409);
      const id=random(16),salt=random(16),hash=await pinHash(phone,pin,salt,pepper);
      const result=await db.prepare('INSERT OR IGNORE INTO shop_accounts (id,phone,pin_hash,salt,created_at) VALUES (?,?,?,?,?)').bind(id,phone,hash,salt,now).run();
      if(!result.meta.changes)return json({error:'A PIN may already be set for this number. Try signing in instead.'},409);
      account={id,phone};
    }else{
      const hash=await pinHash(phone,pin,account?.salt||'00000000000000000000000000000000',pepper);
      if(!account||!equal(hash,account.pin_hash))return json({error:'The mobile number or PIN is incorrect.'},401);
      if(action==='delete'){
        const current=await session(request,db,now);
        if(current?.id!==account.id)return json({error:'Please sign in before deleting your account.'},401);
        await db.batch([db.prepare('DELETE FROM shop_sessions WHERE account_id=?').bind(account.id),db.prepare('DELETE FROM shop_accounts WHERE id=?').bind(account.id)]);
        return json({account:null},200,{'Set-Cookie':cookie('',0)});
      }
    }
    const token=random(32),old=tokenFrom(request);
    await db.batch([db.prepare('DELETE FROM shop_sessions WHERE token_hash=?').bind(await digest(old)),db.prepare('INSERT INTO shop_sessions (token_hash,account_id,expires_at) VALUES (?,?,?)').bind(await digest(token),account.id,now+LIFE)]);
    return json({account:{phone}},200,{'Set-Cookie':cookie(token)});
  }catch{
    // Never log phone numbers, PINs, request bodies, or session tokens.
    return json({error:'Sign-in is temporarily unavailable. Please try again later or continue as a guest.'},503);
  }
}
