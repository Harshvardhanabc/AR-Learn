/**
 * AR Smart Learning Platform — viewer.js  (v2 — Camera-AR Mode)
 *
 * BEHAVIOUR:
 *  • Camera permission lene ke baad seedha getUserMedia se back camera khulta hai
 *  • Camera feed <video> element page ke peeche (z-index:0) dikhta hai
 *  • Three.js canvas transparent hota hai — model camera ke upar float karta hai
 *  • 3D model turant center mein dikhta hai, koi "surface" scan karne ki zaroorat nahi
 *  • Drag → rotate | Pinch → scale | Tap → hotspot info
 */

// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════

const ARViewer = {
  renderer : null,
  scene    : null,
  camera   : null,
  clock    : null,
  controls : null,

  modelGroup   : null,
  modelScale   : 1,
  modelRotating: true,

  topic      : null,
  quizData   : [],
  quizSubmitted: false,

  voicePlaying: false,
  utterance   : null,

  raycaster: new THREE.Raycaster(),
  mouse    : new THREE.Vector2(),

  cameraStream: null,

  touch: { startX:0, startY:0, lastDist:0, dragging:false },
};

// ═══════════════════════════════════════════════════════
// 3D MODEL BUILDERS
// ═══════════════════════════════════════════════════════

const MODEL_BUILDERS = {

  heart: () => {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color:0xcc2233, shininess:60 });
    const L = new THREE.Mesh(new THREE.SphereGeometry(0.12,32,32), mat);
    L.position.set(-0.06,0.04,0); g.add(L);
    const R = new THREE.Mesh(new THREE.SphereGeometry(0.10,32,32), mat);
    R.position.set(0.06,0.04,0); g.add(R);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09,0.18,32), mat);
    tip.position.set(0,-0.12,0); tip.rotation.z=Math.PI; g.add(tip);
    const aorta = new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.18,16),
      new THREE.MeshPhongMaterial({color:0xcc3344}));
    aorta.position.set(-0.04,0.22,0); aorta.rotation.z=0.3; aorta.name='Aorta'; g.add(aorta);
    const pulm = new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.15,16),
      new THREE.MeshPhongMaterial({color:0x5588cc}));
    pulm.position.set(0.06,0.2,0.04); pulm.rotation.z=-0.4; pulm.name='Pulmonary Artery'; g.add(pulm);
    const vMat = new THREE.MeshPhongMaterial({color:0x334477});
    [-0.07,0.07].forEach((x,i)=>{
      const v=new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,0.12,12),vMat);
      v.position.set(x,0.19,-0.03); v.rotation.z=i===0?0.5:-0.5; g.add(v);
    });
    addHS(g,-0.09,0.0,0.1,'Left Ventricle');
    addHS(g,0.09,0.0,0.1,'Right Ventricle');
    addHS(g,0,0.1,0.12,'Mitral Valve');
    return g;
  },

  brain: () => {
    const g=new THREE.Group();
    const m=new THREE.MeshPhongMaterial({color:0xf4a261,shininess:30});
    const m2=new THREE.MeshPhongMaterial({color:0xe76f51,shininess:30});
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.16,32,32,0,Math.PI*2,0,Math.PI/2),m));
    const h2=new THREE.Mesh(new THREE.SphereGeometry(0.155,32,32,0,Math.PI*2,0,Math.PI/2),m2);
    h2.position.x=0.01; g.add(h2);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.16,32,32,0,Math.PI*2,Math.PI/2,Math.PI/2),m));
    const cer=new THREE.Mesh(new THREE.SphereGeometry(0.07,24,24),new THREE.MeshPhongMaterial({color:0xe9c46a}));
    cer.position.set(0,-0.1,-0.1); cer.name='Cerebellum'; g.add(cer);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.02,0.1,12),m);
    stem.position.set(0,-0.17,-0.05); stem.name='Brain Stem'; g.add(stem);
    addHS(g,0,0.12,0.12,'Frontal Lobe');
    addHS(g,0.15,0,0,'Temporal Lobe');
    addHS(g,0,-0.05,0.15,'Corpus Callosum');
    return g;
  },

  dna: () => {
    const g=new THREE.Group();
    const m1=new THREE.MeshPhongMaterial({color:0x4ecdc4});
    const m2=new THREE.MeshPhongMaterial({color:0xff6b6b});
    const bm=new THREE.MeshPhongMaterial({color:0xffd93d});
    const turns=3,steps=24*turns,height=0.6,r=0.08;
    for(let i=0;i<=steps;i++){
      const t=i/steps,angle=t*Math.PI*2*turns,y=(t-0.5)*height;
      const x1=Math.cos(angle)*r,z1=Math.sin(angle)*r;
      const x2=Math.cos(angle+Math.PI)*r,z2=Math.sin(angle+Math.PI)*r;
      if(i%2===0){
        const s1=new THREE.Mesh(new THREE.SphereGeometry(0.012,8,8),m1);
        s1.position.set(x1,y,z1); g.add(s1);
        const s2=new THREE.Mesh(new THREE.SphereGeometry(0.012,8,8),m2);
        s2.position.set(x2,y,z2); g.add(s2);
      }
      if(i%4===0){
        const rg=new THREE.Mesh(new THREE.CylinderGeometry(0.005,0.005,r*2,6),bm);
        rg.position.set((x1+x2)/2,y,(z1+z2)/2);
        rg.lookAt(new THREE.Vector3(x1,y,z1)); rg.rotateX(Math.PI/2);
        rg.name=i%8===0?'Adenine-Thymine':'Guanine-Cytosine'; g.add(rg);
      }
    }
    addHS(g,0.1,0.2,0,'Phosphate Backbone');
    addHS(g,-0.1,-0.1,0.05,'Sugar Group');
    return g;
  },

  atom: () => {
    const g=new THREE.Group();
    const nuc=new THREE.Mesh(new THREE.SphereGeometry(0.04,32,32),
      new THREE.MeshPhongMaterial({color:0xf97316,emissive:0x331100,shininess:80}));
    nuc.name='Nucleus'; g.add(nuc);
    const pM=new THREE.MeshPhongMaterial({color:0xef4444});
    const nM=new THREE.MeshPhongMaterial({color:0x94a3b8});
    for(let i=0;i<3;i++){
      const a=(i/3)*Math.PI*2;
      const p=new THREE.Mesh(new THREE.SphereGeometry(0.015,16,16),pM);
      p.position.set(Math.cos(a)*0.02,0,Math.sin(a)*0.02); p.name='Proton'; g.add(p);
      const n=new THREE.Mesh(new THREE.SphereGeometry(0.015,16,16),nM);
      n.position.set(Math.cos(a+0.5)*0.015,0.01,Math.sin(a+0.5)*0.015); n.name='Neutron'; g.add(n);
    }
    const sM=new THREE.MeshBasicMaterial({color:0x63e8b6,wireframe:true,transparent:true,opacity:0.35});
    [0.13,0.22,0.32].forEach((r,si)=>{
      const ring=new THREE.Mesh(new THREE.TorusGeometry(r,0.003,8,64),sM);
      ring.rotation.x=si*0.6; ring.rotation.y=si*0.4;
      ring.name=`Electron Shell ${si+1}`; g.add(ring);
    });
    const eM=new THREE.MeshPhongMaterial({color:0x60a5fa,emissive:0x112233});
    [{r:0.13,y:0,c:2},{r:0.22,y:0.03,c:3},{r:0.32,y:-0.03,c:3}].forEach(({r,y,c})=>{
      for(let i=0;i<c;i++){
        const e=new THREE.Mesh(new THREE.SphereGeometry(0.012,12,12),eM);
        const a=(i/c)*Math.PI*2;
        e.position.set(Math.cos(a)*r,y,Math.sin(a)*r);
        e.name='Electron';
        e.userData.orbitRadius=r; e.userData.orbitAngle=a;
        e.userData.orbitSpeed=0.5+Math.random()*0.5; e.userData.isElectron=true;
        g.add(e);
      }
    });
    addHS(g,0.14,0.07,0.07,'Electron Shell');
    return g;
  },

  earth: () => {
    const g=new THREE.Group();
    const core=new THREE.Mesh(new THREE.SphereGeometry(0.04,24,24),
      new THREE.MeshPhongMaterial({color:0xf97316,emissive:0x220800}));
    core.name='Inner Core'; g.add(core);
    const oCore=new THREE.Mesh(new THREE.SphereGeometry(0.07,24,24),
      new THREE.MeshPhongMaterial({color:0xea580c,transparent:true,opacity:0.7}));
    oCore.name='Outer Core'; g.add(oCore);
    const mantle=new THREE.Mesh(new THREE.SphereGeometry(0.11,24,24),
      new THREE.MeshPhongMaterial({color:0x78350f,transparent:true,opacity:0.65}));
    mantle.name='Mantle'; g.add(mantle);
    const crust=new THREE.Mesh(new THREE.SphereGeometry(0.135,32,32),
      new THREE.MeshPhongMaterial({color:0x1d4ed8,transparent:true,opacity:0.75,shininess:120}));
    crust.name='Crust'; g.add(crust);
    const lM=new THREE.MeshPhongMaterial({color:0x22c55e});
    [[0.04,0.1,0.09],[-0.08,0.05,0.1],[0.09,-0.07,0.1]].forEach(([x,y,z])=>{
      const p=new THREE.Mesh(new THREE.SphereGeometry(0.04,12,12),lM);
      p.position.set(x,y,z); g.add(p);
    });
    const atm=new THREE.Mesh(new THREE.SphereGeometry(0.155,32,32),
      new THREE.MeshPhongMaterial({color:0x93c5fd,transparent:true,opacity:0.12,side:THREE.BackSide}));
    atm.name='Atmosphere'; g.add(atm);
    addHS(g,0,0.14,0.06,'Atmosphere');
    addHS(g,0.12,0.03,0.06,'Crust');
    return g;
  },

  solar: () => {
    const g=new THREE.Group();
    const sun=new THREE.Mesh(new THREE.SphereGeometry(0.07,32,32),
      new THREE.MeshPhongMaterial({color:0xfbbf24,emissive:0x7c2d12,shininess:200}));
    sun.name='Sun'; g.add(sun);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.085,16,16),
      new THREE.MeshBasicMaterial({color:0xf97316,transparent:true,opacity:0.15,side:THREE.BackSide})));
    const planets=[
      ['Mercury',0x9ca3af,0.012,0.10,2.0],['Venus',0xf59e0b,0.018,0.15,1.5],
      ['Earth',0x3b82f6,0.019,0.21,1.0],['Mars',0xef4444,0.015,0.28,0.8],
      ['Jupiter',0xca8a04,0.038,0.38,0.5],['Saturn',0xfde68a,0.032,0.50,0.4],
      ['Uranus',0x67e8f9,0.025,0.60,0.3],['Neptune',0x1d4ed8,0.024,0.70,0.25],
    ];
    planets.forEach(([name,color,size,r,speed])=>{
      const orbit=new THREE.Mesh(new THREE.TorusGeometry(r,0.001,4,64),
        new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.08}));
      orbit.rotation.x=Math.PI/2; g.add(orbit);
      const planet=new THREE.Mesh(new THREE.SphereGeometry(size,20,20),
        new THREE.MeshPhongMaterial({color}));
      planet.position.set(r,0,0); planet.name=name;
      planet.userData.orbitRadius=r; planet.userData.orbitAngle=Math.random()*Math.PI*2;
      planet.userData.orbitSpeed=speed; planet.userData.isPlanet=true;
      g.add(planet);
      if(name==='Saturn'){
        const ring=new THREE.Mesh(new THREE.TorusGeometry(0.048,0.012,2,32),
          new THREE.MeshBasicMaterial({color:0xfde68a,transparent:true,opacity:0.5,side:THREE.DoubleSide}));
        ring.rotation.x=Math.PI/2.5; planet.add(ring);
      }
    });
    addHS(g,0,0.08,0,'Sun');
    return g;
  },

  engine: () => {
    const g=new THREE.Group();
    const metal=new THREE.MeshPhongMaterial({color:0x6b7280,shininess:150});
    const red=new THREE.MeshPhongMaterial({color:0xef4444});
    const gold=new THREE.MeshPhongMaterial({color:0xd97706,shininess:200});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.24,0.18,0.16),metal));
    for(let i=0;i<4;i++){
      const c=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.12,16),metal);
      c.position.set(-0.09+i*0.06,0.15,0); c.name=`Cylinder ${i+1}`; g.add(c);
    }
    const crank=new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,0.22,12),gold);
    crank.rotation.z=Math.PI/2; crank.position.set(0,-0.06,0); crank.name='Crankshaft'; g.add(crank);
    for(let i=0;i<4;i++){
      const sp=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.06,8),gold);
      sp.position.set(-0.09+i*0.06,0.21,0); sp.name='Spark Plug'; g.add(sp);
    }
    const valve=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.03,0.12),red);
    valve.position.set(0,0.115,0); valve.name='Valve Cover'; g.add(valve);
    addHS(g,0.13,0.08,0.08,'Piston');
    return g;
  },

  crystal: () => {
    const g=new THREE.Group();
    const aM=new THREE.MeshPhongMaterial({color:0x7c3aed,shininess:200,emissive:0x1a0040});
    const bM=new THREE.MeshPhongMaterial({color:0xc4b5fd,transparent:true,opacity:0.6});
    for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) for(let z=-1;z<=1;z++){
      const n=new THREE.Mesh(new THREE.SphereGeometry(0.025,16,16),aM);
      n.position.set(x*0.1,y*0.1,z*0.1); n.name='Lattice Point'; g.add(n);
    }
    for(let y=-1;y<=1;y++) for(let z=-1;z<=1;z++){
      const b=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.2,6),bM);
      b.position.set(0,y*0.1,z*0.1); b.rotation.z=Math.PI/2; g.add(b);
    }
    for(let x=-1;x<=1;x++) for(let z=-1;z<=1;z++){
      const b=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.2,6),bM);
      b.position.set(x*0.1,0,z*0.1); g.add(b);
    }
    addHS(g,0.12,0.12,0.12,'Unit Cell Corner');
    return g;
  },

  external: () => {
    const g=new THREE.Group();
    const c=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,0.2),
      new THREE.MeshPhongMaterial({color:0x63e8b6,wireframe:true}));
    c.name='3D Model'; g.add(c);
    return g;
  },
};

