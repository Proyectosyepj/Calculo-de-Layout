/* ===== ALPHA BLOCKS · Equipo Cacahuate · Proyecto creado por YEPJ =====
   Base: Muther & Hales, Systematic Layout Planning (SLP). Las 3 opciones comparten áreas y costos unitarios.
   v2 (2026-11-27): opción 1 manual (carretillas), opción 2 semiautomática (3 bandas + patines),
   opción 3 automatizada (bandas + apiladora), intro nueva con blocks, tema gris formal, imágenes en imagenes/.
   v5 (2026-11-27): oficinas según el plano de AutoCAD, iguales en las 3 opciones; opción 2 divide el almacén
   de montacargas justo a la mitad y la otra mitad es el cuarto eléctrico.
   v7 (2026-11-27): oficinas idénticas al AutoCAD (recintos llenan los 18 m de ancho, pasillo
   de 2.7 m entre la fila del medio y la de arriba); 5 temas de música (tutorial solo en el
   tutorial, opciones sin cortarse entre menú y opciones, se detiene con otros temas musicales);
   tutorial con transición direccional (al avanzar sale a la derecha, al volver a la izquierda). */
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const fm=(n,d=2)=>Number(n).toLocaleString('es-MX',{maximumFractionDigits:d,minimumFractionDigits:0});
const key=(a,b)=>a<b?a+b:b+a;

/* ---------- DATOS COMPARTIDOS ---------- */
/* Producción: 1,800 bloques/día en jornada de 7 h. Patín hidráulico: ≈1 t por viaje
   (75 bloques × 13.2 kg = 990 kg). Bloque hueco BH-152040-2C, 15×20×40 cm, 13.2 kg. */
const P={blocks:1800,patines:2,cap:75,hrs:7,eff:.8,hand:60};
const EFF=()=>P.hrs*3600*P.eff;
const MODE={carretilla:{v:.9,k:45},patin:{v:.8,k:60},mont:{v:1.5,k:180},camion:{v:3,k:250},peaton:{v:1.2,k:45}};
const cM=m=>m==='banda'?0.5:MODE[m].k*2/(MODE[m].v*3600);
const R_=(n,a,c,e)=>({n,a,c,e});
const DEP={
A:{n:'Frente y Acceso',c:'#4cc9f0',st:[['Guardia (externo)',1]],r:[R_('Estacionamiento frontal',93,'15.50×6.00','4+ autos, 2 portones, 3 luminarias'),R_('Acceso / franja caseta',6.25,'2.50×2.50','Pasillo peatonal'),R_('Caseta de vigilancia',8.75,'2.50×3.50','Registro de entradas')]},
B:{n:'Edificio Principal',c:'#90be6d',st:[['Gerente General',1],['Oficinistas',2],['Enc. RH',1],['Banquero/Admin.',1],['Jefe de Ventas y Mkt.',1],['Enc. Publicidad',1],['Enc. Logístico',1]],r:[R_('RH',9,'3.00×3.00','Escritorio, PC'),R_('Sala de espera (RH)',9,'3.00×3.00','Sillas'),R_('Recepción',28.5,'9.50×3.00','Mostrador, TV'),R_('Sanitario recepción',7.5,'2.50×3.00','Taza, lavabo, mingitorio'),R_('Gerencia',24,'5.18×4.63','Escritorio, 2 archiveros'),R_('Casilleros',24,'6.55×3.67','9 lockers, microondas'),R_('Sala de espera central',27.5,'5.94×4.63','Sofá, 3 sillas'),R_('Oficinas',31.9,'6.88×4.63','3 escritorios, 3 PC, caja fuerte'),R_('Vestidores',16,'4.36×3.67','Cubículos H/M'),R_('Sanitarios sup. 1',10,'2.73×3.67','Regaderas, tazas'),R_('Sanitarios sup. 2',16,'4.36×3.67','Regaderas, tazas'),R_('Pasillos y circulación',48.6,'—','Pasillos y circulación interna del módulo')]},
C:{n:'Soporte Logístico',c:'#f9c74f',st:[['Montacarguista',1,'C2'],['Enc. almacén M.P./EPP',1,'C3']],r:[R_('Estacionamiento de motos',99,'18.00×5.50','Techado'),R_('Almacén de montacargas',52.25,'9.50×5.50','2 montacargas, 2 topes'),R_('Almacén de EPP',38.5,'7.00×5.50','4 estanterías, 27 juegos EPP'),R_('Pasillo lateral',8.25,'1.50×5.50','Paso entre almacenes y vialidad')]},
D:{n:'Laboratorio de Calidad',c:'#ffd6a5',st:[['Técnicos de calidad',2]],r:[R_('Laboratorio',14,'3.50×4.00','Báscula, prensa hidráulica, moldes de prueba')]},
E:{n:'Producto Terminado',c:'#f8961e',st:[['Operarios almacén P.T.',3],['Enc. almacén P.T.',1],['Jefe de almacenes',1]],r:[R_('Producto terminado',432,'18.00×24.00','120 tarimas, etiquetado, 12 luminarias')]},
F:{n:'Flujo y Producto Defectuoso',c:'#43aa8b',st:[],r:[R_('Producto defectuoso',14,'3.50×4.00','3 tarimas'),R_('Zona de control / transición',134,'—','Vía libre de montacargas y zona de control')]},
G:{n:'Curado',c:'#577590',st:[['Operarios de curado (patines)',2]],r:[R_('Área de curado',441,'18.00×24.50','144 estantes de 5 niveles, 480 moldes, 22 lonas, 2 patines hidráulicos')]},
H:{n:'Producción',c:'#f94144',st:[['Operarios máquina QT4-16',3],['Jefe de planta',1]],r:[R_('Área de producción',261,'18.00×14.50','Bloquera QT4-16, bandas 2×13 m y 1×7 m')]},
I:{n:'Materia Prima',c:'#b5838d',st:[['Operarios de materia prima',6]],r:[R_('Bahía 1 (arena)',111,'6.00×18.50','Troje, banda 13 m'),R_('Bahía 2 (arena)',111,'6.00×18.50','Troje, banda 7 m'),R_('Bahía 3 (cemento)',111,'6.00×18.50','Troje, banda 13 m')]},
J:{n:'Patio de Maniobras',c:'#9d4edd',st:[['Choferes',2],['Ayudantes de chofer',6],['Enc. transporte',1]],r:[R_('Área de maniobras',520,'26.00×20.00','2 camiones Foton Aumark')]}};
const IDS='ABCDEFGHIJ';
IDS.split('').forEach(k=>{const d=DEP[k];d.a=d.r.reduce((t,r)=>t+r.a,0);d.r.forEach((r,i)=>{r.code=k+(i+1);});d.p=d.st.reduce((t,s)=>t+s[1],0);});
/* recintos de fondo: F2 llena la franja de control con su color (el lab y el defectuoso van encima);
   B12 es solo área (pasillos), no se dibuja como recinto */
DEP.F.r[1].bg='fill';DEP.B.r[11].bg='none';
const REASONS={1:'Flujo de materiales',2:'Contacto personal',3:'Mismo equipo',6:'Supervisión o control',8:'Urgencia de servicio',11:'Contacto de papeleo',13:'Ruido, polvo y vibración'};
const OTH={AB:['E',[2,11]],AC:['O',[2]],BC:['I',[2,6]],BD:['O',[11]],CE:['I',[8]],DE:['E',[6]],EF:['O',[6]],FG:['I',[6]],GH:['A',[6,3]],HI:['I',[3]],IJ:['O',[6]],CH:['O',[6]]};
'AH AI BH BI BJ'.split(' ').forEach(k=>OTH[k]=['X',[13]]);
const VAL={A:4,E:3,I:2,O:1,U:0,X:-1},LINES={A:4,E:3,I:2,O:1,U:0,X:0};
const W_ALDEP={A:64,E:16,I:4,O:1,U:0,X:-1024},W_CORE={A:6,E:5,I:4,O:3,U:2,X:1};
const VC={A:'#e11d48',E:'#f97316',I:'#16a34a',O:'#2563eb',U:'#9ca3af',X:'#78350f'};
const mkFlows=()=>[['J','I',8,'camion','Camiones de agregados',1800,1.2],['I','H',3,'banda','Bandas 13+13+7 m',1800,1.3],['H','G',Math.ceil(P.blocks/P.cap),'patin','Racks con patines hidráulicos',1800,1.6],['G','F',42,'mont','Pallets curados (montacargas)',1800,1.1],['F','E',42,'mont','Estiba de producto terminado',1800,1.1],['E','J',25,'camion','Camión de reparto',1800,1.2],['E','D',6,'peaton','Muestreo a laboratorio',20,1],['B','A',10,'peaton','Personal y visitas',100,1],['C','E',8,'mont','Montacargas a P.T. (almacén de montacargas)',60,1,'C2'],['C','H',5,'peaton','EPP y herramienta a producción',40,1,'C3']].map(([a,b,tr,m,d,vol,dif,ra])=>({a,b,tr,m,d,vol,dif,ra,c:cM(m),f:vol*dif}));

/* ---------- SLP: relaciones ---------- */
let FL,FRK,FRM,_rc;
function calc0(){FL=mkFlows();FRK=FL.map(r=>({k:key(r.a,r.b),r})).sort((x,y)=>y.r.f-x.r.f||x.k.localeCompare(y.k));
 FRK.forEach((o,i)=>{const p=(i+1)/FRK.length;o.v=p<=.1?'A':p<=.3?'E':p<=.6?'I':'O';o.rank=i+1;});FRM={};FRK.forEach(o=>FRM[o.k]=o);_rc={};}
function relOf(a,b){const k=key(a,b);if(_rc[k])return _rc[k];const o=OTH[k],f=FRM[k],vo=o?VAL[o[0]]:0,vf=f?VAL[f.v]:0;let res;
 if(o&&o[0]==='X')res={l:'X',r:o[1],S:-1};else{const S=2*vf+vo;res={l:S>=8?'A':S>=6?'E':S>=4?'I':S>=1?'O':'U',r:[...(f?[1]:[]),...(o?o[1]:[])],S};}return _rc[k]=res;}
const rel=(a,b)=>relOf(a,b).l;
const adj=o=>[...o].slice(0,-1).map((c,i)=>[c,o[i+1]]);
/* un departamento debe quedar contiguo: se resta el peso A por cada franja extra en la que se reparten sus recintos */
function frag(o){const cx=ctxOf(o),m={};bandsOf(o).forEach((b,i)=>b.k.forEach(d=>cx.rm[d].forEach(r=>{(m[r.code[0]]=m[r.code[0]]||new Set()).add(i);})));return Object.values(m).reduce((t,q)=>t+q.size-1,0);}
const scoreW=(o,W)=>padj(o).reduce((s,[a,b])=>s+W[rel(a,b)],0)-frag(o)*W.A;
function maxW(W){const w=[];for(let i=0;i<10;i++)for(let j=i+1;j<10;j++)w.push(W[rel(IDS[i],IDS[j])]);return w.sort((a,b)=>b-a).slice(0,9).reduce((s,v)=>s+v,0);}
const tcr=k=>[...IDS].filter(x=>x!==k).reduce((s,x)=>s+W_CORE[rel(k,x)],0);

/* ---------- geometría: franjas según el plano PDF (opción 2 semiautomática) ----------
   Cada recinto tiene una posición explícita [x, y] en metros dentro de su franja
   (x: 0–18 a lo ancho de la nave, y: 0–L a lo largo, desde la entrada).
   El ancho w sale de las cotas y el alto h = área ÷ w (así respeta los ajustes de área).
   El largo de cada franja es geométrico: el mayor (y + h) de sus recintos no insertos.
   Los recintos "inset" se dibujan encima de otro (lab en producto terminado o en curado,
   motos en el patio) y no alargan la franja. */
const dim=r=>{const w=parseFloat((r.c||'').split('×')[0])||0;return [w,w?r.a/w:0];};
const GEO={
 A1:[0,0],A2:[15.5,0],A3:[15.5,2.5],
 B1:[0,0],B2:[3,0],B3:[6,0],B4:[15.5,0],B5:[0,3,5.18,4.63],B7:[5.18,3,5.94,4.63],B8:[11.12,3,6.88,4.63],B6:[0,10.33,6.55,3.67],B9:[6.55,10.33,4.36,3.67],B10:[10.91,10.33,2.73,3.67],B11:[13.64,10.33,4.36,3.67],
 C1:[0,0],C3:[0,5.5],C2:[7,5.5],C5:[11.75,5.5],C4:[16.5,5.5],
 D1:[0,5],
 E1:[0,0],
 F1:[0,0.5],
 G1:[0,0],
 H1:[0,0],
 I1:[0,0],I2:[6,0],I3:[12,0],
 J1:[0,0]};
let FORCE=null;const ctxOf=o=>FORCE||o.cx||SC[1];
const ep=(r,cx)=>[cx.mv[r.ra]||r.a,r.b];
function bandGroups(s){const b=[];[...s.o].forEach(k=>{if(k!=='J'&&s.ar[k]<30&&b.length)b[b.length-1].k.push(k);else b.push({k:[k]});});return b;}
function layout(s){
 const groups=bandGroups(s);let y=0;s.bs=[];
 groups.forEach(g=>{
  const rooms=[];g.k.forEach(k=>s.rm[k].forEach(r=>rooms.push(r)));
  rooms.forEach(r=>{
   const gv=(s.geo&&s.geo[r.code])||GEO[r.code];
   let x=0,yy=0,w=0,h=0,inset=false;
   if(Array.isArray(gv)){[x,yy,w,h]=gv;if(w==null){const d=dim(r);w=d[0];h=d[1];}}
   else if(gv&&typeof gv==='object'){x=gv.x||0;yy=gv.y||0;inset=!!gv.inset;const d=dim(r);w=gv.w||d[0];h=gv.h||d[1];}
   else{const d=dim(r);w=d[0];h=d[1];}
   r.gx=x;r.gy=yy;r.gw=w;r.gh=h;r.inset=inset;
  });
  const L=Math.max(...rooms.filter(r=>!r.inset&&!r.bg).map(r=>r.gy+r.gh),0);
  const j=g.k[0]==='J';
  s.bs.push({k:g.k,a:g.k.reduce((t,k)=>t+s.ar[k],0),w:j?26:18,L,y});y+=L;
 });
 s.len=s.bs.reduce((t,b)=>t+b.L,0);
}
function bandsOf(o){const s=ctxOf(o);if(!s.bs)layout(s);return s.bs;}
/* contigüidad física: pares dentro de una franja (consecutivos) y todos los pares entre franjas vecinas */
function padj(o){const b=bandsOf(o),p=[];b.forEach((x,i)=>{x.k.slice(0,-1).forEach((c,j)=>p.push([c,x.k[j+1]]));if(i<b.length-1)x.k.forEach(c=>b[i+1].k.forEach(d=>p.push([c,d])));});return p;}
const cent=o=>{const c={};bandsOf(o).forEach(b=>b.k.forEach(k=>c[k]=b.y+b.L/2));return c;};
const dist=(o,a,b)=>{const c=cent(o);return Math.abs(c[a]-c[b]);};
const craftCost=o=>{const c=cent(o),cx=ctxOf(o);return FL.reduce((s,r)=>{const[a,b]=ep(r,cx);return s+r.tr*r.c*Math.abs(c[a]-c[b]);},0);};
const transport=o=>{const c=cent(o),cx=ctxOf(o);return FRK.reduce((s,f)=>{const[a,b]=ep(f.r,cx);return s+LINES[f.v]*Math.abs(c[a]-c[b]);},0);};
function converge(start){const o=[...start];let cost=craftCost(o.join('')),h=[cost],sw=[];
 for(let it=0;it<10;it++){let b=null;for(let i=2;i<=8;i++)for(let j=i+1;j<=8;j++){const t=[...o];[t[i],t[j]]=[t[j],t[i]];const c=craftCost(t.join(''));if(c<cost-1e-6&&(!b||c<b.c))b={t,c,i,j};}
  if(!b)break;sw.push(o[b.i]+'↔'+o[b.j]);o.splice(0,o.length,...b.t);cost=b.c;h.push(cost);}
 return{hist:h,sw,final:o.join('')};}

