'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

export default function HeroSweets() {
  const ref=useRef<HTMLDivElement>(null);
  const angles=useRef({x:0,y:0});
  const [paused,setPaused]=useState(false);
  useEffect(()=>{
    const node=ref.current;if(!node)return;
    const observer=new IntersectionObserver(([entry])=>{node.dataset.visible=String(entry.isIntersecting);},{threshold:.05});
    observer.observe(node);
    return()=>observer.disconnect();
  },[]);
  function tilt(x:number,y:number){angles.current={x,y};ref.current?.style.setProperty('--platter-x',`${x}deg`);ref.current?.style.setProperty('--platter-y',`${y}deg`);}
  return <div className={`hero-showcase ${paused?'showcase-paused':''}`} ref={ref} data-visible="true">
    <div className="showcase-aura" aria-hidden="true"/><div className="showcase-floor-shadow" aria-hidden="true"/>
    <div className="hero-sweets-stage" role="group" tabIndex={0} aria-label="Animated mithai platter. Move your pointer or use arrow keys to tilt; Home resets the view." onPointerMove={e=>{if(paused||e.pointerType==='touch')return;const r=e.currentTarget.getBoundingClientRect();tilt((.5-(e.clientY-r.top)/r.height)*8,((e.clientX-r.left)/r.width-.5)*12);}} onPointerLeave={()=>tilt(0,0)} onBlur={()=>tilt(0,0)} onKeyDown={e=>{if(e.key==='Home'){e.preventDefault();tilt(0,0);}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(paused)return;tilt(Math.max(-5,Math.min(5,angles.current.x+(e.key==='ArrowUp'?2:e.key==='ArrowDown'?-2:0))),Math.max(-7,Math.min(7,angles.current.y+(e.key==='ArrowRight'?2:e.key==='ArrowLeft'?-2:0))));}}}>
      <div className="showcase-perspective"><div className="showcase-plate-float"><img className="showcase-platter" src="/images/hero-platter-luxe.webp" width="1536" height="1024" alt="Golden brass platter with richly textured motichoor ladoo, silver-leaf kaju katli, glossy gulab jamun, saffron peda and jalebi" fetchPriority="high" draggable={false}/></div>
      <div className="showcase-ladoo-float" aria-hidden="true"><img src="/images/hero-ladoo-cutout.webp" width="640" height="640" alt="" draggable={false}/></div>
      <div className="showcase-kaju-float" aria-hidden="true"><img src="/images/hero-kaju-cutout.webp" width="640" height="640" alt="" draggable={false}/></div></div>
    </div>
    <div className="showcase-controls"><button type="button" aria-label={paused?'Play sweets animation':'Pause sweets animation'} title={paused?'Play animation':'Pause animation'} onClick={()=>{setPaused(!paused);tilt(0,0);}}>{paused?<Play size={15}/>:<Pause size={15}/>}</button><button type="button" aria-label="Reset sweets view" title="Reset view" onClick={()=>tilt(0,0)}><RotateCcw size={15}/></button></div>
  </div>;
}