function addHS(group,x,y,z,name){
  const m=new THREE.Mesh(new THREE.SphereGeometry(0.028,8,8),
    new THREE.MeshBasicMaterial({transparent:true,opacity:0}));
  m.position.set(x,y,z); m.name=name; m.userData.isHotspot=true;
  group.add(m);
}

// ═══════════════════════════════════════════════════════
// HOTSPOT INFO
// ═══════════════════════════════════════════════════════

const HOTSPOT_INFO = {
  'Left Ventricle'    :'The left ventricle pumps oxygenated blood to the entire body at high pressure.',
  'Right Ventricle'   :'The right ventricle pumps deoxygenated blood to the lungs for oxygenation.',
  'Aorta'             :'The aorta is the largest artery, carrying blood from the left ventricle to the body.',
  'Pulmonary Artery'  :'Carries deoxygenated blood from the right ventricle to the lungs.',
  'Mitral Valve'      :'The mitral valve prevents blood from flowing backward between the left chambers.',
  'Cerebellum'        :'Controls balance, coordination, and fine motor skills.',
  'Brain Stem'        :'Connects the brain to the spinal cord; controls breathing and heart rate.',
  'Frontal Lobe'      :'Responsible for reasoning, planning, emotions, and voluntary movement.',
  'Temporal Lobe'     :'Processes auditory information and is involved in memory and speech.',
  'Corpus Callosum'   :'A bundle of nerve fibers connecting the two hemispheres of the brain.',
  'Nucleus'           :'The core of an atom containing positively charged protons and neutral neutrons.',
  'Proton'            :'A positively charged particle in the nucleus. Its count = atomic number.',
  'Neutron'           :'A neutral particle in the nucleus. Different counts give different isotopes.',
  'Electron'          :'A negatively charged particle orbiting the nucleus in energy shells.',
  'Electron Shell'    :'Energy levels around the nucleus where electrons are found.',
  'Phosphate Backbone':'The structural backbone of DNA made of alternating phosphate and sugar groups.',
  'Sugar Group'       :'Deoxyribose sugar forms the backbone structure of DNA strands.',
  'Adenine-Thymine'   :'A–T base pair: Adenine always pairs with Thymine via 2 hydrogen bonds.',
  'Guanine-Cytosine'  :'G–C base pair: Guanine pairs with Cytosine via 3 hydrogen bonds.',
  'Atmosphere'        :"Earth's atmosphere is 78% nitrogen, 21% oxygen, shielding life from radiation.",
  'Crust'             :'The outermost solid shell of Earth, 5–70 km thick, made of rock and soil.',
  'Mantle'            :'~2900 km thick layer of mostly solid silicate rock that flows very slowly.',
  'Inner Core'        :'A solid iron-nickel ball ~1200 km in radius at incredibly high temperature.',
  'Outer Core'        :'Liquid iron-nickel ~2200 km thick; generates Earth\'s magnetic field.',
  'Sun'               :'A G-type star containing 99.86% of the solar system\'s total mass.',
  'Mercury'           :'Smallest planet, closest to the Sun. No atmosphere, extreme temperature swings.',
  'Venus'             :'Hottest planet (~465°C) due to thick CO₂ greenhouse atmosphere.',
  'Earth'             :'Our home — the only known planet with liquid water and complex life.',
  'Mars'              :'The Red Planet — has Olympus Mons, the tallest volcano in the solar system.',
  'Jupiter'           :'Largest planet. A gas giant with the iconic Great Red Spot storm.',
  'Saturn'            :'Known for its stunning ring system made of ice and rock particles.',
  'Uranus'            :'An ice giant that rotates on its side (98° axial tilt).',
  'Neptune'           :'Furthest planet. Has the fastest winds in the solar system.',
  'Crankshaft'        :'Converts the linear motion of pistons into rotational motion to drive wheels.',
  'Spark Plug'        :'Provides the electrical spark that ignites the air-fuel mixture.',
  'Valve Cover'       :'Protects the valvetrain components at the top of the engine.',
  'Piston'            :'Moves up and down inside cylinders, compressing the fuel-air mixture.',
  'Lattice Point'     :'A position in the crystal lattice where an atom or ion is located.',
  'Unit Cell Corner'  :'The smallest repeating unit showing the full symmetry of the crystal structure.',
};

