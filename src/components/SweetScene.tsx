'use client';
import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Hand, Pause, Play } from 'lucide-react';

export default function SweetScene() {
  const host=useRef<HTMLDivElement>(null);
  const controls=useRef({playing:true,reset:false});
  const [playing,setPlaying]=useState(true),[failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false);
  useEffect(()=>{
    let disposed=false,teardown:(()=>void)|undefined;
    Promise.all([import('three'),import('three/addons/environments/RoomEnvironment.js')]).then(([T,{RoomEnvironment}])=>{
      if(disposed||!host.current)return;
      const container=host.current;
      let renderer:InstanceType<typeof T.WebGLRenderer>;
      try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{setFailed(true);return;}
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.setClearColor(0,0);
      renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.93;
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
      container.appendChild(renderer.domElement);
      renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Detailed interactive 3D mithai platter with motichoor ladoo, silver-leaf kaju katli, syrup-glazed gulab jamun and saffron peda. Drag to rotate.');
      const scene=new T.Scene(),camera=new T.PerspectiveCamera(29,1,.1,50);
      camera.position.set(0,4.4,5.8);camera.lookAt(0,.15,0);
      const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.045);
      scene.environment=environment.texture;scene.environmentIntensity=.48;room.dispose();
      scene.add(new T.HemisphereLight(0xfff8e9,0x67513f,.65));
      const key=new T.DirectionalLight(0xfff2d6,2.0);key.position.set(-3,6,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
      Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3});key.shadow.normalBias=.025;key.shadow.bias=-.0003;key.shadow.radius=4;scene.add(key);
      const fill=new T.DirectionalLight(0xffffff,.65);fill.position.set(4,3,-3);scene.add(fill);
      const platter=new T.Group();scene.add(platter);
      const textures:InstanceType<typeof T.Texture>[]=[];
      let seed=73;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
      function texture(kind:string){
        const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(256,256);
        for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;let v=155+rand()*65;if(kind==='foil')v=165+Math.sin(x*.18+Math.sin(y*.29)*3)*20+rand()*65;if(kind==='brass')v=185+Math.sin(y*1.6)*11+rand()*30;if(kind==='jamun')v=170+rand()*65-(rand()>.97?70:0);pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=255;}
        ctx.putImageData(pixels,0,0);const tex=new T.CanvasTexture(canvas);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(3,3);textures.push(tex);return tex;
      }
      const milkTexture=texture('milk'),jamunTexture=texture('jamun'),brassTexture=texture('brass'),foilTexture=texture('foil');
      const brass=new T.MeshStandardMaterial({color:0xb18b53,metalness:.78,roughness:.38,bumpMap:brassTexture,bumpScale:.008,envMapIntensity:.8});
      const rimMaterial=new T.MeshStandardMaterial({color:0xe3bc77,metalness:.8,roughness:.25,envMapIntensity:.8});
      const profile=[[0,-.24],[1.76,-.24],[1.91,-.20],[2.02,-.08],[2.08,.005],[2.08,.045],[2.04,.07],[1.99,.025],[1.89,-.09],[1.76,-.14],[0,-.14]].map(([x,y])=>new T.Vector2(x,y));
      const plate=new T.Mesh(new T.LatheGeometry(profile,128),brass);plate.receiveShadow=true;plate.castShadow=true;platter.add(plate);
      [2.055,1.965].forEach((r,i)=>{const ring=new T.Mesh(new T.TorusGeometry(r,i?.012:.025,12,128),rimMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=i?-.015:.045;platter.add(ring);});
      const dummy=new T.Object3D(),etching=new T.InstancedMesh(new T.SphereGeometry(.012,6,4),rimMaterial,96);
      for(let i=0;i<96;i++){const a=i/96*Math.PI*2;dummy.position.set(Math.cos(a)*2.025,.035,Math.sin(a)*2.025);dummy.scale.set(1,.45,1);dummy.updateMatrix();etching.setMatrixAt(i,dummy.matrix);}platter.add(etching);
      const green=new T.MeshStandardMaterial({color:0x74813b,roughness:.85}),pistachioInside=new T.MeshStandardMaterial({color:0xc6c17d,roughness:.8}),garnishGeometry=new T.SphereGeometry(.045,8,6);
      function garnish(parent:InstanceType<typeof T.Group>,y:number,count=7){for(let i=0;i<count;i++){const nut=new T.Mesh(garnishGeometry,i%3===0?green:pistachioInside);nut.scale.set(.45,.32,1.7);nut.position.set((rand()-.5)*.26,y+rand()*.014,(rand()-.5)*.25);nut.rotation.y=rand()*Math.PI;nut.rotation.z=(rand()-.5)*.45;nut.castShadow=true;parent.add(nut);}}
      // Fine rounded boondi replaces the large faceted particles of the initial scene.
      const ladooBody=new T.MeshStandardMaterial({color:0xd97713,roughness:.95,bumpMap:milkTexture,bumpScale:.018}),pearlMaterial=new T.MeshStandardMaterial({color:0xffffff,roughness:.88}),pearlGeometry=new T.SphereGeometry(.024,7,5);
      [[-.95,.29,.68],[-1.23,.29,.02],[-.55,.29,.05],[-.89,.88,.22]].forEach(([x,y,z],index)=>{
        const sweet=new T.Group();sweet.position.set(x,y,z);platter.add(sweet);
        const body=new T.Mesh(new T.SphereGeometry(.395,40,28),ladooBody);body.scale.y=.96;body.castShadow=true;body.receiveShadow=true;sweet.add(body);
        const pearls=new T.InstancedMesh(pearlGeometry,pearlMaterial,1900);
        for(let i=0;i<1900;i++){const a=rand()*Math.PI*2,b=Math.acos(2*rand()-1),r=.387+rand()*.013;dummy.position.set(r*Math.sin(b)*Math.cos(a),r*Math.cos(b)*.96,r*Math.sin(b)*Math.sin(a));dummy.scale.setScalar(.64+rand()*.58);dummy.rotation.set(rand()*3,rand()*3,0);dummy.updateMatrix();pearls.setMatrixAt(i,dummy.matrix);pearls.setColorAt(i,new T.Color().setHSL(.06+rand()*.025,.94,.29+rand()*.10));}
        pearls.castShadow=false;pearls.receiveShadow=true;sweet.add(pearls);garnish(sweet,.39,index===3?9:6);
      });
      const bowlGroup=new T.Group();bowlGroup.position.set(.88,0,.52);platter.add(bowlGroup);
      const ceramic=new T.MeshStandardMaterial({color:0xf2e5c9,roughness:.3});
      const bowlProfile=[[0,-.1],[.65,-.1],[.77,-.02],[.84,.13],[.82,.17],[.78,.13],[.71,.015],[0,.015]].map(([x,y])=>new T.Vector2(x,y));
      const bowl=new T.Mesh(new T.LatheGeometry(bowlProfile,80),ceramic);bowl.castShadow=true;bowl.receiveShadow=true;bowlGroup.add(bowl);
      const syrup=new T.Mesh(new T.CylinderGeometry(.73,.73,.016,64),new T.MeshPhysicalMaterial({color:0xa9651e,roughness:.13,metalness:0,clearcoat:1,clearcoatRoughness:.08}));syrup.position.y=.035;bowlGroup.add(syrup);
      const jamunMaterial=new T.MeshPhysicalMaterial({color:0x50200d,map:jamunTexture,bumpMap:jamunTexture,bumpScale:.012,roughness:.36,metalness:0,clearcoat:.45,clearcoatRoughness:.28});
      [[-.30,.30,.25],[.28,.29,.26],[-.31,.31,-.30],[.28,.31,-.30],[0,.78,0]].forEach(([x,y,z],i)=>{const sweet=new T.Group();sweet.position.set(x,y,z);bowlGroup.add(sweet);const m=new T.Mesh(new T.SphereGeometry(.29,40,28),jamunMaterial);m.scale.set(1,.94,1.06);m.rotation.z=i*.16;m.castShadow=true;m.receiveShadow=true;sweet.add(m);if(i===4||i===1)garnish(sweet,.27,3);});
      // Rounded diamonds with edible silver leaf; an environment supplies the missing reflections.
      const diamond=new T.Shape();diamond.moveTo(0,-.48);diamond.quadraticCurveTo(.015,-.48,.04,-.44);diamond.lineTo(.36,-.045);diamond.quadraticCurveTo(.395,0,.36,.045);diamond.lineTo(.04,.44);diamond.quadraticCurveTo(0,.49,-.04,.44);diamond.lineTo(-.36,.045);diamond.quadraticCurveTo(-.395,0,-.36,-.045);diamond.lineTo(-.04,-.44);diamond.quadraticCurveTo(-.015,-.48,0,-.48);
      const katliGeometry=new T.ExtrudeGeometry(diamond,{depth:.115,bevelEnabled:true,bevelSize:.018,bevelThickness:.015,bevelSegments:3,steps:1,curveSegments:8});katliGeometry.rotateX(-Math.PI/2);
      const katliMaterial=new T.MeshStandardMaterial({color:0xe6d4a3,roughness:.82,bumpMap:milkTexture,bumpScale:.012}),foilGeometry=new T.ShapeGeometry(diamond,12);foilGeometry.rotateX(-Math.PI/2);
      const foilMaterial=new T.MeshStandardMaterial({color:0xd5d2c6,metalness:.88,roughness:.3,bumpMap:foilTexture,bumpScale:.017,envMapIntensity:1.15,side:T.DoubleSide});
      [[-.55,.005,-.96,-.35],[.12,.005,-1.18,-.35],[.74,.005,-1.10,-.35],[-.20,.16,-.96,-.24],[.42,.16,-1.10,-.24]].forEach(([x,y,z,r])=>{const sweet=new T.Group();sweet.position.set(x,y,z);sweet.rotation.y=r;platter.add(sweet);const base=new T.Mesh(katliGeometry,katliMaterial);base.castShadow=true;base.receiveShadow=true;sweet.add(base);const foil=new T.Mesh(foilGeometry,foilMaterial);foil.position.y=.134;foil.scale.setScalar(.94);foil.receiveShadow=true;sweet.add(foil);});
      const pedaMaterial=new T.MeshStandardMaterial({color:0xe7bc57,roughness:.83,bumpMap:milkTexture,bumpScale:.018});
      const pedaProfile=[[0,-.12],[.18,-.12],[.28,-.09],[.32,-.02],[.31,.055],[.26,.13],[.18,.14],[.10,.11],[0,.10]].map(([x,y])=>new T.Vector2(x,y)),pedaGeometry=new T.LatheGeometry(pedaProfile,64);
      [[-.12,.01,1.38],[.50,.01,1.30],[.17,.20,.99]].forEach(([x,y,z])=>{const sweet=new T.Group();sweet.position.set(x,y,z);platter.add(sweet);const m=new T.Mesh(pedaGeometry,pedaMaterial);m.castShadow=true;m.receiveShadow=true;sweet.add(m);garnish(sweet,.15,5);});
      const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const shadowCtx=shadowCanvas.getContext('2d')!,gradient=shadowCtx.createRadialGradient(64,64,10,64,64,64);gradient.addColorStop(0,'rgba(65,40,15,.28)');gradient.addColorStop(.65,'rgba(65,40,15,.13)');gradient.addColorStop(1,'rgba(65,40,15,0)');shadowCtx.fillStyle=gradient;shadowCtx.fillRect(0,0,128,128);
      const shadowTexture=new T.CanvasTexture(shadowCanvas);textures.push(shadowTexture);const shadow=new T.Mesh(new T.PlaneGeometry(5.4,5.4),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.29;scene.add(shadow);
      let dragging=false,lastX=0,angle=-.20,targetAngle=-.20,elapsed=0;
      const pointerDown=(e:PointerEvent)=>{dragging=true;lastX=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);},pointerMove=(e:PointerEvent)=>{if(dragging){targetAngle+=(e.clientX-lastX)*.009;lastX=e.clientX;}},pointerUp=()=>{dragging=false;},contextLost=(e:Event)=>{e.preventDefault();setFailed(true);};
      const events={pointerdown:pointerDown,pointermove:pointerMove,pointerup:pointerUp,pointercancel:pointerUp,webglcontextlost:contextLost};
      renderer.domElement.addEventListener('pointerdown',events.pointerdown);renderer.domElement.addEventListener('pointermove',events.pointermove);renderer.domElement.addEventListener('pointerup',events.pointerup);renderer.domElement.addEventListener('pointercancel',events.pointercancel);renderer.domElement.addEventListener('webglcontextlost',events.webglcontextlost);
      const media=window.matchMedia('(prefers-reduced-motion: reduce)');let inView=true;const observer=new IntersectionObserver(entries=>{inView=!!entries[0]?.isIntersecting;},{rootMargin:'80px'});observer.observe(container);
      const resize=new ResizeObserver(()=>{const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=w/h<1?7.1:5.8;camera.updateProjectionMatrix();});resize.observe(container);
      let frame=0,last=performance.now(),first=true;
      const render=(now:number)=>{frame=requestAnimationFrame(render);const dt=Math.min((now-last)/1000,.05);last=now;if(!inView||document.hidden)return;if(controls.current.reset){targetAngle=-.20;elapsed=0;controls.current.reset=false;}if(!dragging&&controls.current.playing&&!media.matches){targetAngle+=dt*.085;elapsed+=dt;}angle=T.MathUtils.lerp(angle,targetAngle,Math.min(dt*10,1));platter.rotation.y=angle;platter.position.y=media.matches?0:Math.sin(elapsed*.65)*.022;renderer.render(scene,camera);if(first){first=false;setLoaded(true);}};frame=requestAnimationFrame(render);
      teardown=()=>{cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();renderer.domElement.removeEventListener('pointerdown',events.pointerdown);renderer.domElement.removeEventListener('pointermove',events.pointermove);renderer.domElement.removeEventListener('pointerup',events.pointerup);renderer.domElement.removeEventListener('pointercancel',events.pointercancel);renderer.domElement.removeEventListener('webglcontextlost',events.webglcontextlost);const geometries=new Set<InstanceType<typeof T.BufferGeometry>>(),materials=new Set<InstanceType<typeof T.Material>>();scene.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());environment.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();};
    }).catch(()=>setFailed(true));return()=>{disposed=true;teardown?.();};
  },[]);
  return <div className={`scene-shell refined-scene ${loaded&&!failed?'scene-ready':''}`}><div ref={host} className="scene-canvas" style={{visibility:failed?'hidden':'visible'}}/>{(!loaded||failed)&&<img className="scene-fallback" src="/images/hero.png" alt="Assorted Indian sweets on a brass platter"/>}<div className="scene-controls"><span><Hand size={15}/>{failed?'Our mithai selection':'Drag to discover'}</span><div><button disabled={failed} aria-label={playing?'Pause 3D rotation':'Play 3D rotation'} onClick={()=>{controls.current.playing=!playing;setPlaying(!playing);}}>{playing?<Pause size={16}/>:<Play size={16}/>}</button><button disabled={failed} aria-label="Reset 3D view" onClick={()=>{controls.current.reset=true;}}><RotateCcw size={16}/></button></div></div></div>;
}


