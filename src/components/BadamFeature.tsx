'use client';

import { useRef, useState } from 'react';
import { Pause, Play, Plus, ArrowUpRight } from 'lucide-react';
import { badam, money, priceFor, type Product } from '@/lib/products';

export default function BadamFeature({add,open}:{add:(p:Product,size?:number)=>void;open:(p:Product)=>void}) {
  const [size,setSize]=useState(250);
  const [paused,setPaused]=useState(false);
  const stage=useRef<HTMLDivElement>(null);
  function tilt(x:number,y:number){stage.current?.style.setProperty('--badam-x',`${x}deg`);stage.current?.style.setProperty('--badam-y',`${y}deg`);}
  return <section id="badam-geer" className={`badam-feature ${paused?'badam-paused':''}`} aria-labelledby="badam-title">
    <div className="badam-heading"><p className="eyebrow">THE GOLDEN FINISH</p><h2 id="badam-title">Sip slow.<br/>{' '}<em>Stay golden.</em></h2><p>Meet our Badam Geer.<br/>{' '}Creamy almonds. A saffron glow.<br/>{' '}Your new favourite little pause.</p></div>
    <div className="badam-world" ref={stage} onPointerMove={e=>{if(e.pointerType==='touch')return;const r=e.currentTarget.getBoundingClientRect();tilt((.5-(e.clientY-r.top)/r.height)*12,((e.clientX-r.left)/r.width-.5)*18);}} onPointerLeave={()=>tilt(0,0)}>
      <div className="badam-orbit orbit-a"/><div className="badam-orbit orbit-b"/><div className="badam-glow"/>
      <div className="badam-tilt"><div className="badam-glass"><img src="/images/badam-geer-refined.webp" alt="Creamy saffron Badam Geer in a glass topped with almond and pistachio slivers" loading="lazy"/><svg className="badam-steam" viewBox="0 0 160 160" aria-hidden="true"><path d="M45 150C0 100 85 75 42 15"/><path d="M85 150C35 100 125 70 83 0"/><path d="M125 150C80 100 165 70 122 15"/></svg></div><span className="floating-almond almond-one"/><span className="floating-almond almond-two"/><span className="floating-almond almond-three"/><span className="badam-spark spark-a">✦</span><span className="badam-spark spark-b">✧</span></div>
    </div>
    <div className="badam-side-note"><span>THE MAHIMA POUR</span><p>A little rich.<br/>{' '}A little dreamy.<br/>{' '}<em>All kinds of happy.</em></p><button onClick={()=>open(badam)}>Meet your golden sip <ArrowUpRight size={16}/></button></div>
    <div className="badam-order"><div><span className="eyebrow">BADAM GEER</span><p>{money(priceFor(badam,size))}<small> / {size} ml · sample price</small></p></div><div className="badam-sizes" role="group" aria-label="Badam Geer serving size">{[250,500].map(n=><button key={n} aria-pressed={size===n} onClick={()=>setSize(n)}>{n} ml</button>)}</div><button className="button primary" onClick={()=>add(badam,size)}><Plus size={16}/> Add to cart</button></div>
    <button className="badam-motion" onClick={()=>{setPaused(!paused);tilt(0,0);}} aria-label={paused?'Play Badam Geer animation':'Pause Badam Geer animation'}>{paused?<Play size={14}/>:<Pause size={14}/>}<span>{paused?'Play motion':'Pause motion'}</span></button>
    <p className="badam-caption">Almond milk with saffron & pistachio · illustrative imagery and ingredients</p>
  </section>;
}