// ═══════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', () => {
  parseURLParams();
  initThreeJS();
  showPermissionScreen();
});

function parseURLParams() {
  const p=new URLSearchParams(window.location.search);
  let quiz=[];
  try{ quiz=JSON.parse(p.get('quiz')||'[]'); }catch(e){}

  ARViewer.topic={
    id      :p.get('id')    ||'demo',
    model   :p.get('model') ||'heart',
    src     :p.get('src')   ||'',
    title   :p.get('title') ||'AR Model',
    category:p.get('cat')   ||'other',
    desc    :p.get('desc')  ||'',
    voice   :p.get('voice') ||'',
    quiz,
  };
  ARViewer.quizData=quiz;

  document.getElementById('hud-topic-name').textContent=ARViewer.topic.title;
  document.getElementById('hud-topic-cat').textContent =ARViewer.topic.category.toUpperCase();
  document.getElementById('desc-title').textContent    =ARViewer.topic.title;
  document.getElementById('desc-body').textContent     =
    ARViewer.topic.desc||'Tap parts of the 3D model to explore interactive hotspots.';
}

// ═══════════════════════════════════════════════════════
// THREE.JS INIT
// ═══════════════════════════════════════════════════════

function initThreeJS(){
  const canvas=document.getElementById('ar-canvas');

  ARViewer.renderer=new THREE.WebGLRenderer({
    canvas, antialias:true, alpha:true, premultipliedAlpha:false,
  });
  ARViewer.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  ARViewer.renderer.setSize(window.innerWidth,window.innerHeight);
  // Transparent clear — camera <video> shows through
  ARViewer.renderer.setClearColor(0x000000,0);

  ARViewer.scene=new THREE.Scene();
  // NO scene.background — we rely on the <video> element behind canvas

  ARViewer.camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.01,100);
  ARViewer.camera.position.set(0,0,1.5);

  ARViewer.clock=new THREE.Clock();

  // Lighting
  ARViewer.scene.add(new THREE.AmbientLight(0xffffff,1.0));
  const dir=new THREE.DirectionalLight(0xffffff,1.2);
  dir.position.set(2,4,3); ARViewer.scene.add(dir);
  const fill=new THREE.DirectionalLight(0x63e8b6,0.45);
  fill.position.set(-3,-2,-2); ARViewer.scene.add(fill);
  const rim=new THREE.PointLight(0x7c6ff7,0.6,6);
  rim.position.set(0,2,-1); ARViewer.scene.add(rim);

  // OrbitControls
  if(typeof THREE.OrbitControls!=='undefined'){
    ARViewer.controls=new THREE.OrbitControls(ARViewer.camera,canvas);
    ARViewer.controls.enableDamping=true;
    ARViewer.controls.dampingFactor=0.08;
    ARViewer.controls.minDistance=0.3;
    ARViewer.controls.maxDistance=4;
    ARViewer.controls.enablePan=false;
  }

  buildModel();
  setupInteraction(canvas);
  window.addEventListener('resize',onResize);
}

