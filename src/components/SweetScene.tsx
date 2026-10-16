'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Hand, Pause, Play } from 'lucide-react';

export default function SweetScene() {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef({ playing: true, reset: false });
  const [playing, setPlaying] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    let teardown: (() => void) | undefined;
    import('three').then(THREE => {
      if (disposed || !host.current) return;
      const container = host.current;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
      catch { setFailed(true); return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);
      renderer.domElement.setAttribute('aria-label', 'Interactive 3D platter of ladoo, kaju katli and gulab jamun. Drag to rotate.');
      renderer.domElement.setAttribute('role', 'img');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 4.1, 7.8); camera.lookAt(0, 0, 0);
      scene.add(new THREE.HemisphereLight(0xfff7e7, 0x7a513a, 3));
      const light = new THREE.DirectionalLight(0xffedcf, 5); light.position.set(-3, 6, 5); scene.add(light);
      const rim = new THREE.DirectionalLight(0xffffff, 2); rim.position.set(4, 3, -3); scene.add(rim);
      const group = new THREE.Group(); scene.add(group);
      const gold = new THREE.MeshStandardMaterial({ color: 0xb7904d, metalness: .8, roughness: .3 });
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 1.98, .11, 80), gold); plate.position.y = -.45; group.add(plate);
      const edge = new THREE.Mesh(new THREE.TorusGeometry(2.04, .07, 12, 96), gold); edge.rotation.x = Math.PI/2; edge.position.y = -.37; group.add(edge);
      const ladooMaterial = new THREE.MeshStandardMaterial({ color: 0xeb8a18, roughness: .84 });
      const crumbMaterial = new THREE.MeshStandardMaterial({ color: 0xf9a526, roughness: .9 });
      const nutMaterial = new THREE.MeshStandardMaterial({ color: 0x72813b, roughness: .8 });
      const sphere = new THREE.SphereGeometry(.37, 32, 20);
      const positions = [[-.9,-.01,.45],[-1.35,-.01,-.23],[-.62,-.01,-.32]];
      let seed = 31; const random = () => { seed = (seed * 16807) % 2147483647; return seed/2147483647; };
      positions.forEach(([x,y,z])=> {
        const sweet = new THREE.Mesh(sphere, ladooMaterial); sweet.position.set(x,y,z); group.add(sweet);
        const pearls = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.035, 0), crumbMaterial, 260);
        const dummy = new THREE.Object3D();
        for (let i=0;i<260;i++) {const a=random()*Math.PI*2; const b=Math.acos(2*random()-1); const radius=.36+random()*.025; dummy.position.set(x+radius*Math.sin(b)*Math.cos(a), y+radius*Math.cos(b), z+radius*Math.sin(b)*Math.sin(a));dummy.scale.setScalar(.7+random()*.7);dummy.updateMatrix();pearls.setMatrixAt(i,dummy.matrix);}
        group.add(pearls);
        for(let j=0;j<3;j++){const nut = new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),nutMaterial);nut.scale.set(.4,.3,1.3);nut.position.set(x+(j-1)*.08,y+.35,z);nut.rotation.y=j;group.add(nut);}
      });
      const jamunMat=new THREE.MeshStandardMaterial({color:0x8b3215,roughness:.2,metalness:.08});
      [[.75,-.02,.7],[1.28,-.02,.1],[.62,-.02,-.05]].forEach(([x,y,z])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.37,32,20),jamunMat);m.scale.set(1,.95,1);m.position.set(x,y,z);group.add(m);});
      const katliMat=new THREE.MeshStandardMaterial({color:0xf1deaf,roughness:.65});
      const silver=new THREE.MeshStandardMaterial({color:0xe8e2d5,metalness:.85,roughness:.36});
      for(let i=0;i<4;i++){const katli=new THREE.Mesh(new THREE.BoxGeometry(.65,.18,.65),katliMat);katli.rotation.y=Math.PI/4+.04*i;katli.position.set(-.12+i*.23,-.23+i*.15,-.9);group.add(katli);const foil=new THREE.Mesh(new THREE.PlaneGeometry(.58,.58,6,6),silver);foil.rotation.set(-Math.PI/2,0,Math.PI/4+.04*i);foil.position.copy(katli.position);foil.position.y+=.095;group.add(foil);}
      const particles = new THREE.Group(); scene.add(particles);
      for(let i=0;i<18;i++){const m=new THREE.Mesh(new THREE.OctahedronGeometry(.018+random()*.025),gold);m.position.set((random()-.5)*5,random()*2,(random()-.5)*4);particles.add(m);}
      let down=false, lastX=0, rotation=0, vertical=0;
      const pointerDown=(e:PointerEvent)=>{down=true;lastX=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);};
      const pointerMove=(e:PointerEvent)=>{if(down){rotation+=(e.clientX-lastX)*.009;lastX=e.clientX;}};
      const pointerUp=()=>{down=false;};
      renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointercancel',pointerUp);
      const media=window.matchMedia('(prefers-reduced-motion: reduce)');
      let visible=true;const visibility=()=>{visible=!document.hidden;};document.addEventListener('visibilitychange',visibility);
      const resize=new ResizeObserver(()=>{const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});resize.observe(container);
      let frame=0,last=performance.now();
      const render=(now:number)=>{frame=requestAnimationFrame(render);const dt=Math.min((now-last)/1000,.05);last=now;if(!visible)return;if(controls.current.reset){rotation=0;vertical=0;controls.current.reset=false;}if(!down&&controls.current.playing&&!media.matches)rotation+=dt*.17;vertical+=dt;group.rotation.y=rotation;group.position.y=media.matches?0:Math.sin(vertical*.8)*.06;particles.rotation.y=-rotation*.25;renderer.render(scene,camera);};frame=requestAnimationFrame(render);
      teardown=()=>{cancelAnimationFrame(frame);resize.disconnect();document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('pointercancel',pointerUp);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose());}});renderer.dispose();renderer.domElement.remove();};
    }).catch(()=>setFailed(true));
    return()=>{disposed=true;teardown?.();};
  }, []);
  return <div className="scene-shell">
    <div ref={host} className="scene-canvas" />
    {failed && <img className="scene-fallback" src="/images/hero.png" alt="Assorted Indian sweets on a brass platter" />}
    <div className="scene-controls"><span><Hand size={15}/> Drag to discover</span><div><button aria-label={playing?'Pause 3D rotation':'Play 3D rotation'} onClick={()=>{controls.current.playing=!playing;setPlaying(!playing);}}>{playing?<Pause size={16}/>:<Play size={16}/>}</button><button aria-label="Reset 3D view" onClick={()=>{controls.current.reset=true;}}><RotateCcw size={16}/></button></div></div>
  </div>;
}
