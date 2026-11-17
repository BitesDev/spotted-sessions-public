"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[637],{637:(e,t,r)=>{r.r(t),r.d(t,{PortraitScene:()=>d});var i=r(1502),a=r(7957),o=r(5601);let n=`
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,s=`
  uniform sampler2D uPhoto;
  uniform sampler2D uMask;
  uniform vec4 uPhotoBounds;
  uniform float uScan;
  uniform float uScatter;
  uniform vec3 uAccent;
  uniform vec3 uPaper;
  uniform vec2 uResolution;
  uniform vec3 uPointer;
  varying vec2 vUv;
  vec4 samplePhoto() {
    vec2 photoUv = uPhotoBounds.xy + vUv * uPhotoBounds.zw;
    return vec4(texture2D(uPhoto, photoUv).rgb, texture2D(uMask, vUv).r);
  }
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
    vec4 texel = samplePhoto();
    if (texel.a < 0.35) discard;
    // Preserve the original photograph's color and lighting.
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
`,u=`
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
`,h=`
  ${s}
  varying vec3 vBarycentric;
  varying vec3 vNormal;
  void main() {
    float alpha = samplePhoto().a;
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
`,m=`
  ${s}
  void main() {
    float alpha = samplePhoto().a;
    if (alpha < 0.75 || distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;
    float appear = mix(0.23, 1.0, smoothstep(0.0, 0.35, uScatter));
    gl_FragColor = vec4(mix(uAccent, uPaper, 0.7), alpha * scanned() * appear * (1.0 - uScatter));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;class d{constructor(e,t){this.container=e,this.mobile=t,this.scene=new i.Z58,this.group=new i.YJl,this.camera=new i.qUd(-1,1,1,-1,.1,30),this.geometries=[],this.materials=[],this.texture=null,this.maskTexture=null,this.renderCount=0,this.disposed=!1;const r=getComputedStyle(e);this.renderer=new a.JeP({alpha:!0,antialias:!t,stencil:!1,powerPreference:t?"default":"high-performance"}),this.renderer.setPixelRatio(Math.min(devicePixelRatio,t?o.E.quality.mobilePixelRatio:o.E.quality.desktopPixelRatio)),this.renderer.setClearColor(0,0),this.renderer.outputColorSpace=i.er$,this.renderer.domElement.setAttribute("aria-hidden","true"),e.appendChild(this.renderer.domElement),this.camera.position.z=o.E.camera.z,this.uniforms={uPhoto:{value:null},uMask:{value:null},uPhotoBounds:{value:new i.IUQ(o.E.crop.x,1-o.E.crop.y-o.E.crop.height,o.E.crop.width,o.E.crop.height)},uScan:{value:0},uScatter:{value:0},uAccent:{value:new i.Q1f(r.getPropertyValue("--stage-accent").trim())},uPaper:{value:new i.Q1f(r.getPropertyValue("--stage-ground").trim())},uPixelRatio:{value:this.renderer.getPixelRatio()},uResolution:{value:new i.I9Y},uPointer:{value:new i.Pq0(-2,-2,0)}},this.scene.add(this.group),this.resize()}geometry(e,t,r,a=!1){let n=new i.bdM(o.E.surface.width,o.E.surface.height,t,r),s=n.getAttribute("position"),l=n.getAttribute("uv");for(let n=0;n<=r;n++)for(let u=0;u<=t;u++){let h=n*(t+1)+u,c=0===n||n===r||0===u||u===t,m=(u+(a&&!c?.3*Math.sin(12.9898*h):0))/t,d=(n+(a&&!c?.3*Math.sin(78.233*h):0))/r,p=m*(o.E.columns-1),v=d*(o.E.rows-1),g=Math.floor(p),f=Math.floor(v),x=Math.min(g+1,o.E.columns-1),E=Math.min(f+1,o.E.rows-1),w=i.cj9.lerp(e[f*o.E.columns+g],e[f*o.E.columns+x],p-g),y=i.cj9.lerp(e[E*o.E.columns+g],e[E*o.E.columns+x],p-g),P=i.cj9.lerp(w,y,v-f);s.setXYZ(h,(m-.5)*o.E.surface.width,(.5-d)*o.E.surface.height,(P-.5)*o.E.surface.relief),l.setXY(h,m,1-d)}return n.computeVertexNormals(),n}async load(e,t){let[r,a]=await Promise.all([fetch(o.E.depth,{signal:t}),fetch(o.E.mask,{signal:t})]);if(!r.ok||!a.ok)throw Error("Portrait data unavailable");let[s,d]=await Promise.all([r.arrayBuffer(),a.arrayBuffer()]),p=new Uint8Array(s),v=new Uint8Array(d);if(p.length!==o.E.columns*o.E.rows)throw Error("Invalid portrait depth");if(v.length!==o.E.maskColumns*o.E.maskRows)throw Error("Invalid portrait mask");if(t.aborted||this.disposed)return;let g=Float32Array.from(p,e=>e/255),f=new i.gPd(e);f.needsUpdate=!0;let x=f.image,E=this.mobile?o.E.quality.mobileTexture:o.E.quality.desktopTexture;if(Math.max(x.naturalWidth,x.naturalHeight)>E){let e=document.createElement("canvas"),t=E/Math.max(x.naturalWidth,x.naturalHeight);e.width=Math.round(x.naturalWidth*t),e.height=Math.round(x.naturalHeight*t);let r=e.getContext("2d");r&&(r.drawImage(x,0,0,e.width,e.height),f.dispose(),f=new i.GOR(e))}f.colorSpace=i.er$,f.anisotropy=1,this.texture=f,this.uniforms.uPhoto.value=f;let w=new i.GYF(v,o.E.maskColumns,o.E.maskRows,i.VT0,i.OUM);w.flipY=!0,w.minFilter=i.k6q,w.magFilter=i.k6q,w.generateMipmaps=!1,w.colorSpace=i.jf0,w.needsUpdate=!0,this.maskTexture=w,this.uniforms.uMask.value=w;let[y,P]=this.mobile?o.E.mesh.mobile:o.E.mesh.desktop,S=this.geometry(g,y,P),b=new i.BKk({uniforms:this.uniforms,vertexShader:n,fragmentShader:l,transparent:!0}),M=new i.eaF(S,b);this.group.add(M),this.geometries.push(S),this.materials.push(b);let k=this.geometry(g,...o.E.mesh.wire,!0),C=k.toNonIndexed();k.dispose();let U=new Float32Array(3*C.getAttribute("position").count);for(let e=0;e<U.length/3;e++)U[3*e+e%3]=1;C.setAttribute("barycentric",new i.THS(U,3));let z=new i.BKk({uniforms:this.uniforms,vertexShader:u,fragmentShader:h,transparent:!0,depthTest:!1,depthWrite:!1}),_=new i.eaF(C,z);_.renderOrder=1,this.group.add(_),this.geometries.push(C),this.materials.push(z);let A=this.geometry(g,this.mobile?72:110,this.mobile?108:165);A.setIndex(null);let R=A.getAttribute("position"),B=new Float32Array(3*R.count);for(let e=0;e<R.count;e++){let t=43758.5453*Math.sin(127.1*e+31.7),r=t-Math.floor(t);B[3*e]=1.4*R.getX(e)+(r-.5)*.8,B[3*e+1]=(r-.35)*.9,B[3*e+2]=1.6*r}A.setAttribute("escape",new i.THS(B,3));let T=new i.BKk({uniforms:this.uniforms,vertexShader:c,fragmentShader:m,transparent:!0,depthTest:!1,depthWrite:!1}),N=new i.ONl(A,T);if(N.frustumCulled=!1,N.renderOrder=2,this.group.add(N),this.geometries.push(A),this.materials.push(T),this.renderer.initTexture(f),this.renderer.initTexture(w),await this.renderer.compileAsync(this.scene,this.camera),t.aborted||this.disposed)return;let F=this.renderer.getSize(new i.I9Y);for(let e of(this.renderer.setSize(1,1,!1),[0,.25,.5,.75,1]))this.uniforms.uScan.value=e,this.render();this.renderer.setSize(F.x,F.y,!1),this.update(0,0,0,0,0),this.render()}resize(){let{width:e,height:t}=this.container.getBoundingClientRect();if(!e||!t)return;let r=e/t,i=o.E.camera.height/2;this.camera.left=-i*r,this.camera.right=i*r,this.camera.top=i,this.camera.bottom=-i,this.camera.updateProjectionMatrix(),this.renderer.setSize(e,t),this.renderer.getDrawingBufferSize(this.uniforms.uResolution.value);let a=this.mobile||r<1?o.E.layout.mobile:o.E.layout.desktop,n=Math.min(o.E.camera.height/o.E.surface.height,o.E.camera.height*r/o.E.surface.width);this.group.position.set(0,0,0),this.group.scale.setScalar(n*a.scale)}update(e,t,r,a,n){let s=o.E.timeline,l=Math.min(1.08,o.E.introductoryScan*t+e/s.scanEnd*(1.08-o.E.introductoryScan)),u=i.cj9.smoothstep(e,s.scatterStart,s.scatterEnd);this.uniforms.uScan.value=l,this.uniforms.uScatter.value=u,this.uniforms.uPointer.value.set((r+1)/2,(1-a)/2,n),this.group.rotation.y=r*o.E.maxTilt+.85*e,this.group.rotation.x=-a*o.E.maxTilt*.4,this.group.rotation.z=-(.05*e)}render(){for(let[e,t]of(this.renderer.render(this.scene,this.camera),this.renderCount+=1,Object.entries({drawCalls:this.renderer.info.render.calls,programs:this.renderer.info.programs?.length??0,triangles:this.renderer.info.render.triangles,points:this.renderer.info.render.points,renderCount:this.renderCount,textureCount:this.renderer.info.memory.textures}))){let r=String(t);this.container.dataset[e]!==r&&(this.container.dataset[e]=r)}}dispose(){this.disposed=!0,this.geometries.forEach(e=>e.dispose()),this.materials.forEach(e=>e.dispose()),this.texture?.dispose(),this.maskTexture?.dispose(),this.renderer.dispose(),this.renderer.domElement.remove()}}}}]);