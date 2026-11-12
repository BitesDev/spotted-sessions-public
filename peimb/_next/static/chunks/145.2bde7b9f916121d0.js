"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[145],{3145:(e,t,r)=>{r.r(t),r.d(t,{PortraitScene:()=>m});var i=r(5269),a=r(9625),o=r(3110);let n=`
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,s=`
  uniform sampler2D uPhoto;
  uniform float uScan;
  uniform float uScatter;
  uniform vec3 uAccent;
  uniform vec3 uPaper;
  uniform vec2 uResolution;
  uniform vec3 uPointer;
  varying vec2 vUv;
  float scanned() {
    float band = 1.0 - smoothstep(uScan - 0.018, uScan + 0.018, vUv.y);
    vec2 pointerDelta = (gl_FragCoord.xy / uResolution - uPointer.xy);
    pointerDelta.x *= uResolution.x / uResolution.y;
    float brush = (1.0 - smoothstep(0.07, 0.15, length(pointerDelta))) * uPointer.z;
    return max(band, brush);
  }
`,l=`
  ${s}
  varying vec3 vNormal;
  void main() {
    vec4 texel = texture2D(uPhoto, vUv);
    if (texel.a < 0.35) discard;
    // The studio portrait already carries its lighting; preserve its color.
    vec3 photograph = texel.rgb;
    float relief = max(0.0, dot(normalize(vNormal), normalize(vec3(-0.65, 0.45, 0.6))));
    vec3 graphite = mix(vec3(0.008), uAccent * 0.4, relief) + photograph * 0.12;
    vec3 color = mix(photograph, graphite, scanned());
    float line = 1.0 - smoothstep(0.002, 0.009, abs(vUv.y - uScan));
    color = mix(color, uPaper, line * 0.7);
    gl_FragColor = vec4(color, texel.a * (1.0 - uScatter));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`,h=`
  attribute vec3 barycentric;
  varying vec3 vBarycentric;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vBarycentric = barycentric;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,u=`
  ${s}
  varying vec3 vBarycentric;
  varying vec3 vNormal;
  void main() {
    float alpha = texture2D(uPhoto, vUv).a;
    if (alpha < 0.7) discard;
    vec3 edge = smoothstep(vec3(0.0), fwidth(vBarycentric) * 0.65, vBarycentric);
    float grid = 1.0 - min(edge.x, min(edge.y, edge.z));
    float leading = 1.0 - smoothstep(0.0, 0.08, abs(vUv.y - uScan));
    float light = max(0.0, dot(normalize(vNormal), normalize(vec3(-0.5, 0.7, 1.0))));
    vec3 color = mix(uAccent, uPaper, 0.25 + leading * 0.6 + light * 0.3);
    gl_FragColor = vec4(color, grid * scanned() * alpha * (1.0 - uScatter) * (0.3 + light * 0.6));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`,c=`
  attribute vec3 escape;
  uniform float uScatter;
  uniform float uPixelRatio;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position + escape * uScatter;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (1.2 + uScatter * 0.6) * uPixelRatio;
  }