/* ---------- patines: 1,800 bloques/día de Producción a Curado ---------- */
function patinCalc(o){const d=dist(o,'H','G'),v=MODE.patin.v,trips=Math.ceil(P.blocks/P.cap),cyc=2*d/v+P.hand,sec=trips*cyc,util=sec/EFF(),need=Math.ceil(util-1e-9);
 return{d,v,trips,cyc,sec,util,need,perPat:trips/P.patines,secPat:sec/P.patines,maxBlocks:Math.floor(P.patines*EFF()/cyc)*P.cap,ok:need<=P.patines};}

/* ---------- transporte manual (Opción 1): carretillas operadas por 2 trabajadores ----------
   Supuestos (confirmar): carretilla típica de 6 bloques por viaje (6 × 13.2 kg = 79.2 kg) o de
   ≈80 kg de materia prima por viaje; carga y descarga 60 s por viaje; velocidad con carga 0.9 m/s.
   Materia prima por día ≈ masa de los bloques producidos: 1,800 × 13.2 kg = 23,760 kg. */
const MAN={capBl:6,capKg:80,workers:2,load:60,v:MODE.carretilla.v,kgDia:P.blocks*13.2};
function manualCalc(o){const dHG=dist(o,'H','G'),dIH=dist(o,'I','H');
 const tripsBl=Math.ceil(P.blocks/MAN.capBl),cycBl=2*dHG/MAN.v+MAN.load,tBl=tripsBl*cycBl;
 const tripsMP=Math.ceil(MAN.kgDia/MAN.capKg),cycMP=2*dIH/MAN.v+MAN.load,tMP=tripsMP*cycMP;
 const tot=tripsBl+tripsMP,sec=tBl+tMP;
 return{dHG,dIH,tripsBl,cycBl,tBl,tripsMP,cycMP,tMP,tot,sec,hh:sec*MAN.workers/3600,perHour:tot/P.hrs};}

/* ---------- costo del transporte por sistema (datos del proyecto) ----------
   Sueldo normal de un operario: $163,820.80/mes ÷ 20 operarios ÷ 26 días = $315.04/día
   (jornada de 7 h → $45.01/h). La mano de obra del transporte se valora a ese sueldo:
   un trabajador recibe su sueldo normal en un día, haga los viajes que haga.
   Automatizado: la maquinaria nueva se compra (inversión) y se deprecia a 12 años
   (26 días/mes). Ejemplo (confirmar cuántas bandas y montacargas extra hacen falta):
   2 bandas de 13 m + 1 montacargas. La apiladora no tiene cotización en los datos. */
const WAGE_DAY=163820.80/20/26, WAGE_H=WAGE_DAY/7;
const AUTO={belt:53254,fork:448456,beltsEx:2,forksEx:1};
AUTO.inv=AUTO.beltsEx*AUTO.belt+AUTO.forksEx*AUTO.fork;
AUTO.depDay=AUTO.inv/144/26;

/* ---------- 3 opciones fijas (sin aleatoriedad): la 2 es el layout del plano PDF ----------
   mv: recintos que cambian de departamento · da: ajuste de m² · geo: posición [x, y] del recinto
   dentro de su franja (o {x, y, inset:true} si se dibuja encima de otro recinto) */
const SC=[
 {id:1,name:'Opción 1',o:'ABCEFGDHIJ',tag:'Alternativa de distribución 1 · sistema manual',mv:{C1:'A'},da:{H1:-45,G1:45},
  geo:{C1:[0,0],A1:[0,6.1],A2:[15.5,6.1],A3:[15.5,8.6],F1:[0,4.22],D1:{x:0,y:0,inset:true},C3:[0,0],C2:[7,0],C4:[16.5,0]},
  moves:['Sistema manual: materias primas y bloques se mueven con carretillas operadas por 2 trabajadores.','Producción reducida 45 m² y curado ampliado 45 m².','Estacionamiento de motos al frente de la oficina, separado del estacionamiento por 0.6 m.','Las oficinas quedan igual que en las opciones 2 y 3, según el plano de AutoCAD: RH y sala de espera junto a la entrada, recepción al centro, gerencia y sala central en medio, oficinas a la derecha, casilleros con vestidores y sanitarios arriba.','Laboratorio bajo el área de curado (en su esquina inferior izquierda).']},
 {id:2,name:'Opción 2',o:'ABCEFDGHIJ',tag:'Distribución seleccionada · sistema semiautomático',mv:{},splitC2:1,
  moves:['Se conserva el flujo lineal del proceso, de la entrada al fondo: frente, edificio, soporte, producto terminado, defectuoso con laboratorio, curado, producción, materia prima y patio.','Patines hidráulicos asignados al curado; almacén de montacargas junto a producto terminado.','Almacén de montacargas dividido justo a la mitad: una mitad sigue como almacén de montacargas y la otra mitad es el cuarto eléctrico.','Sistema semiautomático: 3 bandas transportadoras para la materia prima y patines hidráulicos para los bloques (1 persona, ≈1 t por viaje).']},
 {id:3,name:'Opción 3',o:'ABCEDFGHIJ',tag:'Alternativa de distribución 3 · sistema automatizado',mv:{C1:'J',C2:'F'},uni:1,
  geo:{C3:[0,0],C4:[7,0],D1:{x:14.5,y:20,inset:true},C2:[0,5.625],F1:[9.5,5.625],C1:{x:4,y:14.5,inset:true}},
  moves:['Sistema automatizado: bandas transportadoras para la materia prima y apiladora automática hacia curado; los trabajadores solo supervisan.','Almacén de montacargas a la izquierda del área de producto defectuoso.','Laboratorio dentro del área de producto terminado, en la esquina superior derecha.','Materia prima unificada en una sola bahía con tolva única y 3 bandas de alimentación.','Estacionamiento de motos atrás, dentro del patio de maniobras.']}];
function arrange(s){s.ar={};s.rm={};s.stf={};[...IDS].forEach(k=>{s.ar[k]=0;s.rm[k]=[];s.stf[k]=[];});[...IDS].forEach(k=>DEP[k].r.forEach((r0,ri)=>{let r={...r0};if(s.da&&s.da[r.code])r.a=r.a+s.da[r.code];if(k==='I'&&s.uni){if(ri)return;r={...r,a:333,n:'Materia prima unificada',c:'18.00×18.50',e:'Tolva única con 3 bandas de alimentación'};}const d=s.mv[r.code]||k;s.rm[d].push(r);s.ar[d]+=r.a;}));[...IDS].forEach(k=>DEP[k].st.forEach(t=>s.stf[s.mv[t[2]]||k].push(t)));if(s.splitC2){const cr=s.rm.C,c2=cr.find(r=>r.code==='C2');if(c2){c2.a=26.125;c2.c='4.75×5.50';cr.splice(cr.indexOf(c2)+1,0,{n:'Cuarto eléctrico',a:26.125,c:'4.75×5.50',e:'Tablero principal y subestación eléctrica',code:'C5'});}}}
SC.forEach(s=>{arrange(s);layout(s);});
function metrics(){SC.forEach(s=>{FORCE=s;s.bs=bandsOf(s.o);s.al=scoreW(s.o,W_ALDEP);s.alE=s.al/maxW(W_ALDEP);s.co=scoreW(s.o,W_CORE);s.coE=s.co/maxW(W_CORE);s.cost=craftCost(s.o);s.cv=converge(s.o);s.tr=transport(s.o);s.pat=patinCalc(s.o);s.man=manualCalc(s.o);s.len=s.bs.reduce((t,b)=>t+b.L,0);FORCE=null;});}
function coreOrder(){const t={};[...IDS].forEach(k=>t[k]=tcr(k));let rest=[...IDS].sort((a,b)=>t[b]-t[a]||a.localeCompare(b));const seq=[{k:rest.shift(),why:'Mayor TCR'}];
 while(rest.length){let best=null;rest.forEach(k=>{const m=Math.max(...seq.map(p=>W_CORE[rel(k,p.k)])),sm=seq.reduce((s,p)=>s+W_CORE[rel(k,p.k)],0),sc=[m,sm,t[k]];
  if(!best||sc[0]>best.sc[0]||(sc[0]===best.sc[0]&&(sc[1]>best.sc[1]||(sc[1]===best.sc[1]&&sc[2]>best.sc[2]))))best={k,sc};});
  const bp=seq.reduce((a,p)=>W_CORE[rel(best.k,p.k)]>W_CORE[rel(best.k,a.k)]?p:a,seq[0]);seq.push({k:best.k,why:`Relación ${rel(best.k,bp.k)} con ${bp.k}`});rest=rest.filter(k=>k!==best.k);}
 return{t,seq};}
function evaluation(){const mn=a=>Math.min(...a),mx=a=>Math.max(...a),vow=r=>r>=.95?'A':r>=.85?'E':r>=.7?'I':r>=.5?'O':'U';
 const iso=SC.map(s=>dist(s.o,'B','H'));
 const rows=[['Costo de flujo (CRAFT)',10,SC.map(s=>vow(mn(SC.map(x=>x.cost))/s.cost))],['Cercanías (ALDEP)',8,SC.map(s=>vow(s.alE/mx(SC.map(x=>x.alE))))],['Relaciones (CORELAP)',6,SC.map(s=>vow(s.coE/mx(SC.map(x=>x.coE))))],
  ['Trabajo de transporte',8,SC.map(s=>vow(mn(SC.map(x=>x.tr))/s.tr))],['Holgura de patines',7,SC.map(s=>vow(mn(SC.map(x=>x.pat.util))/s.pat.util))],['Aislamiento Admin↔Producción',6,SC.map((s,i)=>vow(iso[i]/mx(iso)))],['Espacio de maniobra en producción',8,SC.map(s=>vow(s.ar.H/mx(SC.map(x=>x.ar.H))))]];
 const tot=SC.map((s,i)=>rows.reduce((t,r)=>t+r[1]*VAL[r[2][i]],0));return{rows,tot,max:rows.reduce((t,r)=>t+r[1]*4,0)};}
function recalc(){calc0();metrics();}
calc0();SC.forEach(s=>{s.o=Object.assign(new String(s.o),{cx:s});});metrics();

/* ================= GRÁFICAS Y TABLAS ================= */
Chart.defaults.animation=false;Chart.defaults.color='#1f2937';Chart.defaults.font.size=11;
const CHS={};let POST=[];
const OPC=['#1f2937','#6b7280','#9ca3af'];
function chart(id,cfg){const cv=document.getElementById(id);if(!cv)return;if(CHS[id])CHS[id].destroy();cv.width=420;cv.height=260;cfg.options=Object.assign({responsive:false,animation:false,plugins:{legend:{display:false}}},cfg.options||{});CHS[id]=new Chart(cv,cfg);}
const bar=(id,title,vals,unit)=>chart(id,{type:'bar',data:{labels:SC.map(s=>s.name),datasets:[{data:vals,backgroundColor:OPC}]},options:{plugins:{legend:{display:false},title:{display:true,text:title+(unit?' ('+unit+')':'')}}}});
const T=(h,rows)=>'<div class="scroll"><table><tr>'+h.map(x=>`<th>${x}</th>`).join('')+'</tr>'+rows.map(r=>'<tr>'+r.map((c,i)=>`<td${i==1&&typeof c==='string'&&c.length>14?' class="l"':''}>${c}</td>`).join('')+'</tr>').join('')+'</table></div>';
const ot=s=>`${s.name} · ${[...s.o].join('-')}`;
const dn=k=>`${k} ${DEP[k].n}`;
const ltr=l=>`<b style="color:${VC[l]}">${l}</b>`;
const cv_=(id,w=420,h=260)=>`<div class="scroll"><canvas id="${id}" width="${w}" height="${h}"></canvas></div>`;

