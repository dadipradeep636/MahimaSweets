'use client';
import { useRef, useState } from 'react';
import { RotateCcw, Hand, Pause, Play } from 'lucide-react';

export default function SweetScene(){
  const [playing,setPlaying]=useState(true),[tilt,setTilt]=useState({x:0,y:0});
  const drag=useRef<{x:number;y:number}|null>(null);
  const reset=()=>setTilt({x:0,y:0});
  return <div className={`scene-shell refined-scene photo-scene ${playing?'':'motion-paused'}`}>
    <div className="scene-halo"/><span className="scene-editorial-label">THE MAHIMA CRAVING COLLECTION</span>
    <div className="product-depth-stage" role="group" tabIndex={0} aria-label="Layered sweet preview. Drag or use arrow keys to tilt. Press Home to reset."
      onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}
      onPointerMove={e=>{if(drag.current)setTilt({x:Math.max(-9,Math.min(9,(drag.current.y-e.clientY)*.07)),y:Math.max(-12,Math.min(12,(e.clientX-drag.current.x)*.08))});}}
      onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}
      onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home'){reset();return;}setTilt(t=>({x:Math.max(-9,Math.min(9,t.x+(e.key==='ArrowUp'?2:e.key==='ArrowDown'?-2:0))),y:Math.max(-12,Math.min(12,t.y+(e.key==='ArrowRight'?2:e.key==='ArrowLeft'?-2:0)))}));}}>
      <div className="depth-tilt" style={{transform:`rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`}}><div className="depth-float"><span className="depth-shadow"/><img className="depth-food" src="/images/hero-platter-luxe.webp" alt="Golden brass platter with ladoo, kaju katli, gulab jamun, peda and jalebi" draggable={false}/><img className="scene-ladoo" src="/images/hero-ladoo-cutout.webp" alt="" draggable={false}/><img className="scene-kaju" src="/images/hero-kaju-cutout.webp" alt="" draggable={false}/></div></div>
    </div>
    <p className="scene-food-caption">A little bit of every happy.</p>
    <div className="scene-controls"><span><Hand size={15}/> Drag to tilt</span><div><button aria-label={playing?'Pause 3D motion':'Play 3D motion'} onClick={()=>setPlaying(!playing)}>{playing?<Pause size={16}/>:<Play size={16}/>}</button><button aria-label="Reset 3D view" onClick={reset}><RotateCcw size={16}/></button></div></div>
  </div>;
}