`,d=`
  ${s}
  void main() {
    float alpha = texture2D(uPhoto, vUv).a;
    if (alpha < 0.75 || distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;
    float appear = mix(0.23, 1.0, smoothstep(0.0, 0.35, uScatter));
    gl_FragColor = vec4(mix(uAccent, uPaper, 0.7), alpha * scanned() * appear * (1.0 - uScatter));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;class m{constructor(e,t){this.container=e,this.mobile=t,this.scene=new i.Z58,this.group=new i.YJl,this.camera=new i.qUd(-1,1,1,-1,.1,30),this.geometries=[],this.materials=[],this.texture=null,this.disposed=!1;const r=getComputedStyle(e);this.renderer=new a.JeP({alpha:!0,antialias:!t,stencil:!1,powerPreference:t?"default":"high-performance"}),this.renderer.setPixelRatio(Math.min(devicePixelRatio,t?o.E.quality.mobilePixelRatio:o.E.quality.desktopPixelRatio)),this.renderer.setClearColor(0,0),this.renderer.outputColorSpace=i.er$,this.renderer.domElement.setAttribute("aria-hidden","true"),e.appendChild(this.renderer.domElement),this.camera.position.z=o.E.camera.z,this.uniforms={uPhoto:{value:null},uScan:{value:0},uScatter:{value:0},uAccent:{value:new i.Q1f(r.getPropertyValue("--stage-accent").trim())},uPaper:{value:new i.Q1f(r.getPropertyValue("--stage-ground").trim())},uPixelRatio:{value:this.renderer.getPixelRatio()},uResolution:{value:new i.I9Y},uPointer:{value:new i.Pq0(-2,-2,0)}},this.scene.add(this.group),this.resize()}geometry(e,t,r,a=!1){let n=new i.bdM(o.E.surface.width,o.E.surface.height,t,r),s=n.getAttribute("position"),l=n.getAttribute("uv");for(let n=0;n<=r;n++)for(let h=0;h<=t;h++){let u=n*(t+1)+h,c=0===n||n===r||0===h||h===t,d=(h+(a&&!c?.3*Math.sin(12.9898*u):0))/t,m=(n+(a&&!c?.3*Math.sin(78.233*u):0))/r,p=d*(o.E.columns-1),v=m*(o.E.rows-1),g=Math.floor(p),f=Math.floor(v),x=Math.min(g+1,o.E.columns-1),y=Math.min(f+1,o.E.rows-1),w=i.cj9.lerp(e[f*o.E.columns+g],e[f*o.E.columns+x],p-g),E=i.cj9.lerp(e[y*o.E.columns+g],e[y*o.E.columns+x],p-g),S=i.cj9.lerp(w,E,v-f);s.setXYZ(u,(d-.5)*o.E.surface.width,(.5-m)*o.E.surface.height,(S-.5)*o.E.surface.relief),l.setXY(u,d,1-m)}return n.computeVertexNormals(),n}async load(e,t){let r=await fetch(o.E.depth,{signal:t});if(!r.ok)throw Error("Portrait depth unavailable");let a=new Uint8Array(await r.arrayBuffer());if(a.length!==o.E.columns*o.E.rows)throw Error("Invalid portrait depth");if(t.aborted||this.disposed)return;let s=Float32Array.from(a,e=>e/255),m=new i.gPd(e);m.needsUpdate=!0;let p=m.image,v=this.mobile?o.E.quality.mobileTexture:o.E.quality.desktopTexture;if(Math.max(p.naturalWidth,p.naturalHeight)>v){let e=document.createElement("canvas"),t=v/Math.max(p.naturalWidth,p.naturalHeight);e.width=Math.round(p.naturalWidth*t),e.height=Math.round(p.naturalHeight*t);let r=e.getContext("2d");r&&(r.drawImage(p,0,0,e.width,e.height),m.dispose(),m=new i.GOR(e))}m.colorSpace=i.er$,m.anisotropy=1,this.texture=m,this.uniforms.uPhoto.value=m;let[g,f]=this.mobile?o.E.mesh.mobile:o.E.mesh.desktop,x=this.geometry(s,g,f),y=new i.BKk({uniforms:this.uniforms,vertexShader:n,fragmentShader:l,transparent:!0}),w=new i.eaF(x,y);this.group.add(w),this.geometries.push(x),this.materials.push(y);let E=this.geometry(s,...o.E.mesh.wire,!0),S=E.toNonIndexed();E.dispose();let P=new Float32Array(3*S.getAttribute("position").count);for(let e=0;e<P.length/3;e++)P[3*e+e%3]=1;S.setAttribute("barycentric",new i.THS(P,3));let b=new i.BKk({uniforms:this.uniforms,vertexShader:h,fragmentShader:u,transparent:!0,depthTest:!1,depthWrite:!1}),M=new i.eaF(S,b);M.renderOrder=1,this.group.add(M),this.geometries.push(S),this.materials.push(b);let z=this.geometry(s,this.mobile?72:110,this.mobile?108:165);z.setIndex(null);let _=z.getAttribute("position"),A=new Float32Array(3*_.count);for(let e=0;e<_.count;e++){let t=43758.5453*Math.sin(127.1*e+31.7),r=t-Math.floor(t);A[3*e]=1.4*_.getX(e)+(r-.5)*.8,A[3*e+1]=(r-.35)*.9,A[3*e+2]=1.6*r}z.setAttribute("escape",new i.THS(A,3));let C=new i.BKk({uniforms:this.uniforms,vertexShader:c,fragmentShader:d,transparent:!0,depthTest:!1,depthWrite:!1}),R=new i.ONl(z,C);if(R.frustumCulled=!1,R.renderOrder=2,this.group.add(R),this.geometries.push(z),this.materials.push(C),this.renderer.initTexture(m),await this.renderer.compileAsync(this.scene,this.camera),t.aborted||this.disposed)return;let U=this.renderer.getSize(new i.I9Y);for(let e of(this.renderer.setSize(1,1,!1),[0,.25,.5,.75,1]))this.uniforms.uScan.value=e,this.renderer.render(this.scene,this.camera);this.renderer.setSize(U.x,U.y,!1),this.update(0,0,0,0,0),this.render(),this.container.dataset.drawCalls=String(this.renderer.info.render.calls),this.container.dataset.programs=String(this.renderer.info.programs?.length??0),this.container.dataset.triangles=String(this.renderer.info.render.triangles),this.container.dataset.points=String(this.renderer.info.render.points)}resize(){let{width:e,height:t}=this.container.getBoundingClientRect();if(!e||!t)return;let r=e/t,i=o.E.camera.height/2;this.camera.left=-i*r,this.camera.right=i*r,this.camera.top=i,this.camera.bottom=-i,this.camera.updateProjectionMatrix(),this.renderer.setSize(e,t),this.renderer.getDrawingBufferSize(this.uniforms.uResolution.value);let a=this.mobile||r<1,n=a?o.E.layout.mobile:o.E.layout.desktop,s=a?n.x*r:i*r-o.E.surface.width*n.scale/2;this.group.position.set(s,n.y,0),this.group.scale.setScalar(n.scale)}update(e,t,r,a,n){let s=o.E.timeline,l=Math.min(1.08,o.E.introductoryScan*t+e/s.scanEnd*(1.08-o.E.introductoryScan)),h=i.cj9.smoothstep(e,s.scatterStart,s.scatterEnd);this.uniforms.uScan.value=l,this.uniforms.uScatter.value=h,this.uniforms.uPointer.value.set((r+1)/2,(1-a)/2,n),this.group.rotation.y=r*o.E.maxTilt+.85*e,this.group.rotation.x=-a*o.E.maxTilt*.4,this.group.rotation.z=-(.05*e)}render(){this.renderer.render(this.scene,this.camera)}dispose(){this.disposed=!0,this.geometries.forEach(e=>e.dispose()),this.materials.forEach(e=>e.dispose()),this.texture?.dispose(),this.renderer.dispose(),this.renderer.domElement.remove()}}}}]);