function buildModel(){
  const key = ARViewer.topic.model;
  const src = ARViewer.topic.src; // external URL or local path

  // ── Local uploaded model → assets/<slug>/model.glb ──
  if(key === 'local' && src){
    updateStatus('Local model load ho raha hai…','pulsing');
    loadGLBModel(src); // src = 'assets/<slug>/model.glb'
    return;
  }

  // ── External URL provided ──
  if((key === 'external' || !MODEL_BUILDERS[key]) && src){
    loadGLBModel(src);
    return;
  }

  // ── Built-in procedural model ──
  const builder = MODEL_BUILDERS[key] || MODEL_BUILDERS.heart;
  ARViewer.modelGroup = builder();
  ARViewer.modelGroup.position.set(0,0,0);
  ARViewer.modelGroup.scale.setScalar(1);
  ARViewer.scene.add(ARViewer.modelGroup);
  populateHotspotList(ARViewer.modelGroup);
}

/**
 * Load an external .glb/.gltf model via THREE.GLTFLoader
 * Shows loading progress, auto-centers and scales the model,
 * then hands off to the normal AR flow.
 * @param {string} url - Direct URL to the .glb file
 */
function loadGLBModel(url){
  // Show loading indicator
  updateStatus('GLB model load ho raha hai…','pulsing');
  updateLoader('3D model download ho raha hai…', 40);
  document.getElementById('loader-screen').style.display='flex';
  document.getElementById('loader-screen').style.opacity='1';

  // GLTFLoader must be available (loaded in viewer.html via CDN)
  if(typeof THREE.GLTFLoader === 'undefined'){
    console.error('GLTFLoader not found');
    showToastV('⚠️ GLTFLoader load nahi hua — built-in model use ho raha hai');
    _fallbackBuiltin();
    return;
  }

  const loader = new THREE.GLTFLoader();

  // Attach DRACOLoader so Sketchfab's Draco-compressed models work
  if(typeof THREE.DRACOLoader !== 'undefined'){
    const draco = new THREE.DRACOLoader();
    draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
    loader.setDRACOLoader(draco);
  }

  loader.load(
    url,

    // ── onLoad ──
    (gltf) => {
      const model = gltf.scene;

      // Auto-center: compute bounding box → move to center
      const box    = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size   = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      // Normalize size so the model fits nicely (~0.4 units tall)
      const targetSize = 0.4;
      const scaleFactor = maxDim > 0 ? targetSize / maxDim : 1;
      model.scale.setScalar(scaleFactor);
      ARViewer.modelScale = scaleFactor;

      // Re-center after scaling
      const box2    = new THREE.Box3().setFromObject(model);
      const center2 = box2.getCenter(new THREE.Vector3());
      model.position.sub(center2); // shift so center is at origin

      // Wrap in a group so our controls work uniformly
      ARViewer.modelGroup = new THREE.Group();
      ARViewer.modelGroup.add(model);
      ARViewer.modelGroup.position.set(0,0,0);
      ARViewer.scene.add(ARViewer.modelGroup);

      // Enable shadows on all meshes
      model.traverse(obj => {
        if(obj.isMesh){
          obj.castShadow    = true;
          obj.receiveShadow = true;
        }
      });

      populateHotspotList(ARViewer.modelGroup);
      hideLoader();
      updateStatus('GLB model load ho gaya! Tap karo explore karne ke liye','ready');
      showToastV('✅ 3D model successfully load ho gaya!');
    },

    // ── onProgress ──
    (xhr) => {
      if(xhr.total > 0){
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        updateLoader(`Model download: ${pct}%`, 40 + pct * 0.5);
      }
    },

    // ── onError ──
    (err) => {
      console.error('GLTFLoader error:', err);
      hideLoader();
      showToastV('❌ Model load nahi hua — CORS ya invalid URL. Built-in model use ho raha hai.');
      _fallbackBuiltin();
    }
  );
}