/* ---------- Diagrama de relaciones de actividades (SLP): A=4 líneas, E=3, I=2, O=1, X=zigzag ---------- */
function drawARD(cv,s){const W=cv.width=380,H=cv.height=380,x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);const pos={};
 [...s.o].forEach((k,i)=>{const a=-Math.PI/2+i*2*Math.PI/10;pos[k]=[W/2+Math.cos(a)*145,H/2+Math.sin(a)*145];});
 for(let i=0;i<10;i++)for(let j=i+1;j<10;j++){const a=IDS[i],b=IDS[j],l=rel(a,b);if(l==='U')continue;const [x1,y1]=pos[a],[x2,y2]=pos[b],dx=x2-x1,dy=y2-y1,n=Math.hypot(dx,dy),nx=-dy/n,ny=dx/n;x.strokeStyle=VC[l];x.lineWidth=1.6;
  if(l==='X'){x.beginPath();x.moveTo(x1,y1);for(let t=1;t<=14;t++){const q=t/14,o=t%2?6:-6;x.lineTo(x1+dx*q+nx*o,y1+dy*q+ny*o);}x.stroke();continue;}
  const m=LINES[l];for(let q=0;q<m;q++){const o=(q-(m-1)/2)*4;x.beginPath();x.moveTo(x1+nx*o,y1+ny*o);x.lineTo(x2+nx*o,y2+ny*o);x.stroke();}}
 [...s.o].forEach(k=>{const [px,py]=pos[k];x.fillStyle=DEP[k].c;x.strokeStyle='#1f2937';x.lineWidth=2;x.beginPath();x.arc(px,py,17,0,7);x.fill();x.stroke();x.fillStyle='#1f2937';x.font='bold 14px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(k,px,py);});
 x.font='11px sans-serif';x.textAlign='left';x.fillStyle='#1f2937';x.fillText(ot(s),8,14);}

/* ---------- PLANO VERTICAL: entrada abajo, 141.50 m hacia el fondo ----------
   Los recintos se dibujan en su posición explícita (gx, gy, gw, gh) dentro de su franja.
   Decoración según el plano PDF: vialidades laterales (4 m), patio de estiba con rejilla
   en producto terminado, 6 rectángulos de estiba en curado, máquina y 3 bandas en producción. */
function drawPlan(cv,s,S=12,mini=false){const M=mini?8:64,top=mini?22:56,bot=mini?20:60,bs=bandsOf(s.o),LT=bs.reduce((t,b)=>t+b.L,0),W=Math.round(26*S+M*2),H=Math.round(LT*S+top+bot);
 cv.width=W;cv.height=H;const x=cv.getContext('2d'),Y=y=>H-bot-y*S,X=m=>M+m*S;x.fillStyle='#fff';x.fillRect(0,0,W,H);x.textAlign='center';x.textBaseline='middle';x.fillStyle='#1f2937';
 x.font=`bold ${mini?10:14}px sans-serif`;x.fillText(`ALPHA BLOCKS · ${s.name}`+(mini?'':` · ${s.tag}`),W/2,mini?10:20);if(!mini){x.font='11px sans-serif';x.fillText(`Predio 26.00 m × 141.50 m · orden (de la entrada al fondo): ${[...s.o].join(' → ')}`,W/2,40);}
 bs.forEach(b=>{const j=b.k[0]==='J',x0=j?0:4;
  /* vialidades laterales (4 m) a ambos lados, salvo en maniobras (ancho completo) */
  if(!j){x.fillStyle='#d9dde3';x.fillRect(X(0),Y(b.y+b.L),4*S,b.L*S);x.fillRect(X(22),Y(b.y+b.L),4*S,b.L*S);}
  const rooms=[];b.k.forEach(k=>s.rm[k].forEach(r=>rooms.push({...r,k})));
  /* fondo de la franja: el recinto bg:'fill' (zona de control) pinta toda la franja */
  const bg=rooms.find(r=>r.bg==='fill');
  if(bg){x.fillStyle=DEP[bg.k].c;x.fillRect(X(x0),Y(b.y+b.L),b.w*S,b.L*S);}
  /* recintos normales primero, insertos encima */
  rooms.filter(r=>!r.bg&&!r.inset).concat(rooms.filter(r=>!r.bg&&r.inset)).forEach(r=>{
   const px=X(x0+r.gx),py=Y(b.y+r.gy+r.gh),pw=r.gw*S,ph=r.gh*S;
   x.fillStyle=DEP[r.code[0]].c;x.fillRect(px,py,pw,ph);x.strokeStyle='#222';x.lineWidth=mini?.6:1.2;x.strokeRect(px,py,pw,ph);
   if(!mini){x.fillStyle='#1f2937';const big=pw>96&&ph>56,mid=pw>56&&ph>30;x.font='bold 11px sans-serif';x.fillText(r.code,px+pw/2,py+ph/2-(big?12:mid?7:0));if(big){x.font='9px sans-serif';const mc=Math.floor((pw-8)/4.8);x.fillText(r.n.length>mc?r.n.slice(0,mc-1)+'…':r.n,px+pw/2,py+ph/2);}if(mid){x.font='9px sans-serif';x.fillText(fm(r.a)+' m²',px+pw/2,py+ph/2+(big?12:7));}}
   else if(pw>14&&ph>10){x.fillStyle='#1f2937';x.font='8px sans-serif';x.fillText(r.code[0],px+pw/2,py+ph/2);}});
  /* decoración de la franja según el plano PDF */
  if(!mini){
   if(b.k.includes('E')){ /* patio de estiba con rejilla en producto terminado */
    const gx0=X(x0+0.1),gy0=Y(b.y+17.5),gw=17.8*S,gh=11*S;
    x.strokeStyle='#6b7280';x.lineWidth=1;x.setLineDash([4,3]);x.strokeRect(gx0,gy0,gw,gh);
    for(let i=1;i<4;i++){x.beginPath();x.moveTo(gx0+gw*i/4,gy0);x.lineTo(gx0+gw*i/4,gy0+gh);x.stroke();}
    for(let i=1;i<3;i++){x.beginPath();x.moveTo(gx0,gy0+gh*i/3);x.lineTo(gx0+gw,gy0+gh*i/3);x.stroke();}
    x.setLineDash([]);}
   if(b.k.includes('G')){ /* 6 rectángulos de estiba en curado */
    const lab=rooms.find(r=>r.code==='D1'&&r.inset),y0=lab?4.5:0.75,y1=b.L-(lab?0.5:0.75),rh=(y1-y0-0.5)/2;
    for(let ri=0;ri<2;ri++)for(let ci=0;ci<3;ci++){
     const rx=X(x0+0.5+ci*5.92),ry=Y(b.y+y0+ri*(rh+0.5)+rh),rw=5.5*S,rh2=rh*S;
     x.strokeStyle='#6b7280';x.lineWidth=1;x.setLineDash([4,3]);x.strokeRect(rx,ry,rw,rh2);x.setLineDash([]);}}
   if(b.k.includes('H')){ /* máquina QT4-16 y 3 bandas hacia las tolvas */
    const mx=X(x0+7.5),my=Y(b.y+5.25+3),mw=3*S,mh=3*S;
    x.fillStyle='#f8fafc';x.fillRect(mx,my,mw,mh);x.strokeStyle='#1f2937';x.lineWidth=1.2;x.strokeRect(mx,my,mw,mh);
    x.fillStyle='#1f2937';x.font='bold 9px sans-serif';x.fillText('QT4-16',mx+mw/2,my+mh/2);
    x.strokeStyle='#2563eb';x.lineWidth=1.6;[3,9,15].forEach(xx=>{x.beginPath();x.moveTo(mx+mw/2,my);x.lineTo(X(x0+xx),Y(b.y+b.L));x.stroke();
     x.fillStyle='#2563eb';x.beginPath();const ay=Y(b.y+b.L);x.moveTo(X(x0+xx),ay);x.lineTo(X(x0+xx)-4,ay+7);x.lineTo(X(x0+xx)+4,ay+7);x.fill();});}
   if(bg){x.fillStyle='#1f2937';x.font='9px sans-serif';x.fillText('ZONA DE CONTROL / TRANSICIÓN',X(x0+11),Y(b.y+2.75));}
   if(s.id===1&&b.k.includes('A')){x.fillStyle='#1f2937';x.font='italic 9px sans-serif';x.fillText('SEPARACIÓN 0.6 m',X(13),Y(b.y+5.8));}
  }
  x.strokeStyle='#1f2937';x.lineWidth=mini?1.2:2.5;x.strokeRect(X(0),Y(b.y+b.L),26*S,b.L*S);
  if(!mini){x.save();x.translate(M-16,Y(b.y+b.L/2));x.rotate(-Math.PI/2);x.fillStyle='#1f2937';x.font='bold 10px sans-serif';x.fillText(b.k.map(k=>DEP[k].n).join(' + ').slice(0,36),0,0);x.restore();
   x.font='9px sans-serif';x.textAlign='left';x.fillText(fm(b.L)+' m',X(26)+3,Y(b.y+b.L/2));x.textAlign='center';}});
 /* rótulo de la vialidad lateral izquierda (una sola vez, a lo largo de todo el plano) */
 if(!mini){const lanes=bs.filter(b=>b.k[0]!=='J'),ly=lanes.reduce((t,b)=>t+b.L,0);
  x.save();x.translate(M+2*S,Y(ly/2));x.rotate(-Math.PI/2);x.fillStyle='#4b5563';x.font='9px sans-serif';x.fillText('CIRCULACIÓN VEHICULAR Y LOGÍSTICA LATERAL',0,0);x.restore();}
 const c=cent(s.o),gx=X(13);x.strokeStyle='#e11d48';x.lineWidth=mini?1.5:2.5;x.setLineDash([6,4]);x.beginPath();x.moveTo(gx,Y(c.H));x.lineTo(gx,Y(c.G));x.stroke();x.setLineDash([]);
 x.fillStyle='#e11d48';x.beginPath();const dir=c.G<c.H?1:-1,ay=Y(c.G);x.moveTo(gx,ay);x.lineTo(gx-5,ay+dir*9);x.lineTo(gx+5,ay+dir*9);x.fill();
 if(!mini){x.font='bold 10px sans-serif';x.fillText(`Patines H→G: ${fm(P.blocks,0)} bl/día`,gx,Y((c.H+c.G)/2)-8);
  x.fillStyle='#1f2937';x.font='bold 12px sans-serif';x.fillText('▲ ENTRADA',W/2,H-18);x.font='10px sans-serif';x.fillText('26.00 m',W/2,H-bot+14-0);}
 else{x.fillStyle='#1f2937';x.font='8px sans-serif';x.fillText('ENTRADA',W/2,H-8);}}
const roomRows=s=>{const r=[];s.bs.forEach(b=>b.k.forEach(k=>s.rm[k].forEach(q=>r.push([q.code,q.n,dn(k),fm(q.a),q.c,q.e]))));return r;};
const deptRows=s=>[...s.o].map((k,i)=>[k,DEP[k].n,fm(s.ar[k]),s.stf[k].length?s.stf[k].map(t=>t[1]+' '+t[0]).join('; '):'—',[s.o[i-1],s.o[i+1]].filter(Boolean).join(', ')]);

/* ---------- Descargas: PDF (jsPDF) y Word (.doc MHTML con el plano incrustado) ---------- */
function pdfTable(d,head,rows,w,y0,xs=10){let y=y0;const row=(r,b)=>{const lines=r.map((c,i)=>d.splitTextToSize(String(c),w[i]-2)),h=Math.max(...lines.map(l=>l.length))*3.4+2;if(y+h>285){d.addPage();y=12;}
  let x=xs;lines.forEach((l,i)=>{if(b){d.setFillColor(31,41,55);d.rect(x,y,w[i],h,'F');d.setTextColor(255);}else{d.setDrawColor(150);d.rect(x,y,w[i],h);d.setTextColor(0);}d.text(l,x+1,y+4);x+=w[i];});y+=h;};
  d.setFontSize(7);row(head,1);rows.forEach(r=>row(r,0));return y;}
function pdfPlan(s){const {jsPDF}=window.jspdf,d=new jsPDF('p','mm','a4'),cv=document.createElement('canvas');drawPlan(cv,s,16);
 d.setTextColor(31,41,55);d.setFontSize(13);d.text(`ALPHA BLOCKS · Plano ${s.name} (vertical, entrada abajo)`,10,9);d.setFontSize(8);d.text(s.tag,10,13.5);
 const ph=272,pw=ph*cv.width/cv.height;d.addImage(cv.toDataURL('image/png'),'PNG',10,16,pw,ph);
 let y=20;const x0=pw+16,wr=200-x0;d.setFontSize(9);d.text('Leyenda de colores (departamentos)',x0,y);y+=5;d.setFontSize(7.5);
 [...s.o].forEach(k=>{const c=DEP[k].c;d.setFillColor(parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16));d.rect(x0,y-3,5,4,'F');d.setTextColor(0);d.text(`${k} · ${DEP[k].n} · ${fm(s.ar[k])} m²`,x0+7,y);y+=5;});
 y+=3;d.setFontSize(9);d.text('Indicadores',x0,y);y+=5;d.setFontSize(7.5);
 [`Costo CRAFT: $${fm(s.cost)} MXN/día`,`ALDEP: ${s.al} pts (${fm(s.alE*100,1)}%)`,`CORELAP: ${s.co} pts (${fm(s.coE*100,1)}%)`,`Patines: ${s.pat.trips} viajes de ${P.cap} bl,`,`distancia H-G ${fm(s.pat.d,1)} m, ocupación ${fm(s.pat.util*100,1)}%`,`(${P.patines} patines, jornada ${P.hrs} h al ${P.eff*100}%)`,`Largo total del plano: ${fm(s.len,1)} m`].forEach(t=>{d.text(t,x0,y);y+=4.5;});
 y+=3;d.setFontSize(9);d.text('Departamentos, personal y colindancias',x0,y);
 pdfTable(d,['Dep.','Departamento','m²','Personal','Colinda'],deptRows(s),[8,34,12,52,16].map(v=>v*wr/122),y+2,x0);
 d.addPage();d.setFontSize(11);d.setTextColor(31,41,55);d.text(`Tabla de información por recinto · ${s.name}`,10,12);
 pdfTable(d,['Cód.','Recinto','Departamento','m²','Cotas (m)','Equipo / mobiliario'],roomRows(s),[10,36,38,12,20,74],16);
 d.save(`Plano_${s.name.replace(' ','_')}_ALPHA_BLOCKS.pdf`);}
function wordPlan(s){const cv=document.createElement('canvas');drawPlan(cv,s,10);const img=cv.toDataURL('image/png').split(',')[1],hh=Math.round(cv.height*620/cv.width>1000?1000:cv.height*620/cv.width);
 const tb=(h,r)=>'<table border=1 cellspacing=0 cellpadding=3 style="border-collapse:collapse;font-size:9pt;width:100%"><tr>'+h.map(x=>`<th bgcolor="#1f2937"><font color="white">${x}</font></th>`).join('')+'</tr>'+r.map(a=>'<tr>'+a.map(c=>`<td>${c}</td>`).join('')+'</tr>').join('')+'</table>';
 const leg=[...s.o].map(k=>`<tr><td bgcolor="${DEP[k].c}" width=30>&nbsp;</td><td>${k} · ${DEP[k].n}</td><td>${fm(s.ar[k])} m²</td></tr>`).join('');
 const html=`<html><head><meta charset="utf-8"><style>body{font-family:Calibri,Arial}h1{font-size:16pt}h2{font-size:12pt}</style></head><body><h1>ALPHA BLOCKS · Plano ${s.name}</h1><p>${s.tag}. Plano vertical con la entrada en la parte inferior. Predio 26.00 m × 141.50 m.</p>
 <p align=center><img src="file:///c:/plano.png" width=620 height=${hh}></p><h2>Leyenda de colores</h2><table border=1 cellspacing=0 cellpadding=3>${leg}</table>
 <h2>Indicadores</h2><p>Costo CRAFT: $${fm(s.cost)} MXN/día · ALDEP ${s.al} pts · CORELAP ${s.co} pts · Patines: ${s.pat.trips} viajes de ${P.cap} bloques, ocupación ${fm(s.pat.util*100,1)}% con ${P.patines} patines.</p>
 <h2>Tabla de información por recinto</h2>${tb(['Cód.','Recinto','Departamento','m²','Cotas (m)','Equipo / mobiliario'],roomRows(s))}<h2>Departamentos y personal</h2>${tb(['Dep.','Departamento','m²','Personal','Colinda con'],deptRows(s))}</body></html>`;
 const b64=t=>btoa(unescape(encodeURIComponent(t)));
 const mh=`MIME-Version: 1.0\r\nContent-Type: multipart/related; boundary="AB"; type="text/html"\r\n\r\n--AB\r\nContent-Type: text/html; charset="utf-8"\r\nContent-Transfer-Encoding: base64\r\nContent-Location: file:///c:/plano.htm\r\n\r\n${b64(html)}\r\n\r\n--AB\r\nContent-Type: image/png\r\nContent-Transfer-Encoding: base64\r\nContent-Location: file:///c:/plano.png\r\n\r\n${img}\r\n--AB--`;
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([mh],{type:'application/msword'}));a.download=`Plano_${s.name.replace(' ','_')}_ALPHA_BLOCKS.doc`;a.click();}

