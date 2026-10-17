'use client';
import { useEffect, useRef, useState } from 'react';
import { UserRound, X, ArrowRight, Smartphone, LogOut } from 'lucide-react';
type Account={phone:string};
export default function AccountButton(){
  const [account,setAccount]=useState<Account|null>(null),[open,setOpen]=useState(false);
  const [mode,setMode]=useState<'login'|'register'|'delete'>('login');
  const [phone,setPhone]=useState(''),[pin,setPin]=useState(''),[confirm,setConfirm]=useState('');
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>{fetch('/api/account/',{cache:'no-store',credentials:'same-origin'}).then(r=>r.ok?r.json():null).then(data=>{if(data)setAccount(data.account);}).catch(()=>{});},[]);
  useEffect(()=>{if(!open)return;dialog.current?.showModal();const before=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=before;trigger.current?.focus();};},[open]);
  function close(){if(busy)return;setOpen(false);setPin('');setConfirm('');setError('');setMode('login');}
  function changeMode(next:typeof mode){setMode(next);setError('');setPin('');setConfirm('');}
  async function submit(action:typeof mode|'logout'){
    if(busy)return;
    if(action==='register'&&pin!==confirm){setError('Your PINs do not match. Please try again.');return;}
    setBusy(true);setError('');
    try{
      const response=await fetch('/api/account/',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,phone:action==='delete'?account?.phone:phone,pin})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||'Please try again.');
      setAccount(data.account);setPin('');setConfirm('');setMode('login');
    }catch(error){setError(error instanceof Error?error.message:'Unable to connect. You can still shop as a guest.');}
    finally{setBusy(false);}
  }
  return <><button ref={trigger} className="account-trigger" aria-label={account?'Your account':'Sign in (optional)'} onClick={()=>{setOpen(true);setPhone(account?.phone||'');}}><UserRound size={20}/><span>{account?'Account':'Sign in'}</span></button>
  {open&&<dialog ref={dialog} className="modal account-modal" aria-labelledby="account-title" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}>
    <div className="modal-inner account-inner"><button className="close-button" aria-label="Close account" onClick={close} disabled={busy}><X size={21}/></button>
    <span className="account-emblem"><Smartphone size={25}/></span><p className="eyebrow">YOUR LITTLE CORNER OF MAHIMA</p>
    <h2 id="account-title">{account?(mode==='delete'?'Delete your account?':'Welcome back.'):(mode==='register'?'Make it yours.':'Hello, sweet friend.')}</h2>
    {account&&mode!=='delete'?<><p className="account-intro">You’re signed in with <strong>+91 {account.phone}</strong>.</p><div className="account-note">Use this number and your PIN to sign in on another device. Your shopping bag stays on this browser.</div><button className="button primary full" onClick={close}>Back to the sweets <ArrowRight size={17}/></button><button className="account-text-button" disabled={busy} onClick={()=>submit('logout')}><LogOut size={16}/> Sign out</button><button className="account-delete" disabled={busy} onClick={()=>changeMode('delete')}>Delete my account</button></>:
    <><p className="account-intro">{mode==='delete'?'This removes your account and signs you out on every device. Enter your PIN to confirm.':mode==='register'?'Save your mobile number with a 4-digit PIN. Come back on any device.':'Sign in with your mobile number and 4-digit PIN. Shopping as a guest is always welcome.'}</p>
    <form className="account-form" onSubmit={e=>{e.preventDefault();submit(mode);}}>
      {mode!=='delete'&&<label htmlFor="account-phone">Mobile number<div className="account-phone"><span>+91</span><input id="account-phone" type="tel" inputMode="numeric" autoComplete="username" placeholder="10-digit mobile number" pattern="[6-9][0-9]{9}" maxLength={10} value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} required disabled={busy}/></div></label>}
      <label htmlFor="account-pin">{mode==='register'?'Choose a 4-digit PIN':'Your 4-digit PIN'}<input id="account-pin" type="password" inputMode="numeric" autoComplete={mode==='register'?'new-password':'current-password'} placeholder="• • • •" pattern="[0-9]{4}" minLength={4} maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,4))} required disabled={busy}/></label>
      {mode==='register'&&<><label htmlFor="confirm-pin">Confirm your PIN<input id="confirm-pin" type="password" inputMode="numeric" autoComplete="new-password" placeholder="• • • •" pattern="[0-9]{4}" minLength={4} maxLength={4} value={confirm} onChange={e=>setConfirm(e.target.value.replace(/\D/g,'').slice(0,4))} required disabled={busy}/></label><small className="account-note">Use your own number. No OTP is sent, so mobile ownership is not verified. Keep your PIN safe; automatic PIN recovery is not available.</small></>}
      <button type="submit" className="button primary full" disabled={busy}>{busy?'One sweet moment…':mode==='register'?'Save my PIN':mode==='delete'?'Delete my account':'Sign in'}<ArrowRight size={17}/></button>
    </form>
    {mode!=='delete'&&<button className="account-text-button" disabled={busy} onClick={()=>changeMode(mode==='login'?'register':'login')}>{mode==='login'?'First visit? Set up your PIN':'Already have a PIN? Sign in'}</button>}
    <button className="continue-shopping" disabled={busy} onClick={close}>{mode==='delete'?'Keep my account':'Continue as guest'}</button>
    </>}
    {error&&<p className="account-error" role="alert">{error}</p>}
    </div></dialog>}
  </>;
}