function _fallbackBuiltin(){
  const builder = MODEL_BUILDERS.heart;
  ARViewer.modelGroup = builder();
  ARViewer.modelGroup.position.set(0,0,0);
  ARViewer.modelGroup.scale.setScalar(1);
  ARViewer.scene.add(ARViewer.modelGroup);
  populateHotspotList(ARViewer.modelGroup);
  updateStatus('Built-in model load ho gaya','ready');
}

function populateHotspotList(group){
  const container=document.getElementById('hotspot-list');
  const names=[];
  group.traverse(obj=>{
    if(obj.userData.isHotspot&&HOTSPOT_INFO[obj.name]) names.push(obj.name);
  });
  if(!names.length){
    container.innerHTML='<p style="color:var(--text-3);font-size:13px;">Tap the 3D model to explore</p>';
    return;
  }
  container.innerHTML=names.map(n=>`
    <div class="hotspot-item" onclick="showHotspotInfo('${n}')">
      <div class="hotspot-dot"></div><span>${n}</span>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════
// CAMERA PERMISSION + LAUNCH
// ═══════════════════════════════════════════════════════

function showPermissionScreen(){
  hideLoader();
  document.getElementById('permission-screen').style.display='flex';

  // One-time listeners
  document.getElementById('btn-allow-camera').addEventListener('click',()=>{
    document.getElementById('permission-screen').style.display='none';
    openCamera();
  },{once:true});

  document.getElementById('btn-3d-only').addEventListener('click',()=>{
    document.getElementById('permission-screen').style.display='none';
    launch3DMode();
  },{once:true});
}

// ─── Open back camera ───
async function openCamera(){
  // Show loader while camera warms up
  const loaderEl=document.getElementById('loader-screen');
  loaderEl.style.display='flex'; loaderEl.style.opacity='1';
  updateLoader('Camera khul rahi hai…',55);

  try{
    const stream=await navigator.mediaDevices.getUserMedia({
      video:{ facingMode:{ideal:'environment'}, width:{ideal:1280}, height:{ideal:720} },
      audio:false,
    });
    ARViewer.cameraStream=stream;

    // ── Create <video> that sits behind canvas (z-index 0) ──
    const existingVideo=document.getElementById('camera-video');
    if(existingVideo) existingVideo.remove();

    const video=document.createElement('video');
    video.id='camera-video';
    video.srcObject=stream;
    video.autoplay=true;
    video.playsInline=true;
    video.muted=true;

    // Position behind everything — behind even the bg-grid divs
    video.style.cssText=`
      position:fixed;
      top:0; left:0;
      width:100%; height:100%;
      object-fit:cover;
      z-index:0;
      pointer-events:none;
    `;

    // Insert as FIRST child of body so it's behind canvas (z-index:1)
    document.body.insertBefore(video,document.body.firstChild);

    video.addEventListener('loadedmetadata',()=>{
      video.play().catch(()=>{});
      updateLoader('AR Mode shuru ho raha hai…',85);
      setTimeout(()=>{
        hideLoader();
        launchARMode();
      },300);
    });

    // Fallback if loadedmetadata doesn't fire
    setTimeout(()=>{
      if(loaderEl.style.display!=='none'){
        hideLoader();
        launchARMode();
      }
    },2500);

  }catch(err){
    console.warn('Camera error:',err.name,err.message);
    hideLoader();
    if(err.name==='NotAllowedError'){
      showToastV('📷 Camera access nahi mila — 3D mode mein dekho');
    }else{
      showToastV('⚠️ Camera nahi khuli — 3D mode mein dekho');
    }
    launch3DMode();
  }
}

// ─── AR mode: camera video is bg, canvas is transparent ───
function launchARMode(){
  // Ensure renderer is transparent
  ARViewer.renderer.setClearColor(0x000000,0);
  ARViewer.scene.background=null;

  if(ARViewer.modelGroup){
    ARViewer.modelGroup.visible=true;
    ARViewer.modelGroup.position.set(0,0,0);
    ARViewer.modelGroup.scale.setScalar(1);
  }

  if(ARViewer.controls){
    ARViewer.controls.enabled=true;
    ARViewer.controls.target.set(0,0,0);
  }

  ARViewer.renderer.setAnimationLoop(renderLoop);
  updateStatus('📷 AR Active — drag karo, pinch karo zoom karne ke liye','ready');

  const hints=document.querySelector('.touch-hints');
  if(hints) hints.style.display='flex';

  document.getElementById('btn-ar-toggle').classList.add('active');
}

// ─── 3D only mode (dark background) ───
function launch3DMode(){
  // Stop camera if running
  stopCamera();

  ARViewer.renderer.setClearColor(0x080c14,1);
  ARViewer.scene.background=new THREE.Color(0x080c14);

  if(ARViewer.modelGroup){
    ARViewer.modelGroup.visible=true;
    ARViewer.modelGroup.position.set(0,0,0);
    ARViewer.modelGroup.scale.setScalar(1);
  }

  if(ARViewer.controls){
    ARViewer.controls.enabled=true;
    ARViewer.controls.target.set(0,0,0);
  }

  ARViewer.renderer.setAnimationLoop(renderLoop);
  updateStatus('🌐 3D Mode — drag to rotate, pinch to scale','ready');
  hideLoader();

  document.getElementById('btn-ar-toggle').classList.remove('active');
}

function stopCamera(){
  ARViewer.cameraStream?.getTracks().forEach(t=>t.stop());
  ARViewer.cameraStream=null;
  const v=document.getElementById('camera-video');
  if(v) v.remove();
}

// ═══════════════════════════════════════════════════════
// RENDER LOOP
// ═══════════════════════════════════════════════════════

function renderLoop(){
  const delta=ARViewer.clock.getDelta();
  animateModel(delta);
  if(ARViewer.controls) ARViewer.controls.update();
  ARViewer.renderer.render(ARViewer.scene,ARViewer.camera);
}

function animateModel(delta){
  if(!ARViewer.modelGroup) return;

  if(ARViewer.modelRotating){
    ARViewer.modelGroup.rotation.y+=delta*0.35;
  }

  ARViewer.modelGroup.traverse(obj=>{
    const ud=obj.userData;
    if(ud.isElectron&&ud.orbitRadius){
      ud.orbitAngle=(ud.orbitAngle||0)+delta*(ud.orbitSpeed||0.8);
      obj.position.x=Math.cos(ud.orbitAngle)*ud.orbitRadius;
      obj.position.z=Math.sin(ud.orbitAngle)*ud.orbitRadius;
    }
    if(ud.isPlanet&&ud.orbitRadius){
      ud.orbitAngle=(ud.orbitAngle||0)+delta*(ud.orbitSpeed||0.5)*0.4;
      obj.position.x=Math.cos(ud.orbitAngle)*ud.orbitRadius;
      obj.position.z=Math.sin(ud.orbitAngle)*ud.orbitRadius;
    }
  });
}

// ═══════════════════════════════════════════════════════
// TOUCH / CLICK INTERACTION
// ═══════════════════════════════════════════════════════

function setupInteraction(canvas){
  canvas.addEventListener('click',e=>checkHotspot(e.clientX,e.clientY));

  canvas.addEventListener('touchstart',e=>{
    if(e.touches.length===1){
      ARViewer.touch.startX=e.touches[0].clientX;
      ARViewer.touch.startY=e.touches[0].clientY;
      ARViewer.touch.dragging=false;
      ARViewer.modelRotating=false;
    }
    if(e.touches.length===2){
      const dx=e.touches[0].clientX-e.touches[1].clientX;
      const dy=e.touches[0].clientY-e.touches[1].clientY;
      ARViewer.touch.lastDist=Math.hypot(dx,dy);
      ARViewer.modelRotating=false;
    }
  },{passive:true});

  canvas.addEventListener('touchmove',e=>{
    if(e.touches.length===2&&ARViewer.modelGroup){
      const dx=e.touches[0].clientX-e.touches[1].clientX;
      const dy=e.touches[0].clientY-e.touches[1].clientY;
      const dist=Math.hypot(dx,dy);
      if(ARViewer.touch.lastDist>0){
        const delta=(dist-ARViewer.touch.lastDist)*0.006;
        ARViewer.modelScale=Math.max(0.15,Math.min(4,ARViewer.modelScale+delta));
        ARViewer.modelGroup.scale.setScalar(ARViewer.modelScale);
      }
      ARViewer.touch.lastDist=dist;
      ARViewer.touch.dragging=true;
    } else if(e.touches.length===1){
      const dx=Math.abs(e.touches[0].clientX-ARViewer.touch.startX);
      const dy=Math.abs(e.touches[0].clientY-ARViewer.touch.startY);
      if(dx>5||dy>5) ARViewer.touch.dragging=true;
    }
  },{passive:true});

  canvas.addEventListener('touchend',e=>{
    ARViewer.touch.lastDist=0;
    setTimeout(()=>{ ARViewer.modelRotating=true; },4000);
    if(!ARViewer.touch.dragging&&e.changedTouches.length===1){
      checkHotspot(e.changedTouches[0].clientX,e.changedTouches[0].clientY);
    }
  },{passive:true});
}

function checkHotspot(clientX,clientY){
  if(!ARViewer.modelGroup) return;
  ARViewer.mouse.x=(clientX/window.innerWidth)*2-1;
  ARViewer.mouse.y=-(clientY/window.innerHeight)*2+1;
  ARViewer.raycaster.setFromCamera(ARViewer.mouse,ARViewer.camera);
  const hits=ARViewer.raycaster.intersectObjects(ARViewer.modelGroup.children,true);
  if(!hits.length) return;
  let obj=hits[0].object;
  while(obj&&obj!==ARViewer.modelGroup){
    if(HOTSPOT_INFO[obj.name]){ showHotspotInfo(obj.name); return; }
    obj=obj.parent;
  }
}

function showHotspotInfo(name){
  const info=HOTSPOT_INFO[name];
  if(!info) return;
  document.getElementById('hotspot-name').textContent=name;
  document.getElementById('hotspot-desc').textContent=info;
  document.getElementById('hotspot-label').style.display='block';
  ARViewer.modelRotating=false;
  setTimeout(()=>{ ARViewer.modelRotating=true; },6000);
}

// ═══════════════════════════════════════════════════════
// DESC PANEL
// ═══════════════════════════════════════════════════════

function toggleDesc(){
  const p=document.getElementById('desc-panel');
  p.classList.toggle('open');
  p.classList.toggle('collapsed');
}

// ═══════════════════════════════════════════════════════
// HUD BUTTONS
// ═══════════════════════════════════════════════════════

document.getElementById('btn-voice')?.addEventListener('click',()=>{
  const text=ARViewer.topic?.voice||ARViewer.topic?.desc||`Now viewing ${ARViewer.topic?.title}.`;
  if(ARViewer.voicePlaying){
    speechSynthesis.cancel();
    ARViewer.voicePlaying=false;
    document.getElementById('btn-voice').textContent='🔊';
    return;
  }
  if(!('speechSynthesis' in window)){ showToastV('⚠️ Voice not supported'); return; }
  ARViewer.utterance=new SpeechSynthesisUtterance(text);
  ARViewer.utterance.rate=0.9; ARViewer.utterance.pitch=1.0;
  ARViewer.utterance.onend=()=>{
    ARViewer.voicePlaying=false;
    document.getElementById('btn-voice').textContent='🔊';
  };
  speechSynthesis.speak(ARViewer.utterance);
  ARViewer.voicePlaying=true;
  document.getElementById('btn-voice').textContent='⏹';
  showToastV('🔊 Voice explanation chal rahi hai…');
});

document.getElementById('btn-reset')?.addEventListener('click',()=>{
  if(ARViewer.modelGroup){
    ARViewer.modelGroup.rotation.set(0,0,0);
    ARViewer.modelGroup.position.set(0,0,0);
    ARViewer.modelScale=1;
    ARViewer.modelGroup.scale.setScalar(1);
  }
  if(ARViewer.controls){
    ARViewer.controls.reset();
    ARViewer.camera.position.set(0,0,1.5);
  }
  showToastV('🔄 Model reset ho gaya');
});

document.getElementById('btn-ar-toggle')?.addEventListener('click',async()=>{
  const videoEl=document.getElementById('camera-video');
  if(videoEl){
    // Camera running → switch to 3D only
    launch3DMode();
    showToastV('📺 3D Mode mein switch ho gaya');
  } else {
    // No camera → try to open
    await openCamera();
  }
});

document.getElementById('btn-quiz')?.addEventListener('click',openQuiz);
document.getElementById('btn-share')?.addEventListener('click',openShare);

document.getElementById('btn-screenshot')?.addEventListener('click',()=>{
  ARViewer.renderer.render(ARViewer.scene,ARViewer.camera);
  try{
    const url=document.getElementById('ar-canvas').toDataURL('image/png');
    const a=document.createElement('a');
    a.download=`arlearn-${(ARViewer.topic?.title||'model').replace(/\s+/g,'-')}.png`;
    a.href=url; a.click();
    showToastV('📸 Screenshot save ho gaya!');
  }catch(e){
    showToastV('⚠️ Screenshot nahi le saka');
  }
});

// ═══════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════

function openQuiz(){
  const quiz=ARViewer.quizData;
  if(!quiz?.length){ showToastV('ℹ️ Is topic mein quiz nahi hai'); return; }
  ARViewer.quizSubmitted=false;
  document.getElementById('quiz-content').innerHTML=
    quiz.map((item,i)=>`
      <div class="quiz-question">
        <p>${i+1}. ${escV(item.q)}</p>
        <input type="text" class="quiz-input" id="qa-${i}" placeholder="Apna jawab likho…"/>
        <div class="quiz-result" id="qr-${i}"></div>
      </div>`).join('')+
    `<button class="btn-primary quiz-submit" onclick="submitQuiz()">Submit ✓</button>`;
  document.getElementById('quiz-overlay').style.display='flex';
}

function submitQuiz(){
  if(ARViewer.quizSubmitted) return;
  ARViewer.quizSubmitted=true;
  let score=0;
  ARViewer.quizData.forEach((item,i)=>{
    const inp=document.getElementById(`qa-${i}`);
    const res=document.getElementById(`qr-${i}`);
    const ans=inp.value.trim().toLowerCase();
    const cor=item.a.toLowerCase();
    const ok=ans===cor||ans.includes(cor)||cor.includes(ans);
    if(ok){ score++; res.textContent='✅ Sahi!'; res.className='quiz-result correct'; inp.style.borderColor='#4ade80'; }
    else  { res.textContent=`❌ Jawab: ${item.a}`; res.className='quiz-result wrong'; inp.style.borderColor='#f87171'; }
    inp.disabled=true;
  });
  document.querySelector('.quiz-submit')?.remove();
  const pct=Math.round(score/ARViewer.quizData.length*100);
  const el=document.createElement('div');
  el.className='quiz-score';
  el.innerHTML=`<p>Score: ${score}/${ARViewer.quizData.length} — ${pct}%</p>
    <p style="font-size:14px;color:var(--text-2);margin-top:8px">${pct===100?'🎉 Perfect!':pct>=60?'👍 Badiya!':'📚 Aur padho!'}</p>
    <button class="btn-ghost" style="margin-top:16px;width:100%;justify-content:center" onclick="closeQuiz()">Close</button>`;
  document.getElementById('quiz-content').appendChild(el);
}

function closeQuiz(){ document.getElementById('quiz-overlay').style.display='none'; }

// ═══════════════════════════════════════════════════════
// SHARE
// ═══════════════════════════════════════════════════════

function openShare(){
  const d=document.getElementById('share-qr-mini');
  d.innerHTML='';
  if(typeof QRCode!=='undefined'){
    new QRCode(d,{text:window.location.href,width:120,height:120,
      colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.L});
  }
  document.getElementById('share-overlay').style.display='flex';
}

function closeShare(){ document.getElementById('share-overlay').style.display='none'; }

function shareViaWhatsApp(){
  const msg=encodeURIComponent(`📚 AR Learning: *${ARViewer.topic.title}*\n${window.location.href}`);
  window.open(`https://wa.me/?text=${msg}`,'_blank');
  closeShare();
}

function copyCurrentLink(){
  navigator.clipboard?.writeText(window.location.href)
    .then(()=>showToastV('📋 Link copy ho gaya!'))
    .catch(()=>{});
  closeShare();
}

function nativeShare(){
  if(navigator.share){
    navigator.share({title:`AR: ${ARViewer.topic.title}`,url:window.location.href}).catch(()=>{});
  } else { copyCurrentLink(); }
}

// ═══════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════

function updateLoader(msg,pct){
  const s=document.getElementById('loader-sub');
  const b=document.getElementById('loader-bar');
  if(s) s.textContent=msg;
  if(b) b.style.width=pct+'%';
}

function hideLoader(){
  const el=document.getElementById('loader-screen');
  if(!el) return;
  el.style.opacity='0';
  el.style.transition='opacity 0.4s ease';
  setTimeout(()=>{ el.style.display='none'; },400);
}

function updateStatus(msg,state='pulsing'){
  const dot=document.querySelector('.status-dot');
  const text=document.getElementById('status-text');
  if(dot)  dot.className=`status-dot ${state}`;
  if(text) text.textContent=msg;
}

function showToastV(msg){
  const t=document.getElementById('toast-viewer');
  if(!t) return;
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3200);
}

function escV(str){
  const d=document.createElement('div');
  d.textContent=str||'';
  return d.innerHTML;
}

function onResize(){
  ARViewer.camera.aspect=window.innerWidth/window.innerHeight;
  ARViewer.camera.updateProjectionMatrix();
  ARViewer.renderer.setSize(window.innerWidth,window.innerHeight);
}

// Load QRCode.js for share panel
(function(){
  if(typeof QRCode!=='undefined') return;
  const s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  document.head.appendChild(s);
})();

// Loader progress animation
let _lp=20;
const _li=setInterval(()=>{
  _lp+=15;
  updateLoader(_lp<50?'Three.js load ho raha hai…':_lp<80?'3D model ban raha hai…':'Taiyaar ho raha hai…',_lp);
  if(_lp>=90) clearInterval(_li);
},180);