/* ================= FIGURAS DEL LIBRO (Muther & Hales, SLP) ================= */
const LBL={A:'Absolutamente necesaria',E:'Especialmente importante',I:'Importante',O:'Ordinaria',U:'Sin importancia',X:'No deseable'};
function drawRelChart(cv){if(!cv)return;const h=46,a=h/2,x0=215,y0=70,W=cv.width=640,H=cv.height=y0+10*h+30,x=cv.getContext('2d');
 x.fillStyle='#fff';x.fillRect(0,0,W,H);x.fillStyle='#1f2937';x.textBaseline='middle';x.textAlign='left';x.font='bold 13px sans-serif';x.fillText('CARTA DE RELACIONES · ALPHA BLOCKS',10,20);
 x.font='10px sans-serif';x.fillText('Arriba: cercanía (A–X) · Abajo: códigos de motivo · Muther & Hales, cap. 5',10,38);
 [...IDS].forEach((k,i)=>{x.font='11px sans-serif';x.textAlign='right';x.fillStyle='#1f2937';x.fillText(k+'  '+DEP[k].n,x0-8,y0+i*h);});
 const dia=(cx,cy)=>{x.beginPath();x.moveTo(cx,cy-a);x.lineTo(cx+a,cy);x.lineTo(cx,cy+a);x.lineTo(cx-a,cy);x.closePath();};
 for(let i=0;i<10;i++)for(let j=i+1;j<10;j++){const o=relOf(IDS[i],IDS[j]),cx=x0+(j-i)*a,cy=y0+(i+j)*a;
  if(o.l!=='U'){x.save();x.beginPath();x.rect(cx-a,cy-a,2*a,a);x.clip();dia(cx,cy);x.fillStyle=VC[o.l];x.fill();x.restore();}
  dia(cx,cy);x.strokeStyle='#1f2937';x.lineWidth=1;x.stroke();x.beginPath();x.moveTo(cx-a,cy);x.lineTo(cx+a,cy);x.stroke();
  x.textAlign='center';x.fillStyle=o.l==='U'?'#334155':'#fff';x.font='bold 13px sans-serif';x.fillText(o.l,cx,cy-a*.45);
  x.fillStyle='#1f2937';x.font='8px sans-serif';x.fillText(o.r.join(','),cx,cy+a*.45);}
 [...IDS].forEach((k,i)=>{const cx=x0+(10-i)*a,cy=y0+(i+10)*a;x.beginPath();x.arc(cx,cy,10,0,7);x.fillStyle=DEP[k].c;x.fill();x.strokeStyle='#1f2937';x.stroke();x.fillStyle='#1f2937';x.font='bold 11px sans-serif';x.textAlign='center';x.fillText(k,cx,cy);});
 let ly=64;x.textAlign='left';x.font='bold 11px sans-serif';x.fillStyle='#1f2937';x.fillText('Cercanía',490,ly);ly+=18;
 Object.keys(LBL).forEach(l=>{x.fillStyle=l==='U'?'#fff':VC[l];x.fillRect(490,ly-7,14,14);x.strokeStyle='#1f2937';x.strokeRect(490,ly-7,14,14);x.fillStyle='#1f2937';x.font='10px sans-serif';x.fillText(l+' · '+LBL[l],510,ly);ly+=19;});
 ly+=10;x.font='bold 11px sans-serif';x.fillText('Motivos',490,ly);ly+=16;x.font='9px sans-serif';
 Object.entries(REASONS).forEach(([c,t])=>{x.fillText(c+': '+t,490,ly);ly+=15;});}
function drawSRD(cv,s){if(!cv)return;const W=cv.width=640,H=cv.height=640,x=cv.getContext('2d'),g=20,k=4,pos={};x.fillStyle='#fff';x.fillRect(0,0,W,H);
 x.strokeStyle='#d6dde8';x.lineWidth=1;for(let q=0;q<=W;q+=g){x.beginPath();x.moveTo(q,0);x.lineTo(q,H);x.stroke();x.beginPath();x.moveTo(0,q);x.lineTo(W,q);x.stroke();}
 [...s.o].forEach((q,i)=>{const t=-Math.PI/2+i*2*Math.PI/10;pos[q]=[W/2+Math.cos(t)*225,H/2+14+Math.sin(t)*215];});
 for(let i=0;i<10;i++)for(let j=i+1;j<10;j++){const A=IDS[i],B=IDS[j],l=rel(A,B);if(l==='U')continue;const [x1,y1]=pos[A],[x2,y2]=pos[B],dx=x2-x1,dy=y2-y1,n=Math.hypot(dx,dy),nx=-dy/n,ny=dx/n;x.strokeStyle=VC[l];x.lineWidth=2;
  if(l==='X'){x.beginPath();x.moveTo(x1,y1);for(let t=1;t<=18;t++){const q=t/18,o=t%2?6:-6;x.lineTo(x1+dx*q+nx*o,y1+dy*q+ny*o);}x.stroke();continue;}
  const m=LINES[l];for(let q=0;q<m;q++){const o=(q-(m-1)/2)*4;x.beginPath();x.moveTo(x1+nx*o,y1+ny*o);x.lineTo(x2+nx*o,y2+ny*o);x.stroke();}}
 [...s.o].forEach(q=>{const [px,py]=pos[q],side=Math.sqrt(s.ar[q])*k;x.fillStyle=DEP[q].c+'dd';x.fillRect(px-side/2,py-side/2,side,side);x.strokeStyle='#1f2937';x.lineWidth=1.5;x.strokeRect(px-side/2,py-side/2,side,side);
  x.beginPath();x.arc(px,py,13,0,7);x.fillStyle='#fff';x.fill();x.stroke();x.fillStyle='#1f2937';x.font='bold 13px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(q,px,py);
  x.font='10px sans-serif';x.fillText(fm(s.ar[q])+' m²',px,py+side/2+10);});
 x.textAlign='left';x.font='bold 13px sans-serif';x.fillStyle='#1f2937';x.fillText('DIAGRAMA DE RELACIÓN DE ESPACIOS · '+s.name,10,16);x.font='10px sans-serif';x.fillText('Escala: 1 cuadro = 5 m × 5 m (25 m²). Cada recuadro tiene la superficie real de su actividad.',10,H-10);}
const legendHTML=()=>{const ln=l=>{let v='<svg width="64" height="22">';if(l==='X'||l==='XX'){const c=l==='X'?VC.X:'#000',z=y=>`<polyline fill="none" stroke="${c}" stroke-width="1.6" points="${Array.from({length:17},(_,i)=>`${2+i*3.75},${y+(i%2?3:-3)}`).join(' ')}"/>`;v+=z(l==='X'?11:7)+(l==='XX'?z(16):'');}else{const m=LINES[l];for(let q=0;q<m;q++){const y=11+(q-(m-1)/2)*4;v+=`<line x1="2" x2="62" y1="${y}" y2="${y}" stroke="${VC[l]}" stroke-width="1.8"/>`;}}return v+'</svg>';};
 const R=[['A',4,'Absolutamente necesaria','Rojo'],['E',3,'Especialmente importante','Naranja / amarillo'],['I',2,'Importante','Verde'],['O',1,'Ordinaria','Azul'],['U',0,'Sin importancia','Sin color'],['X',-1,'No deseable','Café'],['XX','-2 a -4','Extremadamente indeseable','Negro']];
 return '<h3>Convenciones SLP (Muther & Hales, fig. 6-5)</h3>'+T(['Letra','Valor','Líneas','Cercanía','Color'],R.map(r=>[`<b style="color:${VC[r[0]]||'#000'}">${r[0]}</b>`,r[1],ln(r[0]),r[2],r[3]]));};
const freqHTML=()=>{const c={A:0,E:0,I:0,O:0,U:0,X:0},ref={A:'2–5%',E:'3–10%',I:'5–15%',O:'10–25%',U:'el resto',X:'según el proyecto'};for(let i=0;i<10;i++)for(let j=i+1;j<10;j++)c[rel(IDS[i],IDS[j])]++;
 return '<h3>Distribución de calificaciones (referencia del libro, cap. 5)</h3>'+T(['Rel.','Pares','% de 45','Rango sugerido'],Object.keys(c).map(l=>[ltr(l),c[l],fm(c[l]/45*100,1)+'%',ref[l]]));};
const ftHTML=()=>'<div class="scroll"><table><tr><th>De \\ A</th>'+[...IDS].map(k=>`<th>${k}</th>`).join('')+'</tr>'+[...IDS].map(a=>`<tr><th>${a}</th>`+[...IDS].map(b=>{const f=FL.find(r=>r.a===a&&r.b===b);return`<td${f?' style="background:rgba(209,213,219,.25)"':''}>${f?f.tr:''}</td>`;}).join('')+'</tr>').join('')+'</table></div>';
const bookBlock=()=>'<div class="scroll"><canvas id="rchart" width="640" height="560"></canvas></div>'+legendHTML()+freqHTML();
function addDL(){$$('#galBody canvas').forEach(cv=>{const box=cv.parentElement;if(box.nextElementSibling&&box.nextElementSibling.classList.contains('dl'))return;
 let e=cv.closest('.cgrid,.row')||box,title='Gráfica';while(e&&e.tagName!=='H3')e=e.previousElementSibling;if(e)title=e.textContent;
 const b=document.createElement('button');b.className='btn dl';b.textContent='Descargar Gráfica en PDF';box.after(b);
 b.onclick=()=>{const {jsPDF}=window.jspdf,c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;const q=c.getContext('2d');q.fillStyle='#fff';q.fillRect(0,0,c.width,c.height);q.drawImage(cv,0,0);
  const d=new jsPDF(cv.width>=cv.height?'l':'p','mm','a4'),pw=d.internal.pageSize.getWidth()-20,ph=d.internal.pageSize.getHeight()-35,k=Math.min(pw/cv.width,ph/cv.height);
  d.setFontSize(12);d.text('ALPHA BLOCKS · '+title,10,12);d.setFontSize(8);d.text('Equipo Cacahuate · Base metodológica: Muther & Hales, Systematic Layout Planning',10,17);
  d.addImage(c.toDataURL('image/png'),'PNG',10,22,cv.width*k,cv.height*k);d.save('alpha-blocks-'+title.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)+'.pdf');Aud.sfx('down');};});}

/* ================= MÉTODOS PASO A PASO ================= */
const REL_TXT=`<p>Según Muther, la <b>carta de relaciones</b> califica la cercanía deseada entre cada par de actividades con las vocales <b>A, E, I, O, U, X</b> y el motivo (código numérico). Aquí se combina la relación <b>cualitativa</b> (motivos del equipo) con la de <b>flujo</b> (volumen × dificultad), como propone el SLP: S = 2·valor(flujo) + valor(otras).</p>`;
const relRows=()=>{const r=[];for(let i=0;i<10;i++)for(let j=i+1;j<10;j++){const a=IDS[i],b=IDS[j],o=relOf(a,b);if(o.l!=='U')r.push([a+'–'+b,ltr(o.l),o.r.map(c=>`${c}: ${REASONS[c]}`).join('; '),o.S]);}return r;};

/* ---------- Comparación de sistemas de transporte: manual, semiautomático y automatizado ---------- */
/* ---------- Comparación de sistemas de transporte: manual, semiautomático y automatizado ----------
   El costo del transporte NO es el mismo en las 3 opciones: el manual se paga con mano de
   obra (sueldo normal por día), el semiautomático usa patines y bandas que ya existen, y el
   automatizado exige comprar maquinaria nueva. El trabajo es el mismo en las 3: mover
   1,800 bloques al día; lo que cambia es el tiempo, el esfuerzo y lo que hay que comprar. */
