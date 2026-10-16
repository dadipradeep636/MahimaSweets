'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [dark,setDark]=useState(false);
  useEffect(()=>{
    const sync=()=>setDark(document.documentElement.dataset.theme==='dark');
    sync();
    const media=window.matchMedia('(prefers-color-scheme: dark)');
    const system=()=>{let saved=false;try{saved=!!localStorage.getItem('mahima-theme');}catch{}if(!saved){document.documentElement.dataset.theme=media.matches?'dark':'light';sync();}};
    const storage=(event:StorageEvent)=>{if(event.key==='mahima-theme'){document.documentElement.dataset.theme=event.newValue==='dark'||(!event.newValue&&media.matches)?'dark':'light';sync();}};
    media.addEventListener('change',system);window.addEventListener('storage',storage);
    return()=>{media.removeEventListener('change',system);window.removeEventListener('storage',storage);};
  },[]);
  function toggle(){const next=!dark;setDark(next);document.documentElement.dataset.theme=next?'dark':'light';try{localStorage.setItem('mahima-theme',next?'dark':'light');}catch{}}
  return <button className="theme-toggle" type="button" role="switch" aria-checked={dark} aria-label="Dark theme" title={dark?'Switch to light theme':'Switch to dark theme'} onClick={toggle}><Sun size={13} aria-hidden="true"/><span className="theme-toggle-track"><span>{dark?<Moon size={12}/>:<Sun size={12}/>}</span></span><Moon size={13} aria-hidden="true"/></button>;
}
