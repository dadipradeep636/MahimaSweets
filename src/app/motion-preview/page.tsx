'use client';
import { useState } from 'react';
import HeroSweets from '@/components/HeroSweets';
import ThemeToggle from '@/components/ThemeToggle';
import { ArrowUpRight, ArrowLeft, Move } from 'lucide-react';
import './preview.css';
export default function MotionPreview(){
 const [mode,setMode]=useState('cinematic');
 return <div className={`motion-preview motion-${mode}`}>
 <header className="motion-header"><a href="/" className="brand"><span className="brand-mark">M<span>✦</span></span><span>Mahima<span className="brand-sub">Sweets</span></span></a><div><span className="motion-preview-label">MOTION STUDY · 01</span><ThemeToggle/></div></header>
 <main className="motion-main"><div className="motion-copy"><p className="eyebrow">A LITTLE MAGIC. A LOT OF MITHAI.</p><h1>Made to<br/><em>make you melt.</em></h1><p>Golden, glistening, impossible to resist.<br/>Your favourite sweets, with a little lift.</p><a href="/#collection" className="button primary">Find your favourite <ArrowUpRight size={18}/></a><div className="motion-choose"><span>TRY THE MOTION</span><div role="group" aria-label="Animation style"><button aria-pressed={mode==='cinematic'} onClick={()=>setMode('cinematic')}>Quiet luxury</button><button aria-pressed={mode==='float'} onClick={()=>setMode('float')}>Floating feast</button></div></div></div>
 <div className="motion-art"><div className="motion-light" aria-hidden="true"/><div className="motion-orbit" aria-hidden="true"/><HeroSweets/><p className="motion-hint"><Move size={15}/> Move your pointer or focus the platter and use arrow keys</p></div>
 </main><footer className="motion-footer"><a href="/"><ArrowLeft size={15}/> Back to the shop</a><p>Interactive concept · layered imagery in 3D space · live hero unchanged</p></footer>
 </div>;
}