const transporteHTML=()=>{
 const m1=SC[0].man,m2=SC[1].pat;
 const hh1=m1.hh,hh2=m2.sec/3600;
 const lab1=hh1*WAGE_H,lab2=hh2*WAGE_H,work1=Math.ceil(hh1/P.hrs);
 const ritmoM=3600/m1.perHour,ritmoS=60/(m2.trips/P.hrs);
 return `<div class="box"><p>Las tres opciones comparten las mismas áreas y los mismos costos unitarios, pero <b>el costo del transporte NO es el mismo</b>: cada sistema se paga de forma distinta. La opción 1 mueve todo con carretillas y se paga con <b>mano de obra</b>; la opción 2 combina 3 bandas transportadoras con patines hidráulicos y usa <b>equipo que ya tiene el proyecto</b>; la opción 3 automatiza el transporte con bandas y una apiladora y se paga con <b>maquinaria nueva</b>. La producción exigida es la misma para las tres: <b>${fm(P.blocks,0)} bloques al día en ${P.hrs} horas</b> (${fm(P.blocks/P.hrs,0)} bloques por hora, ${fm(P.blocks/P.hrs/60,1)} por minuto, sin pausa).</p>
 <p><b>Sueldo base del cálculo:</b> un operario gana $315.04 al día ($163,820.80 al mes entre 20 operarios y 26 días; $45.01 por hora en jornada de 7 h). Un trabajador recibe su sueldo normal en un día, haga los viajes que haga.</p>
 <p><b>Supuestos del cálculo manual (confirmar):</b> carretilla típica de ${MAN.capBl} bloques por viaje (${fm(MAN.capBl*13.2,1)} kg) o de ≈${MAN.capKg} kg de materia prima por viaje, operada por ${MAN.workers} trabajadores, con ${MAN.load} s de carga y descarga por viaje y velocidad con carga de ${MAN.v} m/s. Materia prima por día ≈ ${fm(MAN.kgDia,0)} kg (la masa de los bloques producidos).</p></div>
 <h3>Opción 1 · Sistema manual: más viajes, menos bloques, se paga con sueldos</h3>
 <div class="box"><p>En la opción manual todo el transporte interno depende de la fuerza de los trabajadores, y cada trabajador recibe su sueldo normal en un día:</p>
 <p>• <b>Materia prima:</b> el traslado desde las bahías de almacenamiento hasta producción se hace con carretilla y exige mayor esfuerzo físico: son <b>${fm(m1.tripsMP,0)} viajes al día</b> cargando ≈${MAN.capKg} kg cada uno, recorriendo ${fm(m1.dIH,1)} m por viaje (ida y vuelta), con un ciclo de ${fm(m1.cycMP,0)} s por viaje.</p>
 <p>• <b>Bloques Producción → Curado:</b> es el problema mayor de tiempo y capacidad. Con solo ${MAN.capBl} bloques por viaje se necesitan <b>${fm(m1.tripsBl,0)} viajes al día</b> para los ${fm(P.blocks,0)} bloques, recorriendo ${fm(m1.dHG,1)} m por viaje, con un ciclo de ${fm(m1.cycBl,0)} s por viaje.</p>
 <p>• <b>Carretillas de 2 trabajadores:</b> cada viaje ocupa a dos personas a la vez, así que la mano de obra se duplica y la cantidad por viaje queda limitada a ${MAN.capBl} bloques.</p>
 <p>• <b>Ritmo imposible de sostener sin refuerzo:</b> en total son <b>${fm(m1.tot,0)} viajes manuales al día</b> (${fm(m1.perHour,1)} por hora, uno cada ${fm(ritmoM,0)} segundos, sin pausa), que suman <b>${fm(hh1,1)} horas-hombre al día solo en transporte</b>, es decir, unos ${work1} trabajadores a tiempo completo moviendo material. Cada viaje extra es una maniobra más (cargar, empujar, descargar, regresar) y cada maniobra suma tiempo, fatiga y riesgo de daño a los bloques.</p>
 <p>• <b>Costo de la mano de obra:</b> ${fm(hh1,1)} horas-hombre × $45.01/h = <b>$${fm(lab1,0)} al día</b> de trabajo que se va solo en transporte. Los trabajadores ya están en la nómina, pero ese tiempo no produce bloques: el transporte, y no la máquina, se vuelve el cuello de botella de la planta.</p>
 <p>• <b>Inversión nueva en maquinaria: $0.</b> La opción manual no compra nada; por eso es la que puede empatar en costos con la semiautomática, pero se lleva mucho más tiempo y esfuerzo.</p></div>
 <h3>Opción 3 · Sistema automatizado: muchos menos viajes y menos tiempo, pero el costo es más alto</h3>
 <div class="box"><p><b>Ventajas:</b></p>
 <p>• El transporte de materias primas hacia la maquinaria se realiza mediante <b>bandas transportadoras</b> (la materia prima llega unificada desde una tolva única).</p>
 <p>• El traslado de bloques hacia el área de curado se realiza mediante <b>maquinaria automática de apilamiento</b>, sin viajes manuales: los 1,800 bloques se mueven en flujo continuo, en mucho menos tiempo que con carretillas o patines.</p>
 <p>• Se reduce considerablemente la intervención de los trabajadores en las maniobras de transporte: el personal pasa a <b>supervisión</b> (vigilar bandas y apiladora) en lugar de cargar y empujar.</p>
 <p><b>Desventajas:</b></p>
 <p>• <b>Costos elevados de instalación:</b> bandas transportadoras a lo largo de todas las áreas necesarias (cada banda adicional de 13 m cuesta $53,254 según los datos del proyecto), maquinaria automática de transporte y apilamiento (sin cotización en los datos del proyecto) y montacargas adicionales (cada uno $448,456 según los datos del proyecto).</p>
 <p>• <b>Ejemplo de inversión nueva:</b> 2 bandas de 13 m ($106,508) + 1 montacargas ($448,456) = <b>$${fm(AUTO.inv,0)}</b>, sin contar la apiladora (sin cotización). Depreciadas a 12 años son $${fm(AUTO.depDay,0)} al día. Es la opción que más cuesta en maquinaria, y esa inversión no se recupera moviendo los mismos 1,800 bloques que las otras dos ya mueven.</p>
 <p>• Mayor dependencia de la energía eléctrica y del mantenimiento: una falla en una banda o en la apiladora detiene todo el flujo de la planta.</p>
 <p>• Requiere personal capacitado para operar y mantener el equipo automático, y repuestos que hoy no están contemplados.</p></div>
 <h3>Opción 2 · Sistema semiautomático: por qué es la más conveniente</h3>
 <div class="box"><p>La opción semiautomática es la que mejor equilibra productividad, inversión y eficiencia operativa:</p>
 <p>• <b>Solo 3 bandas transportadoras, con recorridos cortos:</b> las 2 de 13 m y 1 de 7 m que ya tiene el proyecto (33 m en total) mueven la materia prima desde las bahías hasta la máquina, sin comprar bandas nuevas.</p>
 <p>• <b>Patines hidráulicos para los bloques:</b> una sola persona moviliza ≈1 t por viaje (${P.cap} bloques × 13.2 kg = ${P.cap*13.2} kg). Para los ${fm(P.blocks,0)} bloques bastan <b>${m2.trips} viajes al día</b> (uno cada ${fm(ritmoS,0)} minutos), con un ciclo de ${fm(m2.cyc,0)} s por viaje: apenas <b>${fm(hh2,2)} horas-hombre al día</b> en ese traslado, contra ${fm(hh1,1)} horas-hombre del sistema manual.</p>
 <p>• <b>Costo de la mano de obra:</b> ${fm(hh2,2)} horas-hombre × $45.01/h = <b>$${fm(lab2,0)} al día</b>, contra $${fm(lab1,0)} del sistema manual.</p>
 <p>• <b>Reduce considerablemente el esfuerzo físico y las maniobras</b> respecto a la alternativa manual: de ${fm(m1.tot,0)} viajes con carretilla a ${m2.trips} viajes con patín, y de 2 trabajadores por viaje a 1.</p>
 <p>• <b>Evita los elevados costos de la automatización completa</b> de la opción 3: no compra bandas adicionales, ni apiladora automática, ni montacargas extra.</p>
 <p>• <b>Equilibra tiempos, capacidad, inversión y costos de operación:</b> el traslado es rápido y suficiente para la producción diaria, la inversión en maquinaria es la que ya está contemplada y el costo de operación es bajo (energía de 3 bandas y mano de obra mínima).</p></div>
 <h3>Comparación técnica de los tres sistemas</h3>`+
 T(['Concepto','Opción 1 · Manual','Opción 2 · Semiautomática','Opción 3 · Automatizada'],[
  ['Transporte de materia prima → Producción','Carretilla (2 trabajadores)','3 bandas transportadoras (13+13+7 m)','Bandas + tolva única'],
  ['Transporte de bloques Producción → Curado','Carretilla (2 trabajadores)','Patín hidráulico (1 persona)','Apiladora automática'],
  ['Viajes de bloques por día',fm(m1.tripsBl,0),m2.trips,'0 (flujo continuo)'],
  ['Viajes de materia prima por día',fm(m1.tripsMP,0),'0 (bandas)','0 (bandas)'],
  ['Total de viajes manuales por día',fm(m1.tot,0),m2.trips,'0'],
  ['Bloques por viaje',MAN.capBl,P.cap+' (≈1 t)','—'],
  ['Trabajadores por viaje','2','1','0 (supervisión)'],
  ['Horas-hombre/día en transporte',fm(hh1,1),fm(hh2,2),'Solo supervisión'],
  ['Mano de obra del transporte por día','$'+fm(lab1,0),'$'+fm(lab2,0),'Solo supervisión'],
  ['Inversión nueva en maquinaria','$0','$0 (ya existe)','$'+fm(AUTO.inv,0)+' (ejemplo)'],
  ['Depreciación de la maquinaria nueva por día','—','—','$'+fm(AUTO.depDay,0)],
  ['Ritmo necesario','1 viaje cada '+fm(ritmoM,0)+' s','1 viaje cada '+fm(ritmoS,0)+' min','Continuo automático'],
  ['Bandas transportadoras','0','3 (ya existen)','3 + adicionales'],
  ['Esfuerzo físico','Alto','Bajo','Mínimo'],
  ['El trabajo se cumple (1,800 bloques)','Sí, pero más lento','Sí','Sí, y más rápido'],
  ['Riesgo de no cumplir la producción diaria','Alto','Bajo','Bajo']])+
 `<div class="box"><p class="win">Conclusión: la opción semiautomática (opción 2) ofrece el mejor equilibrio.</p><p>El trabajo es el mismo en las 3 opciones: mover ${fm(P.blocks,0)} bloques al día. Lo que cambia es el tiempo, el esfuerzo y lo que hay que comprar. La opción 1 empata en inversión con la 2 ($0 en maquinaria nueva), pero se lleva mucho más tiempo y esfuerzo: ${fm(m1.tot,0)} viajes con carretilla y ${fm(hh1,1)} horas-hombre al día ($${fm(lab1,0)} de mano de obra), contra ${m2.trips} viajes con patín y ${fm(hh2,2)} horas-hombre ($${fm(lab2,0)}). La opción 3 es la más rápida, pero su inversión en maquinaria ($${fm(AUTO.inv,0)} en el ejemplo, sin contar la apiladora) no vale la pena para mover los mismos 1,800 bloques que las otras dos ya mueven. La semiautomática mueve la misma producción con ${m2.trips} viajes de patín y 3 bandas que ya existen: menos esfuerzo, menos maniobras, sin inversión adicional y con tiempos de traslado suficientes para los ${fm(P.blocks,0)} bloques diarios.</p></div>`;};

const METHODS={
aldep:{t:'Método ALDEP · barrido y diagrama de relaciones',steps:[
 {t:'1. Carta de relaciones',h:()=>`<div class="box">${REL_TXT}</div>`+bookBlock()+expBtn('aldep-carta','aldep')+T(['Par','Rel.','Motivos','S'],relRows())+expBtn('aldep-pares','aldep'),p:()=>drawRelChart($('#rchart'))},
 {t:'2. Pesos',h:()=>`<div class="box"><p>ALDEP recorre la distribución en un <b>barrido</b> y suma un peso por cada par de departamentos que quedan contiguos. Pesos: A=64, E=16, I=4, O=1, U=0, X=−1024 (castiga fuertemente lo no deseable). Además, cada departamento debe quedar contiguo: si sus recintos se reparten en franjas distintas se resta el peso A (64) por cada fragmento. La eficiencia = puntaje ÷ máximo teórico (${maxW(W_ALDEP)} pts).</p></div>`+T(['Rel.','Peso'],Object.keys(W_ALDEP).map(l=>[ltr(l),W_ALDEP[l]]))+expBtn('aldep-pesos','aldep')},
 {t:'3. Barrido por opción',h:()=>SC.map(s=>`<h3>${ot(s)}</h3>`+T(['Par contiguo','Rel.','Peso'],padj(s.o).map(([a,b])=>[a+'–'+b,ltr(rel(a,b)),W_ALDEP[rel(a,b)]]).concat(frag(s.o)?[['Departamento fragmentado ×'+frag(s.o),ltr('A'),-frag(s.o)*W_ALDEP.A]]:[]))+`<p class="win">Puntaje ${s.al} · eficiencia ${fm(s.alE*100,1)}%</p>`).join('')+expBtn('aldep-barrido','aldep')},
 {t:'4. Diagrama de relaciones',h:()=>`<div class="box"><p>Diagrama de relación de actividades (SLP): 4 líneas = A, 3 = E, 2 = I, 1 = O, zigzag = X.</p></div>${legendHTML()}<div class="cgrid">${SC.map(s=>cv_('ard'+s.id,380,380)).join('')}</div>`+expBtn('aldep-diagrama','aldep'),p:()=>SC.forEach(s=>drawARD($('#ard'+s.id),s))},
 {t:'5. Resultado',h:()=>`<div class="box">${winT(tops(s=>s.al),'Mejor ALDEP','EMPATE en ALDEP',t=>t.al+' pts')}<p>Puntaje mayor = más relaciones importantes contiguas y ninguna X junto.</p></div>`+cv_('c1')+expBtn('aldep-resultado','aldep'),p:()=>bar('c1','Puntaje ALDEP',SC.map(s=>s.al),'pts')}]},
corelap:{t:'Método CORELAP · TCR y diagrama de espacios',steps:[
 {t:'1. TCR',h:()=>{const c=coreOrder();return`<div class="box"><p>El <b>Total Closeness Rating</b> de cada departamento suma los valores numéricos de sus relaciones con los demás (A=6, E=5, I=4, O=3, U=2, X=1). El de mayor TCR entra primero al plano.</p></div>`+T(['Dep.','Nombre','A','E','I','O','U','X','TCR'],[...IDS].map(k=>{const n={A:0,E:0,I:0,O:0,U:0,X:0};[...IDS].filter(x=>x!==k).forEach(x=>n[rel(k,x)]++);return[k,DEP[k].n,n.A,n.E,n.I,n.O,n.U,n.X,c.t[k]];}))+expBtn('corelap-tcr','corelap');}},
 {t:'2. Orden de colocación',h:()=>{const c=coreOrder();return`<div class="box"><p>Se coloca primero el de mayor TCR; después, el que tiene la relación más fuerte con los ya colocados (desempate por suma y por TCR).</p></div>`+T(['Orden','Dep.','Criterio'],c.seq.map((q,i)=>[i+1,dn(q.k),q.why]))+`<p class="win">Secuencia CORELAP: ${c.seq.map(q=>q.k).join('-')}</p>`+expBtn('corelap-orden','corelap');}},
 {t:'3. Puntaje por opción',h:()=>`<div class="box"><p>Cada opción se califica con los pesos de CORELAP sobre los pares contiguos y se resta el peso A (6) por cada departamento fragmentado en varias franjas. Máximo teórico: ${maxW(W_CORE)} pts.</p></div>`+T(['Opción','Orden','Puntaje','Eficiencia'],SC.map(s=>[s.name,[...s.o].join('-'),s.co,fm(s.coE*100,1)+'%']))+expBtn('corelap-puntaje','corelap')},
 {t:'4. Diagrama de espacios',h:()=>`<div class="box"><p>Diagrama de relación de espacios (SLP): cada actividad con su área a escala dentro del predio de 26 m, entrada abajo. La línea roja es la ruta de patines Producción→Curado.</p></div><h3>Diagrama de relación de espacios (Muther, fig. 8-2)</h3><div class="cgrid">${SC.map(s=>cv_('sr'+s.id,640,640)).join('')}</div><h3>Plano a escala</h3><div class="row">${SC.map(s=>cv_('mp'+s.id,100,100)).join('')}</div>`+expBtn('corelap-espacios','corelap'),p:()=>SC.forEach(s=>{drawSRD($('#sr'+s.id),s);drawPlan($('#mp'+s.id),s,5,true);})},
 {t:'5. Resultado',h:()=>`<div class="box">${winT(tops(s=>s.co),'Mejor CORELAP','EMPATE en CORELAP',t=>t.co+' pts')}</div>`+cv_('c1')+expBtn('corelap-resultado','corelap'),p:()=>bar('c1','Puntaje CORELAP',SC.map(s=>s.co),'pts')}]},
craft:{t:'Método CRAFT · flujos, costos y patines',steps:[
 {t:'1. Carta De–A',h:()=>`<div class="box"><p>Carta de recorridos (From-To): viajes por día entre departamentos. El flujo H→G se calcula con la producción: ${fm(P.blocks,0)} bloques ÷ ${P.cap} por viaje = <b>${Math.ceil(P.blocks/P.cap)} viajes</b>. Los costos unitarios son los mismos en las 3 opciones: C = k·2 ÷ (v·3600) MXN por viaje·metro.</p></div>`+T(['De','A','Flujo','Modo','Viajes/día','$/viaje·m'],FL.map(r=>[r.a,r.b,r.d,r.m,r.tr,fm(r.c,4)]))+expBtn('craft-dea','craft')+'<h3>Matriz De–A (viajes por día)</h3>'+ftHTML()+expBtn('craft-matriz','craft')},
 {t:'2. Distancias',h:()=>`<div class="box"><p>Distancia = diferencia entre centroides sobre el eje longitudinal (m desde la entrada). El laboratorio comparte franja con su vecino.</p></div>`+T(['Dep.',...SC.map(s=>s.name)],[...IDS].map(k=>[dn(k),...SC.map(s=>fm(cent(s.o)[k],1)+' m')]))+expBtn('craft-distancias','craft')},
 {t:'3. Costos por flujo',h:()=>`<div class="box"><p>Costo = viajes × $/viaje·m × distancia. Este cálculo es el costo del flujo base: usa patines para las 3 opciones y los mismos costos unitarios; solo cambia la distancia. Pero el costo real del transporte NO es el mismo en las 3: el manual se paga con mano de obra (sueldos), el semiautomático usa patines y bandas que ya existen, y el automatizado exige comprar maquinaria nueva. Ese análisis, con sus propios viajes, sueldos e inversión, está en el paso 7.</p></div>`+T(['Flujo',...SC.map(s=>s.name+' (m)'),...SC.map(s=>'$ '+s.name)],FL.map(r=>[r.a+'→'+r.b,...SC.map(s=>fm(dist(s.o,r.a,r.b),1)),...SC.map(s=>fm(r.tr*r.c*dist(s.o,r.a,r.b)))]).concat([['TOTAL','','','',...SC.map(s=>'<b>'+fm(s.cost)+'</b>')]]))+expBtn('craft-costos','craft')},
 {t:'4. Patines (1,800 bl/día)',h:()=>`<div class="box"><p><b>Viajes Producción→Curado con patines hidráulicos.</b> Jornada efectiva = ${P.hrs} h × ${P.eff*100}% = ${fm(EFF(),0)} s. Ciclo = 2·d/v + maniobra (${P.hand} s) con v=${MODE.patin.v} m/s. Ocupación = viajes × ciclo ÷ jornada efectiva; patines necesarios = redondeo hacia arriba.</p>
  <div class="inl"><label>Bloques/día<input id="pB" type="number" value="${P.blocks}"></label><label>Bloques/viaje<input id="pC" type="number" value="${P.cap}"></label><label>Patines<input id="pP" type="number" value="${P.patines}"></label><label>Horas<input id="pH" type="number" value="${P.hrs}"></label><label>Maniobra s<input id="pM" type="number" value="${P.hand}"></label><button class="btn" id="pGo">Recalcular</button></div></div>`+
  T(['Concepto',...SC.map(s=>s.name)],[['Distancia H→G (m)',...SC.map(s=>fm(s.pat.d,1))],['Ciclo por viaje (s)',...SC.map(s=>fm(s.pat.cyc,1))],['Viajes totales/día',...SC.map(s=>s.pat.trips)],['Viajes por patín',...SC.map(s=>fm(s.pat.perPat,1))],['Tiempo por patín (h)',...SC.map(s=>fm(s.pat.secPat/3600,2))],['Ocupación de patines',...SC.map(s=>fm(s.pat.util,2)+' patín(es) · '+fm(s.pat.util/P.patines*100,1)+'% de la flota')],['Patines necesarios',...SC.map(s=>s.pat.need)],['Capacidad máx. (bl/día)',...SC.map(s=>fm(s.pat.maxBlocks,0))],['¿Cumple con '+P.patines+' patines?',...SC.map(s=>s.pat.ok?'<b class="ok">SÍ</b>':'<b class="bad">NO</b>')]])+expBtn('craft-patines','craft'),
  p:()=>{$('#pGo').onclick=()=>{P.blocks=+$('#pB').value||1800;P.cap=+$('#pC').value||75;P.patines=+$('#pP').value||2;P.hrs=+$('#pH').value||7;P.hand=+$('#pM').value||60;recalc();renderMethod();};}},
 {t:'5. Intercambio por pares',h:()=>`<div class="box"><p>CRAFT parte de una distribución y prueba intercambiar pares de departamentos (A, B y J fijos); acepta el intercambio que más reduce el costo hasta que ya no hay mejora.</p></div>`+T(['Opción','Inicial','Intercambios','Costo final','Ahorro'],SC.map(s=>[s.name,'$'+fm(s.cost),s.cv.sw.join(', ')||'ninguno','$'+fm(s.cv.hist[s.cv.hist.length-1])+' ('+s.cv.final.split('').join('-')+')',fm(s.cost-s.cv.hist[s.cv.hist.length-1])]))+expBtn('craft-intercambio','craft')},
 {t:'6. Resultado',h:()=>`<div class="box">${winT(tops(s=>s.cost,-1),'Menor costo CRAFT','EMPATE en costo CRAFT',t=>'$'+fm(t.cost)+' MXN/día')}</div><div class="box"><p>Este es el costo del flujo base (viajes × costo por metro × distancia). El costo real del transporte cambia con el sistema: la opción 1 se paga con mano de obra, la 2 usa equipo que ya existe y la 3 exige comprar maquinaria. El análisis completo está en el paso 7.</p></div><div class="cgrid">${cv_('c1')}${cv_('c2')}</div>`+expBtn('craft-resultado','craft'),p:()=>{bar('c1','Costo de transporte CRAFT',SC.map(s=>Math.round(s.cost)),'MXN/día');bar('c2','Ocupación de patines',SC.map(s=>+s.pat.util.toFixed(2)),'patines');}},
 {t:'7. Sistemas de transporte: manual, semiautomático y automatizado',h:()=>transporteHTML()+expBtn('craft-sistemas','craft')}]}};
const tops=(f,dir=1)=>{const v=SC.map(f),m=dir>0?Math.max(...v):Math.min(...v);return SC.filter((_,i)=>Math.abs(v[i]-m)<.005);};
const winT=(w,a,b,fn)=>w.length>1?`<p class="win">⚖ ${b}: ${w.map(s=>s.name).join(' y ')} (${fn(w[0])}).</p>`:`<p class="win">${a}: ${w[0].name} (${fn(w[0])}).</p>`;
const tieEv=ev=>{const m=Math.max(...ev.tot),w=SC.filter((_,i)=>ev.tot[i]===m);return w.length>1?`<p class="win">⚖ EMPATE en la evaluación total (${m} pts): ${w.map(s=>s.name).join(' y ')}.</p>`:`<p class="win">Mejor evaluada: ${w[0].name} (${m} pts).</p>`;};

/* ---------- Personaje guía: imágenes en imagenes/ (ver guía de imágenes y sonidos) ---------- */
const IMG={menu:'ingeniero-pixel-13-oficina.png',hub:'ingeniero-pixel-29-sola-recepcion.png',aldep:'ingeniero-pixel-35-metodo-aldep.png',corelap:'ingeniero-pixel-36-metodo-corelap.png',craft:'ingeniero-pixel-37-metodo-craft.png',galeria:'ingeniero-pixel-40-lupa.png',planos:'ingeniero-pixel-39-escribiendo-plano.png'};
const CHR=(k,t)=>`<div class="chr"><div class="chrimg"><img src="imagenes/${IMG[k]||k+'.png'}" alt="Personaje guía" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="chrph">imagenes/${IMG[k]||k+'.png'}</span></div><div class="chrtx"><span class="chrtag">GUÍA</span>${t}</div></div>`;
/* ---------- Botón Explicación: diálogo del personaje con una explicación muy corta de cada tabla/gráfica ---------- */
const EXP={
 'aldep-carta':'La carta de relaciones califica qué tan cerca debe estar cada par de áreas (A, E, I, O, U, X) y por qué.',
 'aldep-pares':'Cada renglón es un par de áreas con su vocal de cercanía, sus motivos y su puntaje.',
 'aldep-pesos':'Estos pesos convierten cada vocal en puntos: A vale mucho y X resta muchísimo.',
 'aldep-barrido':'El barrido suma los puntos de cada par de áreas vecinas en cada opción.',
 'aldep-diagrama':'Cada línea une dos áreas: más líneas, más cerca deben estar.',
 'aldep-resultado':'Gana la opción con más puntos: la que deja juntas las áreas que más se necesitan.',
 'corelap-tcr':'El TCR suma qué tan relacionada está cada área con todas las demás.',
 'corelap-orden':'Este es el orden en que CORELAP coloca las áreas en el plano, de la más conectada a la menos.',
 'corelap-puntaje':'Cada opción se califica con los pesos de CORELAP sobre sus áreas contiguas.',
 'corelap-espacios':'El diagrama muestra cada área a escala dentro del predio, con su superficie real.',
 'corelap-resultado':'Gana la opción con más puntos de cercanía según CORELAP.',
 'craft-dea':'La carta De–A muestra cuántos viajes por día van de un área a otra.',
 'craft-matriz':'La matriz resume los viajes por día entre todas las áreas.',
 'craft-distancias':'La distancia entre centroides es lo único que cambia entre una opción y otra.',
 'craft-costos':'El costo de cada flujo es viajes × costo por metro × distancia.',
 'craft-patines':'Aquí se verifica si los patines alcanzan para mover los blocks de Producción a Curado.',
 'craft-intercambio':'CRAFT prueba intercambiar áreas por pares y se queda solo con los cambios que bajan el costo.',
 'craft-resultado':'La opción con menor costo de transporte y menor ocupación de patines es la mejor.',
 'craft-sistemas':'Esta tabla compara los tres sistemas: viajes, mano de obra, inversión y tiempo. El trabajo es el mismo en los 3.',
 'gal-carta':'El triángulo muestra la vocal de cercanía de cada par de áreas.',
 'gal-carta-dibujo':'La carta de relaciones dibujada con rombos, como en el libro de Muther y Hales.',
 'gal-leyenda':'Las letras y líneas significan lo mismo en todo el SLP: A es lo más cercano y X lo no deseable.',
 'gal-dea':'La matriz De–A resume los viajes diarios entre áreas.',
 'gal-comparacion':'Estas gráficas comparan las tres opciones en cada método.',
 'gal-evaluacion':'La evaluación pondera todos los factores y da el puntaje total de cada opción.',
 'gal-diagramas':'Los diagramas de actividades muestran las relaciones entre áreas con líneas.',
 'gal-espacios':'Los diagramas de espacios muestran cada área a escala dentro del predio.',
 'gal-planos':'Los tres planos a escala, uno por opción.',
 'plan-plano':'El plano final de la opción elegida, con la entrada abajo.',
 'plan-recintos':'Cada renglón es un recinto con su área, sus cotas y su equipo.',
 'plan-departamentos':'Cada departamento con su superficie, su personal y sus vecinos.'};
const expBtn=(k,img)=>`<button class="btn expbtn" data-k="${k}">Explicación</button><div class="expbox hidden" id="exp-${k}">${CHR(img,EXP[k])}<button class="btn alt expclose">Cerrar</button></div>`;
document.addEventListener('click',e=>{const b=e.target.closest('.expbtn');if(b){const box=document.getElementById('exp-'+b.dataset.k);$$('.expbox').forEach(x=>x.classList.add('hidden'));if(box)box.classList.remove('hidden');return;}const c=e.target.closest('.expclose');if(c)c.closest('.expbox').classList.add('hidden');});
const TUTIMG=['ingeniero-pixel-21-habitacion.png','ingeniero-pixel-22-habitacion-pizarra.png','ingeniero-pixel-23-sala-juntas.png','ingeniero-pixel-29-sola-recepcion.png','ingeniero-pixel-34-iconos-ingenieria.png','ingeniero-pixel-35-metodo-aldep.png','ingeniero-pixel-36-metodo-corelap.png','ingeniero-pixel-37-metodo-craft.png'];
const SAY={
 menu:'Bienvenido al panel de trabajo. Abra los métodos para ver cada cálculo paso a paso, la galería para comparar resultados y los planos finales para descargarlos.',
 hub:'Recorra los métodos en orden: ALDEP, CORELAP y CRAFT. Las tres opciones usan las mismas áreas y los mismos costos unitarios; solo cambia la distribución de las áreas y el sistema de transporte: manual, semiautomático o automatizado.',
 aldep:['La carta de relaciones califica qué tan cerca debe estar cada par de áreas. Combina el flujo de materiales con motivos como supervisión, ruido o urgencia.','Cada contigüidad suma puntos según su vocal. Una relación X resta tanto que descarta las distribuciones que la ignoran.','El barrido recorre cada opción de la entrada al fondo y suma el peso de cada par de áreas vecinas.','El diagrama dibuja una línea por nivel de relación: más líneas significan áreas que deben estar más juntas.','Compare los puntajes: gana la opción con más relaciones importantes contiguas. Si hay empate, se indica.'],
 corelap:['El TCR suma los valores de cercanía de cada área con todas las demás. El área que más suma entra primero al plano.','Se coloca primero el área de mayor TCR y luego la que mejor se relaciona con las ya colocadas.','Cada opción se califica con los pesos de CORELAP sobre sus pares de áreas contiguas.','El diagrama de espacios muestra cada área a escala dentro del predio. La línea roja es la ruta de los patines de Producción a Curado.','Este es el resultado de CORELAP; compárelo con ALDEP y CRAFT en la galería.'],
 craft:['La carta De–A muestra los viajes por día entre áreas. El flujo de Producción a Curado sale de los bloques diarios entre los bloques que carga cada viaje.','La distancia entre centroides es lo único que cambia entre una opción y otra.','Costo = viajes × costo unitario × distancia. Los recorridos más cortos cuestan menos.','Aquí se verifica si los patines hidráulicos alcanzan para la producción diaria. Puede cambiar los datos y recalcular.','CRAFT prueba intercambiar áreas por pares y conserva solo los cambios que bajan el costo.','Resultado final: costo de transporte y ocupación de patines por opción.','Compare los tres sistemas: el manual se paga con sueldos (muchos viajes, pocos bloques), el semiautomático usa patines y bandas que ya existen (más bloques en menos viajes), y el automatizado lo hace en mucho menos tiempo pero cuesta más por la maquinaria. El mismo trabajo (1,800 bloques) se hace en los 3, a diferente tiempo y esfuerzo.'],
 gal:'Aquí están las cartas, gráficas y diagramas de las tres opciones. Si dos opciones empatan en un método, se indica expresamente.',
 plans:'Cada plano está en vista vertical con la entrada abajo. Revise la tabla de información y descargue el PDF o el Word de la opción elegida.'};
let curM='aldep',curS=0;
function renderMethod(){const m=METHODS[curM],st=m.steps[curS];$('#mTitle').textContent=m.t;
 $('#mSteps').innerHTML=m.steps.map((s,i)=>`<button class="${i===curS?'on':''}" data-i="${i}">${s.t}</button>`).join('');$$('#mSteps button').forEach(b=>b.onclick=()=>{curS=+b.dataset.i;renderMethod();});
 $('#mBody').innerHTML=CHR(curM,SAY[curM][curS])+`<h3>${st.t}</h3>`+st.h();$('#progI').style.width=((curS+1)/m.steps.length*100)+'%';st.p&&st.p();$('#mPrev').classList.toggle('hidden',curS===0);$('#mNext').textContent=curS===m.steps.length-1?'Finalizar ✓':'Siguiente paso ›';}
$('#mPrev').onclick=()=>{curS--;renderMethod();window.scrollTo(0,0);};
$('#mNext').onclick=()=>{if(curS<METHODS[curM].steps.length-1){curS++;renderMethod();window.scrollTo(0,0);}else go('hub',false);};

/* ================= GALERÍA ================= */
function renderGal(){const ev=evaluation();
 const relM='<div class="scroll"><table><tr><th></th>'+[...IDS].map(k=>`<th>${k}</th>`).join('')+'</tr>'+[...IDS].map((a,i)=>`<tr><th>${a}</th>`+[...IDS].map((b,j)=>j<=i?'<td></td>':`<td style="background:${VC[rel(a,b)]}33">${ltr(rel(a,b))}</td>`).join('')+'</tr>').join('')+'</table></div>';
 const ft='<div class="scroll"><table><tr><th>De \\ A</th>'+[...IDS].map(k=>`<th>${k}</th>`).join('')+'</tr>'+[...IDS].map(a=>`<tr><th>${a}</th>`+[...IDS].map(b=>{const f=FL.find(r=>r.a===a&&r.b===b);return`<td>${f?f.tr:''}</td>`;}).join('')+'</tr>').join('')+'</table></div>';
 $('#galBody').innerHTML=CHR('galeria',SAY.gal)+`<h3>Carta de relaciones (SLP)</h3><div class="box">Triángulo de la carta de actividades con la vocal de cercanía de cada par.</div>${relM}${expBtn('gal-carta','galeria')}<div class="scroll"><canvas id="grc" width="640" height="560"></canvas></div>${expBtn('gal-carta-dibujo','galeria')}${legendHTML()}${freqHTML()}${expBtn('gal-leyenda','galeria')}
 <h3>Carta De–A (viajes por día)</h3>${ft}${expBtn('gal-dea','galeria')}
 <h3>Comparación de métodos</h3><div class="box">${winT(tops(s=>s.al),'Mejor ALDEP','EMPATE en ALDEP',t=>t.al+' pts')}${winT(tops(s=>s.co),'Mejor CORELAP','EMPATE en CORELAP',t=>t.co+' pts')}${winT(tops(s=>s.cost,-1),'Menor costo CRAFT','EMPATE en costo CRAFT',t=>'$'+fm(t.cost)+' MXN/día')}</div><div class="cgrid">${['g1','g2','g3','g4','g5','g6'].map(i=>cv_(i)).join('')}</div>${expBtn('gal-comparacion','galeria')}
 <h3>Evaluación de alternativas (SLP: factores ponderados)</h3><div class="box">Cada factor se califica con vocales (A=4…U=0) y se multiplica por su peso.</div>`+T(['Factor','Peso',...SC.map(s=>s.name)],ev.rows.map(r=>[r[0],r[1],...r[2].map(ltr)]).concat([['TOTAL (máx. '+ev.max+')','',...ev.tot.map((t,i)=>`<b class="${t===Math.max(...ev.tot)?'win':''}">${t}</b>`)]]))+expBtn('gal-evaluacion','galeria')+
 `${tieEv(ev)}<h3>Transporte: manual, semiautomático y automatizado</h3><div class="box"><p>El costo del transporte NO es el mismo en las 3 opciones. La manual exige <b>${fm(SC[0].man.tot,0)} viajes al día con carretilla</b> (${fm(SC[0].man.hh,1)} horas-hombre, $${fm(SC[0].man.hh*WAGE_H,0)} al día de mano de obra); la semiautomática mueve la misma producción con <b>${SC[1].pat.trips} viajes de patín</b> ($${fm(SC[1].pat.sec/3600*WAGE_H,0)} al día) y 3 bandas que ya existen; la automatizada mueve los 1,800 bloques en flujo continuo pero exige inversión nueva en bandas, apiladora y montacargas ($${fm(AUTO.inv,0)} en el ejemplo). La opción 1 empata en inversión ($0), pero se lleva mucho más tiempo; la 3 es la más rápida, pero la maquinaria no vale la pena para los mismos 1,800 bloques. La semiautomática equilibra mejor productividad, inversión y esfuerzo. Análisis completo en CRAFT, paso 7.</p></div><h3>Diagramas de relación de actividades</h3><div class="cgrid">${SC.map(s=>cv_('ga'+s.id,380,380)).join('')}</div>${expBtn('gal-diagramas','galeria')}<h3>Diagramas de relación de espacios (Muther, fig. 8-2)</h3><div class="cgrid">${SC.map(s=>cv_('gs'+s.id,640,640)).join('')}</div>${expBtn('gal-espacios','galeria')}<h3>Planos a escala</h3><div class="row">${SC.map(s=>cv_('gp'+s.id,100,100)).join('')}</div>${expBtn('gal-planos','galeria')}`;
 bar('g1','Costo CRAFT',SC.map(s=>Math.round(s.cost)),'MXN/día');bar('g2','Puntaje ALDEP',SC.map(s=>s.al),'pts');bar('g3','Puntaje CORELAP',SC.map(s=>s.co),'pts');bar('g4','Ocupación de patines',SC.map(s=>+s.pat.util.toFixed(2)),'patines');bar('g5','Evaluación total ponderada',ev.tot,'pts');bar('g6','Espacio de maniobra en producción',SC.map(s=>s.ar.H),'m²');
 SC.forEach(s=>{drawARD($('#ga'+s.id),s);drawPlan($('#gp'+s.id),s,5,true);drawSRD($('#gs'+s.id),s);});drawRelChart($('#grc'));addDL();}

/* ================= PLANOS FINALES ================= */
let curP=1;
function renderPlans(){const s=SC[curP],ev=evaluation(),mx=Math.max(...ev.tot);
 $('#planTabs').innerHTML=SC.map((q,i)=>`<button class="${i===curP?'on':''}" data-i="${i}">${q.name}${ev.tot[i]===mx?' ★':''}</button>`).join('');$$('#planTabs button').forEach(b=>b.onclick=()=>{curP=+b.dataset.i;renderPlans();});
 const chk=[['Mismas áreas en las 3 opciones: '+fm(IDS.split('').reduce((t,k)=>t+DEP[k].a,0))+' m²',true],['Mismos costos unitarios en el flujo base (la distancia es la única variable)',true],[`Viajes de patín × ${P.cap} bl = ${fm(s.pat.trips*P.cap,0)} ≥ ${fm(P.blocks,0)} bl/día`,s.pat.trips*P.cap>=P.blocks],[`Patines necesarios ${s.pat.need} ≤ ${P.patines} disponibles (ocupación ${fm(s.pat.util/P.patines*100,1)}%)`,s.pat.ok],[`Largo del plano ${fm(s.len,1)} m vs predio 141.50 m`,s.len<=141.5+.01],[`Admin–Producción a ${fm(dist(s.o,'B','H'),1)} m (relación X)`,dist(s.o,'B','H')>=60]];
 $('#planBody').innerHTML=CHR('planos',SAY.plans)+`<div class="tip"><b>${s.name}:</b> ${s.tag}. ${ev.tot[curP]===mx?`<span class="win">${ev.tot.filter(t=>t===mx).length>1?'Empatada como mejor evaluada (SLP).':'Mejor evaluada (SLP).'}</span>`:''}</div>
 <div class="row"><button class="btn" id="bPdf">⬇ Descargar PDF</button><button class="btn alt" id="bDoc">⬇ Descargar Word</button></div>
 <div class="scroll"><canvas id="planCv"></canvas></div>${expBtn('plan-plano','planos')}
 <h3>Tabla de información por recinto</h3>${T(['Cód.','Recinto','Departamento','m²','Cotas (m)','Equipo'],roomRows(s))}${expBtn('plan-recintos','planos')}
 <h3>Departamentos, personal y colindancias</h3>${T(['Dep.','Departamento','m²','Personal','Colinda con'],deptRows(s))}${expBtn('plan-departamentos','planos')}
 <h3>Reacomodos propuestos</h3><div class="box">${s.moves.map(m=>`<p>• ${m}</p>`).join('')}</div>
 <h3>Comprobaciones</h3><div class="box">${chk.map(c=>`<p class="${c[1]?'ok':'bad'}">${c[1]?'✔':'✘'} ${c[0]}</p>`).join('')}</div>`;
 drawPlan($('#planCv'),s,14);$('#bPdf').onclick=()=>{Aud.sfx('down');pdfPlan(s);};$('#bDoc').onclick=()=>{Aud.sfx('down');wordPlan(s);};}

/* ================= AUDIO (archivos opcionales en assets/audio/ + síntesis de respaldo) ================= */
/* ---------- Música: 4 temas (menú, ALDEP, CORELAP y CRAFT) ----------
   Cada tema puede ser un mp3 en assets/audio/ (menú: musica.mp3, aldep.mp3,
   corelap.mp3, craft.mp3); si el archivo no existe, la página sintetiza la
   melodía del tema con el generador de tonos. El tema cambia solo al entrar
   a cada método, y vuelve al del menú al regresar. */
const Aud=(()=>{let ctx,vol=.5,snd=true,mus=true,el=null,timer=null,on=false,curTheme='opciones';
 const F={tutorial:'assets/audio/tutorial.mp3',opciones:'assets/audio/opciones.mp3',aldep:'assets/audio/aldep.mp3',corelap:'assets/audio/corelap.mp3',craft:'assets/audio/craft.mp3',click:'assets/audio/click.mp3',intro:'assets/audio/intro.mp3',down:'assets/audio/descarga.mp3'};
 const THEMES={tutorial:{notes:[523,587,659,784,784,659,587,523],step:450,vol:.10},opciones:{notes:[262,330,392,523,392,330],step:500,vol:.10},aldep:{notes:[262,294,330,349,392,349,330,294],step:420,vol:.10},corelap:{notes:[330,392,440,523,587,523,440,392],step:400,vol:.10},craft:{notes:[392,523,392,659,523,784,659,523],step:320,vol:.11}};
 const init=()=>{if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();}ctx.resume();};
 const tone=(f,d,v)=>{if(!ctx||!snd)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(v*vol,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+d);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+d);};
 const stop=()=>{clearTimeout(timer);timer=null;if(el){el.pause();el=null;}};
 const synth=(th)=>{const t=THEMES[th]||THEMES.opciones;let i=0;(function l(){if(!on||!mus||!snd)return;tone(t.notes[i++%t.notes.length],.6,t.vol);timer=setTimeout(l,t.step);})();};
 function music(go){on=go;stop();if(!go||!mus||!snd||!ctx)return;const a=new Audio(F[curTheme]);a.loop=true;a.volume=vol*.6;el=a;a.onerror=()=>{if(el===a){el=null;synth(curTheme);}};a.play().catch(()=>{if(el===a){el=null;synth(curTheme);}});}
 function theme(name){const t=THEMES[name]?name:'opciones';if(t===curTheme)return;curTheme=t;if(on)music(true);}
 function sfx(k){if(!snd||!ctx)return;const a=new Audio(F[k]);a.volume=vol;const fb=()=>k==='click'?tone(700,.08,.2):[523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,.3,.2),i*120));a.onerror=fb;a.play().catch(fb);}
 function note(i){const sc=[523,587,659,784,880,1047,1175,1319];tone(sc[i%sc.length],.3,.15);}
 return{init,music,sfx,note,theme,set(o){if('vol'in o){vol=o.vol;if(el)el.volume=vol*.6;}if('snd'in o)snd=o.snd;if('mus'in o)mus=o.mus;music(on);}};})();
const syncAud=()=>{$('#volTxt').textContent=$('#vol').value+'%';Aud.set({vol:$('#vol').value/100,snd:$('#sndOn').checked,mus:$('#musOn').checked});};
['vol','sndOn','musOn'].forEach(i=>$('#'+i).oninput=syncAud);
$('#btnSet').onclick=()=>$('#settings').classList.toggle('hidden');$('#setClose').onclick=()=>$('#settings').classList.add('hidden');
document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('#settings'))Aud.sfx('click');});

/* ================= VIDEO EN BUCLE DEL MENÚ + VIDEOS EXPLICATIVOS (carpeta videos/) ================= */
function menuVideo(){const bg=$('#bgVideo');if(!bg)return;bg.muted=true;const p=bg.play();if(p&&p.catch)p.catch(()=>{});}
const VIDS=[
 {f:'01-compra-materia-prima.mp4',t:'Compra y recepción de materia prima',d:'Cotización, compra y recepción de cemento, arena, grava y agua.'},
 {f:'02-almacenamiento-materiales.mp4',t:'Almacenamiento de materiales',d:'Resguardo y control de inventario de los insumos.'},
 {f:'03-dosificacion.mp4',t:'Dosificación y pesado',d:'Medición de las proporciones de cada material para la mezcla.'},
 {f:'04-mezclado.mp4',t:'Mezclado',d:'Preparación de la mezcla de concreto en la revolvedora.'},
 {f:'05-produccion-moldeo.mp4',t:'Producción: moldeo y vibrocompactado',d:'Llenado de moldes y formado de los blocks en la máquina.'},
 {f:'06-desmoldeo-traslado.mp4',t:'Desmoldeo y traslado de piezas frescas',d:'Retiro de las piezas y traslado al área de curado.'},
 {f:'07-curado.mp4',t:'Curado',d:'Proceso de curado para que el block alcance su resistencia.'},
 {f:'08-secado-estiba.mp4',t:'Secado y estiba',d:'Secado de las piezas y acomodo en tarimas.'},
 {f:'09-control-calidad.mp4',t:'Control de calidad',d:'Inspección y pruebas de resistencia del producto.'},
 {f:'10-almacen-producto-terminado.mp4',t:'Almacén de producto terminado',d:'Resguardo y control del producto listo para venta.'},
 {f:'11-venta-entrega.mp4',t:'Venta y entrega',d:'Cotización, venta, carga y entrega al cliente.'}
];
let vidI=0;
const VEXT=['mp4','webm','gif'];
function loadMedia(base,auto){
 const box=$('#vbox'),ph=$('#vidPh');let k=0;
 const next=()=>{
  if(k>=VEXT.length){box.querySelectorAll('video,img').forEach(x=>x.remove());ph.style.display='block';return;}
  const ext=VEXT[k++],src=`videos/${base}.${ext}`;box.querySelectorAll('video,img').forEach(x=>x.remove());ph.style.display='none';
  if(ext==='gif'){const im=document.createElement('img');im.id='vidEl';im.alt='Animación del proceso';im.onerror=next;im.src=src;box.insertBefore(im,ph);}
  else{const v=document.createElement('video');v.id='vidEl';v.controls=true;v.playsInline=true;v.preload='auto';v.onerror=next;v.src=src;box.insertBefore(v,ph);if(auto){const p=v.play();if(p&&p.catch)p.catch(()=>{v.muted=true;const q=v.play();if(q&&q.catch)q.catch(()=>{});});}}
 };
 next();
}
function renderVid(auto){
 $('#vidList').innerHTML=VIDS.map((v,i)=>`<button class="vitem${i===vidI?' on':''}" data-i="${i}"><b>${String(i+1).padStart(2,'0')}</b><span>${v.t}</span></button>`).join('');
 const v=VIDS[vidI],base=v.f.replace(/\.[^.]+$/,'');
 $('#vidPlayer').innerHTML=`<h3>Paso ${vidI+1}: ${v.t}</h3><p>${v.d}</p><div class="vbox" id="vbox"><div class="vfsctl"><button type="button" id="vfBack">✕ Regresar</button><span><button type="button" id="vfPrev">‹ Anterior</button><button type="button" id="vfNext">Siguiente ›</button></span></div><div class="vph" id="vidPh">Video o GIF pendiente: <code>videos/${base}.mp4</code> (también .webm o .gif)</div></div><div class="row"><button class="btn alt" id="vPrev">‹ Anterior</button><button class="btn" id="vNext">Siguiente ›</button><button class="btn blue" id="vFs">⛶ Pantalla completa</button></div>`;
 loadMedia(base,auto);
 const inFs=()=>{const b=$('#vbox');return !!(document.fullscreenElement||document.webkitFullscreenElement||(b&&b.classList.contains('vfake')));};
 const goVid=n=>{vidI=(n+VIDS.length)%VIDS.length;if(!inFs()){renderVid(true);return;}
  const w=VIDS[vidI];$$('#vidList .vitem').forEach((x,k)=>x.classList.toggle('on',k===vidI));
  $('#vidPlayer h3').textContent=`Paso ${vidI+1}: ${w.t}`;$('#vidPlayer p').textContent=w.d;loadMedia(w.f.replace(/\.[^.]+$/,''),true);};
 const exitFs=()=>{const b=$('#vbox');b.classList.remove('vfake');const ex=document.exitFullscreen||document.webkitExitFullscreen;if(document.fullscreenElement||document.webkitFullscreenElement){try{const p=ex.call(document);if(p&&p.catch)p.catch(()=>{});}catch(e){}}try{screen.orientation&&screen.orientation.unlock&&screen.orientation.unlock();}catch(e){}};
 $$('#vidList .vitem').forEach(b=>b.onclick=()=>{goVid(+b.dataset.i);});
 $('#vPrev').onclick=$('#vfPrev').onclick=()=>goVid(vidI-1);
 $('#vNext').onclick=$('#vfNext').onclick=()=>goVid(vidI+1);
 $('#vfBack').onclick=exitFs;
 $('#vFs').onclick=()=>{const bx=$('#vbox'),rq=bx.requestFullscreen||bx.webkitRequestFullscreen;const lock=()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{});}catch(e){}};if(rq){const p=rq.call(bx);if(p&&p.then)p.then(lock).catch(()=>{bx.classList.add('vfake');lock();});else lock();}else{bx.classList.add('vfake');lock();}};
}

/* ================= NAVEGACIÓN ================= */
const stack=[];let cur='home';
function go(v,push=true){const pv=$('#vidEl');if(pv&&pv.pause)pv.pause();const bgv=$('#bgVideo');if(bgv)bgv.pause();if(push&&cur)stack.push(cur);$$('.view').forEach(e=>e.classList.remove('active'));$('#v-'+v).classList.add('active');cur=v;
 $('#topbar').classList.toggle('hidden',['home','intro','tut'].includes(v));$('#btnBack').classList.toggle('hidden',v==='menu');$('#settings').classList.add('hidden');window.scrollTo(0,0);
 if(v==='menu'){$('#chMenu').innerHTML=CHR('menu',SAY.menu);menuVideo();}if(v==='hub')$('#chHub').innerHTML=CHR('hub',SAY.hub);if(v==='gal')renderGal();if(v==='plans')renderPlans();if(v==='vid')renderVid();if(v==='method'){curS=0;renderMethod();}if(v==='tut')Aud.theme('tutorial');if(v==='menu'||v==='hub'||v==='gal'||v==='plans'||v==='vid')Aud.theme('opciones');if(v==='method')Aud.theme(curM);}
$('#btnBack').onclick=()=>{let p=stack.pop()||'menu';if(p==='intro'||p==='tut'||p==='home')p='menu';go(p,false);};
$('#cMet').onclick=()=>go('hub');$('#cVid').onclick=()=>go('vid');$('#cGal').onclick=()=>go('gal');$('#cPlans').onclick=()=>go('plans');
$$('#v-hub .card').forEach(c=>c.onclick=()=>{curM=c.dataset.m;go('method');});

let introTimers=[];
/* ================= INTRO: construcciones de blocks, letras ALPHA BLOCKS cayendo una por una y EQUIPO CACAHUATE ================= */
/* ---------- Pantalla completa (opción al inicio y en Ajustes) ---------- */
const FS=(()=>{const d=document,el=d.documentElement,rq=el.requestFullscreen||el.webkitRequestFullscreen,ex=d.exitFullscreen||d.webkitExitFullscreen;
 const ok=!!rq,is=()=>!!(d.fullscreenElement||d.webkitFullscreenElement);
 const on=()=>{if(!ok||is())return;try{const p=rq.call(el,{navigationUI:'hide'});if(p&&p.catch)p.catch(()=>{});}catch(e){}};
 const off=()=>{if(!is())return;try{const p=ex.call(d);if(p&&p.catch)p.catch(()=>{});}catch(e){}};
 const upd=()=>{const f=is();const b=$('#fsBtn');if(b)b.textContent=f?'✕ Salir de pantalla completa':'⛶ Pantalla completa';['#fsTop','#fsFloat'].forEach(i=>{const e=$(i);if(e){e.textContent=f?'✕':'⛶';e.title=e.ariaLabel=f?'Salir de pantalla completa':'Pantalla completa';}});['#fsTop','#fsFloat'].forEach(i=>$(i)&&$(i).classList.toggle('on',f));};
 d.addEventListener('fullscreenchange',upd);d.addEventListener('webkitfullscreenchange',upd);
 return{ok,is,on,off,toggle(){is()?off():on();}};})();
(function(){
 if(!FS.ok){const c=$('#startFs');c.checked=false;c.disabled=true;$('#startFsLbl').classList.add('off');$('#fsBtn').classList.add('hidden');
  $('#startHint').textContent='En iPhone: toque Compartir › «Añadir a pantalla de inicio» para verlo a pantalla completa';}
 $('#fsBtn').onclick=()=>FS.toggle();
 ['#fsTop','#fsFloat'].forEach(i=>{const e=$(i);e.onclick=()=>FS.toggle();if(!FS.ok)e.classList.add('hidden');});})();
$('#btnStart').onclick=()=>{
 const snd=$('#startSnd').checked;$('#sndOn').checked=snd;$('#musOn').checked=snd;
 if($('#startFs').checked)FS.on();
 Aud.init();syncAud();go('intro');Aud.sfx('intro');startIntro();};
function startIntro(){
 introTimers.forEach(clearTimeout);introTimers=[];
 if(cur!=='intro')return;
 const bg=$('#skyline-bg'),stage=$('#stage'),title=$('#title'),sub=$('#subtitle');
 bg.innerHTML='';title.innerHTML='';sub.classList.remove('visible');sub.classList.add('hidden');stage.classList.remove('fly-forward');bg.classList.remove('fade-out');
 const later=(fn,ms)=>{const id=setTimeout(()=>{if(cur==='intro')fn();},ms);introTimers.push(id);};
 /* 1. Estructuras de blocks en el fondo (se levantan hilera por hilera) */
 const cfg=[{left:'2%',cols:4,rows:14},{left:'16%',cols:3,rows:9},{left:'28%',cols:5,rows:18},{left:'47%',cols:4,rows:11},{left:'63%',cols:5,rows:16},{left:'81%',cols:4,rows:12},{left:'92%',cols:3,rows:8}];
 const blocks=[];
 cfg.forEach(st=>{const g=document.createElement('div');g.className='structure-group';g.style.left=st.left;
  for(let r=0;r<st.rows;r++){const row=document.createElement('div');row.className='block-row';if(r%2===1)row.style.marginLeft='14px';
   for(let c=0;c<st.cols;c++){const b=document.createElement('div');b.className='concrete-block';row.appendChild(b);blocks.push({el:b,level:r});}
   g.appendChild(row);}
  bg.appendChild(g);});
 blocks.sort((a,b)=>a.level-b.level);
 /* 2. Una letra por contenedor (para que caigan de una en una) */
 const text='ALPHA BLOCKS',wraps=[];
 [...text].forEach(ch=>{const w=document.createElement('span');w.className='letter-wrapper';
  if(ch===' '){w.classList.add('space');w.innerHTML='&nbsp;';}
  else{const f=document.createElement('span');f.className='letter-face';f.textContent=ch;w.appendChild(f);wraps.push(w);}
  title.appendChild(w);});
 /* 3. Caída secuencial (1 letra a la vez, con nota) + levantamiento de blocks */
 const D0=200,STEP=220,DROP=300,total=(wraps.length-1)*STEP+DROP,bstep=total/blocks.length;
 wraps.forEach((w,i)=>later(()=>{w.classList.add('drop');Aud.note(i);},D0+i*STEP));
 blocks.forEach((b,i)=>later(()=>b.el.classList.add('built'),D0+i*bstep));
 /* 4. EQUIPO CACAHUATE con destello de luz al terminar la última letra */
 const subT=D0+total+120;
 later(()=>{sub.classList.remove('hidden');sub.classList.add('visible');},subT);
 /* 5. Salida: las letras avanzan hacia el frente y todo desaparece, luego el tutorial */
 const exitT=subT+1500;
 later(()=>{stage.classList.add('fly-forward');bg.classList.add('fade-out');},exitT);
 later(()=>startTut(),exitT+900);
}
$('#introSkip').onclick=()=>{introTimers.forEach(clearTimeout);introTimers=[];startTut();};

/* ================= TUTORIAL ================= */
const TUT=[
 {t:'¿Qué es la Ingeniería Industrial?',x:'La <b>Ingeniería Industrial</b> diseña, mejora e integra sistemas formados por personas, materiales, equipos, energía e información. Su meta es producir más y mejor con menos recursos, cuidando la calidad, el costo, la seguridad y el tiempo de entrega.'},
 {t:'Sus funciones principales',x:'Planeación y <b>distribución de instalaciones</b>, estudio de métodos y tiempos, control de calidad, logística y manejo de materiales, planeación y control de la producción, seguridad e higiene, y evaluación de costos. Hoy trabajaremos la primera: la distribución de planta.'},
 {t:'El tema principal: el layout de ALPHA BLOCKS',x:'Explicaremos el <b>layout de la empresa ALPHA BLOCKS</b>, fabricante de blocks de concreto en un predio de 141.50 × 26 m. Nos basamos en el libro <i>Systematic Layout Planning</i> de Muther y Hales, pero lo más importante es aplicar los métodos <b>ALDEP, CORELAP y CRAFT</b> y comparar tres opciones de distribución.'},
 {t:'Las áreas de la planta',x:'La planta se organiza en 10 áreas: <b>frente y acceso, edificio principal, soporte logístico, producto terminado, flujo y producto defectuoso, laboratorio, curado, producción, materia prima y patio de maniobras</b>. Cada una cumple una función en el recorrido del material, desde que entran los agregados hasta que salen los blocks terminados.'},
 {t:'Base: SLP de Muther y Hales',x:'El <b>Systematic Layout Planning</b> analiza flujos y relaciones entre actividades (cartas De–A y de relaciones con A, E, I, O, U, X), dibuja diagramas de relaciones y de espacios y evalúa alternativas con factores ponderados. Las tres opciones usan las mismas áreas y los mismos costos.'},
 {t:'ALDEP',x:'<b>ALDEP</b> (Automated Layout Design Program) recorre el plano en un barrido y suma puntos por cada par de áreas contiguas según su relación. A suma muchísimo; X resta mucho. Gana la opción con mayor puntaje.'},
 {t:'CORELAP',x:'<b>CORELAP</b> calcula el TCR (Total Closeness Rating) de cada área y las coloca empezando por la más conectada. Luego califica la cercanía con pesos A=6 … X=1 y muestra el diagrama de espacios.'},
 {t:'CRAFT',x:'<b>CRAFT</b> usa viajes por día, costo por metro y distancias entre centroides para obtener el costo de transporte. Además intercambia áreas por pares para buscar mejoras.'}];
let ti=0;
function startTut(){ti=0;go('tut');Aud.music(true);drawTut();}
const TUTCLS=['tut-in-next','tut-in-prev','tut-out-next','tut-out-prev'];
function tutAnim(cls){['#v-tut .imgframe','#v-tut .dialog2'].forEach(s=>{const e=$(s);if(!e||!e.classList)return;e.classList.remove(...TUTCLS);void e.offsetWidth;e.classList.add(cls);});}
function drawTut(anim){const s=TUT[ti],im=$('#tutImg'),ph=$('#imgPh'),p=`imagenes/${TUTIMG[ti]}`;$('#tutTitle').textContent=s.t;$('#tutText').innerHTML=s.x;$('#imgPath').textContent=p;
 im.style.display='none';ph.style.display='block';im.onload=()=>{im.style.display='block';ph.style.display='none';};im.onerror=()=>{im.style.display='none';ph.style.display='block';};im.src=p;
 $('#dots').innerHTML=TUT.map((_,i)=>`<i class="${i<=ti?'on':''}"></i>`).join('');$('#tutPrev').style.visibility=ti?'visible':'hidden';$('#tutNext').textContent=ti===TUT.length-1?'Ir al menú ›':'Siguiente ›';tutAnim(anim||'tut-in-next');}
function tutGo(d){tutAnim(d>0?'tut-out-next':'tut-out-prev');setTimeout(()=>{ti+=d;drawTut(d>0?'tut-in-next':'tut-in-prev');},450);}
$('#tutNext').onclick=()=>{if(ti<TUT.length-1){tutGo(1);}else go('menu',false);};
$('#tutPrev').onclick=()=>{if(ti>0){tutGo(-1);}};$('#tutSkip').onclick=()=>go('menu',false);

/* ---------- Tutorial: avisa "Desliza hacia abajo" solo cuando el contenido no cabe en la pantalla ---------- */
(function(){const hint=$('#tutHint');if(!hint)return;
 const upd=()=>{const d=document.documentElement;const need=cur==='tut'&&(d.scrollHeight-window.innerHeight>12)&&(window.scrollY+window.innerHeight<d.scrollHeight-12);hint.classList.toggle('hidden',!need);};
 window.addEventListener('scroll',upd,{passive:true});window.addEventListener('resize',upd);window.addEventListener('orientationchange',upd);
 setInterval(upd,250);})();