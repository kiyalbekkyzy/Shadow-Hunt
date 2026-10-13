const C=document.getElementById('c'),X=C.getContext('2d'),OV=document.getElementById('ov'),$=i=>document.getElementById(i);
const WW=1600,WH=960,G=20,GW=80,GH=48;let VW=960,VH=640;
const COLS=['#ff5d5d','#4dd2ff','#7dff6b','#ffd84d','#d17bff','#ff9a3d','#ffffff','#ff7bd0'];
let S={mode:'menu',msg:'',msgT:0,parts:[],texts:[],fx:[],oth:[],o:{},used:[],sdSeen:{},pid:'solo',lt:60},R=null,snd=true,AC=null,keys={},seed=1;
try{snd=localStorage.getItem('sh_snd')!=='0'}catch(e){}
const rnd=(a=0,b=1)=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return a+((t^t>>>14)>>>0)/4294967296*(b-a)};
const hyp=Math.hypot,cl=(v,a,b)=>Math.max(a,Math.min(b,v)),B=(x,y,w,h)=>({x,y,w,h}),ov=(a,b,m=0)=>a.x-m<b.x+b.w&&a.x+a.w+m>b.x&&a.y-m<b.y+b.h&&a.y+a.h+m>b.y;
const esc=s=>String(s).replace(/[<>&"]/g,'');
const BD=[B(0,0,WW,20),B(0,WH-20,WW,20),B(0,0,20,WH),B(WW-20,0,20,WH)];
const WL=[[...BD,B(400,20,20,360),B(400,560,20,380),B(800,20,20,100),B(800,260,20,360),B(800,780,20,160),B(1200,20,20,360),B(1200,540,20,400),B(420,480,200,20),B(900,300,200,20),B(1000,700,200,20)],
[...BD,B(500,20,20,180),B(500,360,20,340),B(500,860,20,80),B(1100,20,20,280),B(1100,460,20,480),B(20,700,300,20),B(1300,220,280,20),B(640,600,300,20),B(640,300,20,200)]];
const ST=[B(40,420,60,120),B(1500,420,60,120)];
// закрытые комнаты: 4 стены, на 3 стенах — двери с таймером, 4-я стена с постоянным проёмом
function mkRoom(x,y,w,h,P){const t=20,dw=64,hw=(w-dw)/2,hh=(h-dw)/2;
return{x,y,W:w,H:h,wl:[B(x,y,hw,t),B(x+hw+dw,y,hw,t),B(x,y+h-t,hw,t),B(x+hw+dw,y+h-t,hw,t),B(x+w-t,y,t,hh),B(x+w-t,y+hh+dw,t,hh),B(x,y,t,hh),B(x,y+hh+dw,t,hh)],
ds:[{x:x+hw,y,w:dw,h:t,per:P[0],ph:0},{x:x+hw,y:y+h-t,w:dw,h:t,per:P[1],ph:P[1]*.37},{x:x+w-t,y:y+hh,w:t,h:dw,per:P[2],ph:P[2]*.7}]}}
const RM=[mkRoom(900,380,200,220,[4,5,3]),mkRoom(760,80,200,220,[5,3,4])];RM.forEach((r,i)=>WL[i].push(...r.wl));
const dOpen=s=>((S.t+s.ph)%s.per)<s.per*.5;
const CN=['красный','голубой','зелёный','жёлтый','фиолетовый','оранжевый','белый','розовый'];
const rg=h=>{const n=parseInt(h.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},A)`};
const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function beep(f,d=.1,t='square',v=.05){if(!snd)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();const o=AC.createOscillator(),g=AC.createGain();o.type=t;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch(e){}}
// floors images
const FI=[0,1].map(f=>{const c=document.createElement('canvas');c.width=WW;c.height=WH;const g=c.getContext('2d');
for(let y=0;y<WH;y+=40)for(let x=0;x<WW;x+=40){g.fillStyle=f?((x+y)%80?'#8a91b6':'#7f87ad'):((x+y)%80?'#6f969f':'#658c95');g.fillRect(x,y,40,40);g.fillStyle=f?'#9aa2c8':'#82a8b1';g.fillRect(x,y,40,2);g.fillRect(x,y,2,40)}
ST.forEach(s=>{g.fillStyle='#2a2f3a';g.fillRect(s.x,s.y,s.w,s.h);g.fillStyle='#4a5468';for(let i=0;i<s.h;i+=12)g.fillRect(s.x,s.y+i,s.w,6);g.fillStyle='#ffc83d';g.font='bold 22px monospace';g.fillText(f?'▼':'▲',s.x+20,s.y+68)});return c});
// pathfinding
function bfs(s,t,blk){const prev=new Int16Array(GW*GH).fill(-2);prev[s]=-1;const q=[s];
for(let h=0;h<q.length;h++){const c=q[h];if(c===t)break;const ci=c%GW,cj=(c/GW)|0;
for(const[dx,dy]of DIRS){const ni=ci+dx,nj=cj+dy;if(ni<0||nj<0||ni>=GW||nj>=GH)continue;const n=nj*GW+ni;if(prev[n]!==-2||blk[n])continue;
if(dx&&dy&&(blk[cj*GW+ni]||blk[nj*GW+ci]))continue;prev[n]=c;q.push(n)}}return prev}
function nearest(L,x,y){const i=cl(x/G|0,0,GW-1),j=cl(y/G|0,0,GH-1);if(!L.blk[j*GW+i])return j*GW+i;
for(let r=1;r<5;r++)for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++){const ni=i+a,nj=j+b;if(ni>=0&&nj>=0&&ni<GW&&nj<GH&&!L.blk[nj*GW+ni])return nj*GW+ni}return j*GW+i}
function path(L,a,b){const s=nearest(L,a.x,a.y),t=nearest(L,b.x,b.y),pr=bfs(s,t,L.blk);if(pr[t]===-2)return[];
const out=[];for(let c=t;c!==s&&c>=0;c=pr[c])out.push({x:(c%GW)*G+10,y:((c/GW)|0)*G+10});return out.reverse()}
// generation (deterministic from seed)
function genFloor(f,n,gp){for(;;){const sol=WL[f].slice(),doors=[];if(f===0){const d={x:1420,y:0,w:70,h:20,door:1,c:8};doors.push(d);sol.push(d)}
for(let i=0;i<n;i++)if(i%2===f){const d={x:260+i*150,y:0,w:70,h:20,door:1,c:i};doors.push(d);sol.push(d)}
const L={f,covers:[],coins:[],toys:[],keys:[],doors,patrol:[],solids:sol,sd:RM[f].ds,holes:[],rags:[],clk:[]},sp=B(100,100,300,260);
const pl=(w,h,t)=>{for(let k=0;k<150;k++){const r={x:rnd(40,WW-40-w),y:rnd(60,WH-40-h),w,h,t};if(!sol.some(s=>ov(r,s,28))&&!L.sd.some(s=>ov(r,s,28))&&!ov(r,sp,20)&&!ST.some(s=>ov(r,s,40))){sol.push(r);L.covers.push(r);return}}};
for(let i=0;i<5;i++)pl(36,56,'w');for(let i=0;i<5;i++)pl(44,44,'b');
const blk=new Uint8Array(GW*GH);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const cx=i*G+10,cy=j*G+10;blk[j*GW+i]=sol.some(s=>cx>s.x-10&&cx<s.x+s.w+10&&cy>s.y-10&&cy<s.y+s.h+10)?1:0}
const pr=bfs(24*GW+3,null,blk);if([24*GW+76,...doors.map(d=>2*GW+((d.x+35)/G|0))].some(c=>pr[c]===-2))continue;
const free=[];for(let c=0;c<GW*GH;c++)if(pr[c]!==-2)free.push(c);const used=[];
const pick=(md,far)=>{for(let k=0;k<300;k++){const c=free[rnd(0,free.length)|0],p={x:(c%GW)*G+10+rnd(-4,4),y:((c/GW)|0)*G+10+rnd(-4,4)};if(used.every(u=>hyp(u.x-p.x,u.y-p.y)>md)&&(!far||hyp(p.x-70,p.y-480)>far)){used.push(p);return p}}return{x:70,y:480}};
for(let i=0;i<15;i++)L.coins.push(pick(60));for(let i=0;i<2;i++)L.toys.push(pick(80));
for(let i=0;i<n;i++)if((i+1)%2===f){const p=pick(80);p.c=i;L.keys.push(p)}
L.gs=[];for(let i=0;i<gp;i++)L.gs.push(pick(150,500));if(f===0)L.dual=pick(80);if(f===1)L.k2=pick(80);for(let i=0;i<5;i++)L.patrol.push(pick(200));
for(let i=0;i<2;i++)L.clk.push(pick(90));
for(let i=0;i<6;i++){const p=pick(70),r={x:Math.round(p.x-16),y:Math.round(p.y-11),w:32,h:22,a:rnd(-.5,.5)};if(!sol.some(s=>ov(r,s,4)))L.rags.push(r)}
if(f===1)for(let i=0;i<16&&L.holes.length<5;i++){const p=pick(90),r={x:Math.round(p.x/G)*G-20,y:Math.round(p.y/G)*G-20,w:40,h:40};if(!sol.some(s=>ov(r,s,2))&&!ST.some(s=>ov(r,s,70))&&!ov(r,sp,50))L.holes.push(r)}
L.blk=blk;return L}}
const hit=(L,x,y,r)=>L.solids.some(s=>x+r>s.x&&x-r<s.x+s.w&&y+r>s.y&&y-r<s.y+s.h)||L.sd.some(s=>!dOpen(s)&&x+r>s.x&&x-r<s.x+s.w&&y+r>s.y&&y-r<s.y+s.h);
function move(L,e,dx,dy,r){if(hit(L,e.x,e.y,r)||!hit(L,e.x+dx,e.y,r))e.x+=dx;if(hit(L,e.x,e.y,r)||!hit(L,e.x,e.y+dy,r))e.y+=dy}
function los(L,a,b){const d=hyp(b.x-a.x,b.y-a.y),n=d/8|0;for(let i=1;i<n;i++){const x=a.x+(b.x-a.x)*i/n,y=a.y+(b.y-a.y)*i/n;if(L.solids.some(s=>x>s.x&&x<s.x+s.w&&y>s.y&&y<s.y+s.h)||L.sd.some(s=>!dOpen(s)&&x>s.x&&x<s.x+s.w&&y>s.y&&y<s.y+s.h))return false}return true}
// network
const myIdx=()=>S.ros?S.ros.indexOf(S.pid):0;
function pack(){const m=S.me;return{n:m.n,x:Math.round(m.x),y:Math.round(m.y),f:m.f,h:m.hidden?1:0,s:m.st,m:m.m,tm:m.tm,sd:m.sd,sx:Math.round(m.sx||0),sy:Math.round(m.sy||0),sf:m.sf||0,ph:m.ph,go:m.go||null,r:m.r||null,lt:m.lt==null?null:m.lt,g:m.g||null,d:m.du?1:0,cn:m.cn||0,e:m.e||null,cb:m.cb||null}}
function net(){let ps=R?R.peers():[];const me=ps.find(p=>p.isMe&&p.sameTab);S.pid=me?me.peer:'solo';S.oth=ps.filter(p=>!(p.isMe&&p.sameTab)&&p.presence&&p.presence.n);
if(S.mode==='lobby')lobbyTick();if(R)R.presence(pack()).catch(()=>{})}
setInterval(()=>{if(S.me)net()},80);
function lobbyTick(){const m=S.me,L=S.oth.filter(p=>p.presence.ph==='l').map(p=>({pid:p.peer,n:p.presence.n,lt:p.presence.lt}));
const all=[{pid:S.pid,n:m.n},...L].sort((a,b)=>a.pid<b.pid?-1:1),host=all[0].pid===S.pid;
if(host){S.lt=Math.max(0,S.lt-.08);m.lt=Math.ceil(S.lt)}else{m.lt=null;const h=L.find(p=>p.pid===all[0].pid);if(h&&h.lt!=null)S.lt=h.lt}
const g=S.oth.filter(p=>p.presence.go&&!S.used.includes(p.presence.go)).sort((a,b)=>a.presence.go-b.presence.go)[0];
if(g){const r=g.presence.r||[];if(r.includes(S.pid)){startGame(g.presence.go,r);return}S.used.push(g.presence.go);S.wait=1}
if(host&&S.lt<=0&&all.length>0){beginRound();return}
if($('pl')){$('pl').innerHTML=all.map((p,i)=>`<span class="pl"><span class="dot" style="background:${COLS[i%8]}"></span>${esc(p.n)}${p.pid===S.pid?' (ты)':''}</span>`).join('');$('lt').textContent=S.wait?'Раунд уже идёт — дождись конца':`Старт через ${Math.ceil(S.lt)} c · игроков: ${all.length}`}}
async function connect(code){if(window.ShadowNet)return ShadowNet.connect(code);const rm=await claude.use('room');return rm?await rm.join('sh-'+code):null}
async function online(solo){const n=($('nm').value||'Игрок').slice(0,12),code=($('cd').value||'room1').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,20)||'room1';
S.me={n,x:0,y:0,f:0,st:'r',m:0,tm:0,sd:0,ph:'l',hidden:0};R=null;
if(!solo&&window.ShadowNet)OV.innerHTML='<div><h1>ПОДКЛЮЧЕНИЕ…</h1><p>Сервер на бесплатном хостинге может просыпаться до минуты — подожди, не закрывай вкладку.</p></div>';
if(!solo){try{R=await connect(code)}catch(e){R=null}}
if(!solo&&!R)S.noNet=1;enterLobby()}
function enterLobby(){S.mode='lobby';S.lt=60;S.wait=0;const m=S.me;m.ph='l';m.go=null;m.r=null;m.st='r';m.g=null;
OV.className='';OV.innerHTML=`<div><h1>ЛОББИ</h1><p>${R?'Скажи друзьям код комнаты — пусть введут тот же':'Одиночный режим (онлайн недоступен)'}</p><p id="lt"></p><div id="pl"></div><button onclick="beginRound()">Начать игру сейчас</button></div>`;net()}
function beginRound(){if(S.mode!=='lobby')return;const sd=1+Math.floor(Math.random()*2e9);const ros=[S.pid,...S.oth.filter(p=>p.presence.ph==='l').map(p=>p.peer)].sort();S.me.go=sd;S.me.r=ros;startGame(sd,ros)}
// game start
function startGame(sd,ros){S.used.push(sd);S.seed=sd;S.ros=ros;S.n=ros.length;S.idx=Math.max(0,ros.indexOf(S.pid));seed=sd;S.gpf=S.n<2?1:S.n<4?2:3;S.fl=[genFloor(0,S.n,S.gpf),genFloor(1,S.n,S.gpf)];
S.NEED=cl((30/S.n)|0,2,6);S.cneed=Math.max(1,Math.round(S.n*.3));S.cg=new Set();S.bn=null;S.shake=0;S.gs=S.fl.flatMap(L=>L.gs.map((p,k)=>({f:L.f,x:p.x,y:p.y,a:0,st:'PATROL',pi:(k*2)%5,wait:0,rp:0,path:null,lost:0,last:{x:p.x,y:p.y},tgt:null,alert:0,seen:false,ph:0})));
S.gd=S.gs.map(g=>({f:g.f,x:g.x,y:g.y,a:0,st:'PATROL'}));const m=S.me,i=S.idx;
Object.assign(m,{x:140+(i%4)*60,y:160+(i>>2)*60,f:0,ph:'p',st:'r',m:0,tm:0,sd:0,k:0,cn:0,toy:0,du:0,k2:0,e:null,cb:null,hid:null,hidden:0,pf:{x:1,y:0},phs:0,rv:0,lost:0,inv:0,boost:0,slip:0,slipCd:0,hidT:0,hcd:0});
S.sdSeen={};S.oth.forEach(p=>S.sdSeen[p.peer]=p.presence.sd||0);S.t=0;S.parts=[];S.texts=[];S.fx=[];S.o={};S.onSt=true;S.mode='play';OV.className='h';banner('🏃 ТЫ — БЕГЛЕЦ ('+CN[S.idx%8]+')','Найди ключ своего цвета, собери монеты и беги к своей двери.\nПоймает полицейский — станешь полицейским и должен будешь поймать '+S.cneed+' бегл., чтобы вернуться (1 раз!).','#ffc83d',5,1);say(`Ты — ${CN[S.idx%8]}. Ключ: этаж ${(S.idx+1)%2+1}, дверь: этаж ${S.idx%2+1}. Стрелка у героя показывает цель. Монет нужно: ${S.NEED}`,9)}
function skipBn(){if(!S.bn)return false;if(S.bn.go==null)S.bn.go=1;return true}
function say(t,d){S.msg=t;S.msgT=d||3}
function burst(x,y,c,n=10){for(let i=0;i<n;i++)S.parts.push({x,y,vx:(Math.random()-.5)*160,vy:(Math.random()-.5)*160,t:.5,c})}
function endRound(){S.mode='end';const m=S.me;
const rows=[{pid:S.pid,n:m.n,i:S.idx,s:m.st,cn:m.cn||0,e:m.e,cb:m.cb,d:m.du,me:1},...S.oth.filter(p=>S.ros.includes(p.peer)&&p.presence.ph==='p').map(p=>({pid:p.peer,n:p.presence.n,i:S.ros.indexOf(p.peer),s:p.presence.s,cn:p.presence.cn||0,e:p.presence.e,cb:p.presence.cb,d:p.presence.d}))];
rows.forEach(r=>r.ct=rows.filter(x=>x.cb===r.pid).length);
const win=rows.filter(r=>r.s==='o').sort((a,b)=>a.e-b.e),lose=rows.filter(r=>r.s!=='o').sort((a,b)=>b.ct-a.ct),me=rows[0],won=me.s==='o',med=['🥇','🥈','🥉'];
const card=(r,k,w)=>`<div class="row ${r.me?'me':''}" style="border-color:${COLS[r.i%8]}"><span><span class="dot" style="background:${COLS[r.i%8]}${r.d?`;box-shadow:7px 0 0 ${COLS[(r.i+4)%8]}`:''}"></span><b>${w?med[k]||'🏁':'🚔'} ${esc(r.n)}${r.me?' (ты)':''}</b></span><span>${w?`сбежал за ${r.e} c`:`поймал: ${r.ct}`} · 🪙 ${r.cn}${r.d?' · ⭐ двойной ключ':''}</span></div>`;
OV.className='';OV.innerHTML=`<div class="end"><h1 style="color:${won?'#7dff6b':'#ff5d6c'}">${won?'🏆 ПОБЕДА!':win.length?'💀 ТЫ ПРОИГРАЛ':'🚔 ПОЛИЦИЯ ПОБЕДИЛА'}</h1><p>${won?'Ты выбрался из тьмы!':me.s==='c'?'Тебя поймали'+(me.ct?', но ты успел поймать друзей: '+me.ct:''):''}</p>${win.length?'<h3>СБЕЖАЛИ</h3>'+win.map((r,k)=>card(r,k,1)).join(''):'<h3>НИКТО НЕ ВЫБРАЛСЯ</h3>'}${lose.length?'<h3>ПОЛИЦИЯ</h3>'+lose.map((r,k)=>card(r,k,0)).join(''):''}<button onclick="enterLobby()">В лобби</button></div>`;beep(won?800:150,.4);if(won)setTimeout(()=>beep(1100,.3),200)}
// input
addEventListener('keydown',e=>{const c=e.code;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(c)&&S.mode==='play')e.preventDefault();if(e.repeat)return;keys[c]=1;
if(c==='KeyM'&&document.activeElement.tagName!=='INPUT'){snd=!snd;try{localStorage.setItem('sh_snd',snd?'1':'0')}catch(e){}say(snd?'Звук: вкл':'Звук: выкл')}
if(S.mode!=='play')return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE','KeyQ','Space'].includes(c)&&skipBn())return;if(c==='KeyE')interact();if(c==='KeyQ')throwToy()});
addEventListener('keyup',e=>{keys[e.code]=0});

// ---- mobile / touch controls ----
const IS_MOB=(()=>{const q=new URLSearchParams(location.search).get('mobile');return q==='1'?1:q==='0'?0:(matchMedia('(hover:none) and (pointer:coarse)').matches?1:0)})();
document.body.classList.toggle('mobile',!!IS_MOB);
const mobile=()=>IS_MOB===1;
const joy={on:0,id:null,x:0,y:0,mag:0,ox:0,oy:0},JR=56;
const ST_=$('stage'),JB=$('jb'),JK=$('jk');
function joyOff(){joy.on=0;joy.id=null;joy.x=joy.y=joy.mag=0;JB.classList.remove('on');JB.style.left=JB.style.top='';JK.style.transform='translate(0,0)'}
function joyMove(e){const dx=e.clientX-joy.ox,dy=e.clientY-joy.oy,d=hyp(dx,dy),k=d>JR?JR/d:1;JK.style.transform=`translate(${dx*k}px,${dy*k}px)`;const mg=Math.min(1,d/JR);if(mg<.18){joy.x=joy.y=joy.mag=0}else{joy.x=dx/d;joy.y=dy/d;joy.mag=mg}}
ST_.addEventListener('pointerdown',e=>{if(S.mode==='play')skipBn();if(!mobile()||S.mode!=='play'||joy.on||e.target.closest('.tbtn'))return;e.preventDefault();try{ST_.setPointerCapture(e.pointerId)}catch(_){}
const r=ST_.getBoundingClientRect();joy.on=1;joy.id=e.pointerId;joy.ox=e.clientX;joy.oy=e.clientY;JB.style.left=(e.clientX-r.left)+'px';JB.style.top=(e.clientY-r.top)+'px';JB.classList.add('on');joyMove(e)});
ST_.addEventListener('pointermove',e=>{if(joy.on&&e.pointerId===joy.id){e.preventDefault();joyMove(e)}});
['pointerup','pointercancel','lostpointercapture'].forEach(n=>ST_.addEventListener(n,e=>{if(e.pointerId===joy.id)joyOff()}));
function pressBtn(id,fn){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();b.classList.add('dn');fn()});['pointerup','pointercancel','pointerleave'].forEach(n=>b.addEventListener(n,()=>b.classList.remove('dn')));b.addEventListener('contextmenu',e=>e.preventDefault())}
pressBtn('be',()=>{if(S.mode==='play')interact()});
pressBtn('bq',()=>{if(S.mode==='play')throwToy()});
pressBtn('bm',()=>{snd=!snd;try{localStorage.setItem('sh_snd',snd?'1':'0')}catch(e){}$('bm').textContent=snd?'🔊':'🔇';say(snd?'Звук: вкл':'Звук: выкл')});
$('bm').textContent=snd?'🔊':'🔇';
function tui(m){$('bq').classList.toggle('off',!m.toy||m.st!=='r'||!!m.hid);$('be').classList.toggle('off',m.st!=='r');$('be').classList.toggle('hd',!!m.hid)}
function fit(){const st=$('stage');if(!mobile()){VW=960;VH=640}else{const w=st.clientWidth||innerWidth,h=st.clientHeight||innerHeight,a=w/h;
if(a>=1.5){VW=960;VH=cl(Math.round(960/a),360,640)}else{VW=cl(Math.round(640*a),360,960);VH=cl(Math.round(VW/a),360,960)}}
if(C.width!==VW||C.height!==VH){C.width=VW;C.height=VH;dk.width=VW;dk.height=VH}}
const FL=()=>S.fl[S.me.f];
const ro=p=>{const q=p.presence,o=S.o[p.peer]||(S.o[p.peer]={x:q.x,y:q.y});return o};
function hunters(f){return S.gd.filter(g=>g.f===f).concat(S.oth.filter(p=>p.presence.ph==='p'&&p.presence.s==='c'&&p.presence.f===f).map(p=>{const o=ro(p);return{x:o.x,y:o.y,peer:p.peer}}))}
function interact(){const m=S.me,L=FL();if(S.bn){skipBn();return}if(m.st!=='r')return;
if(m.slip>0)return;if(m.hid){leaveCover(0);return}
const dc=m.du?8:S.idx,d=L.doors.find(d=>d.c===dc);if(d&&hyp(m.x-(d.x+35),m.y-10)<70){if(m.cn>=S.NEED&&m.k&&(!m.du||m.k2)){m.st='o';m.e=Math.round(S.t);m.hidden=1;say('Ты сбежал! Следи за друзьями');beep(900,.3);return}say(`Нужно ${S.NEED} монет и ${m.du?'2 ключа':'свой ключ'} (${m.cn}/${S.NEED}, ключей ${(m.k?1:0)+(m.k2?1:0)}/${m.du?2:1})`);beep(150,.15);return}
const od=L.doors.find(d=>d.c===S.idx);if(m.du&&od&&hyp(m.x-(od.x+35),m.y-10)<70){say('Ты двухцветный — нужна двойная дверь на 1 этаже');return}
let bc=null,bd=55;for(const c of L.covers){const dx=Math.max(c.x-m.x,0,m.x-c.x-c.w),dy=Math.max(c.y-m.y,0,m.y-c.y-c.h),dd=hyp(dx,dy);if(dd<bd){bd=dd;bc=c}}
if(!bc)return;if(m.hcd>0){say('Подожди '+Math.ceil(m.hcd)+' c — укрытие ещё нельзя занять');return}
m.hid=bc;m.hidden=1;m.hidT=HIDE_T;m.x=bc.x+bc.w/2;m.y=bc.y+bc.h/2;say(`Ты спрятался ВНУТРИ. Сидеть можно только ${HIDE_T} секунд!`,3);beep(240,.08)}
const HIDE_T=8;
function leaveCover(forced){const m=S.me,L=FL(),c=m.hid;if(!c)return;m.hid=null;m.hidden=0;m.hcd=forced?3:1;
const sp=[[0,c.h/2+14],[0,-c.h/2-14],[c.w/2+14,0],[-c.w/2-14,0]];let p=sp.find(q=>!hit(L,c.x+c.w/2+q[0],c.y+c.h/2+q[1],9))||sp[0];m.x=c.x+c.w/2+p[0];m.y=c.y+c.h/2+p[1];
if(forced){say('⏰ Время вышло! Тебя выбросило из укрытия',3);beep(180,.3,'sawtooth',.07)}else beep(300,.08)}
function throwToy(){const m=S.me,L=FL();if(S.bn){skipBn();return}if(!m.toy||m.hid||m.st!=='r')return;let x=m.x,y=m.y;for(let i=0;i<30;i++){const nx=x+m.pf.x*6,ny=y+m.pf.y*6;if(hit(L,nx,ny,5))break;x=nx;y=ny}
m.toy=0;m.sd++;m.sx=x;m.sy=y;m.sf=m.f;sndEvent(S.pid,m.sd,x,y,m.f)}
function sndEvent(peer,sd,x,y,f){if(S.sdSeen[peer]===sd)return;S.sdSeen[peer]=sd;if(f===S.me.f)S.fx.push({x,y,t:0});beep(880,.12,'square',.06);setTimeout(()=>beep(660,.15,'square',.06),140);
if(isHost()){const g=S.gs.filter(g=>g.f===f).sort((a,b)=>hyp(a.x-x,a.y-y)-hyp(b.x-x,b.y-y))[0];if(g&&(g.st!=='CHASE'||!g.seen)){g.st='INVESTIGATE';g.tgt={x,y};g.wait=3.5;g.path=null;g.alert=1}}}
function isHost(){const a=[S.pid,...S.oth.filter(p=>p.presence.ph==='p'&&S.ros.includes(p.peer)).map(p=>p.peer)].sort();return a[0]===S.pid}
const flashOn=()=>S.t>14&&(S.t%15)<.8;
const dualIdx=()=>{if(S.me.du)return S.idx;const p=S.oth.find(p=>p.presence.ph==='p'&&p.presence.d&&S.ros.includes(p.peer));return p?S.ros.indexOf(p.peer):-1};
// guards (host simulates)
function targets(f){const t=[],m=S.me;if(m.st==='r'&&m.f===f&&!m.hidden)t.push(m);S.oth.forEach(p=>{const q=p.presence;if(q.ph==='p'&&q.s==='r'&&q.f===f&&!q.h)t.push({x:q.x,y:q.y})});return t}
function follow(g,L,goal,sp,dt){g.rp-=dt;if(g.rp<=0||!g.path){g.path=path(L,g,goal);g.rp=.4}let tx=goal.x,ty=goal.y;if(g.path.length){tx=g.path[0].x;ty=g.path[0].y;if(hyp(tx-g.x,ty-g.y)<5)g.path.shift()}
const dx=tx-g.x,dy=ty-g.y,d=hyp(dx,dy)||1;if(d>2){move(L,g,dx/d*sp*dt,dy/d*sp*dt,9);g.a=Math.atan2(dy,dx);g.ph+=dt*sp/12}}
function updGuard(g,dt){const L=S.fl[g.f];g.alert=Math.max(0,g.alert-dt);let best=null,bd=1e9;
for(const t of targets(g.f)){const d=hyp(t.x-g.x,t.y-g.y);if(d>(flashOn()?400:290)||d>=bd)continue;if(g.st!=='CHASE'&&d>100){let da=Math.atan2(t.y-g.y,t.x-g.x)-g.a;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)>1.4)continue}if(los(L,g,t)){best=t;bd=d}}
g.seen=!!best;if(best){g.last={x:best.x,y:best.y};g.lost=0;if(g.st!=='CHASE'){g.st='CHASE';g.alert=1.2;g.path=null}}
const pt=L.patrol[g.pi];
if(g.st==='CHASE'){follow(g,L,g.seen?best:g.last,138,dt);if(!g.seen){g.lost+=dt;if(g.lost>1.8||hyp(g.x-g.last.x,g.y-g.last.y)<14){g.st='INVESTIGATE';g.tgt=g.last;g.wait=3.5;g.path=null}}}
else if(g.st==='INVESTIGATE'){if(hyp(g.x-g.tgt.x,g.y-g.tgt.y)>14)follow(g,L,g.tgt,100,dt);else{g.wait-=dt;g.a+=dt*2.5;if(g.wait<=0){g.st='RETURN';g.path=null}}}
else if(g.st==='RETURN'){follow(g,L,pt,90,dt);if(hyp(g.x-pt.x,g.y-pt.y)<14)g.st='PATROL'}
else{if(g.wait>0)g.wait-=dt;else{follow(g,L,pt,82,dt);if(hyp(g.x-pt.x,g.y-pt.y)<14){g.pi=(g.pi+1)%5;g.wait=.6;g.path=null}}}}
function becomeCop(by){const m=S.me;m.cb=by||'bot';m.st='c';m.hid=null;m.hidden=0;m.toy=0;m.k=0;m.du=0;m.k2=0;m.slip=0;m.boost=0;
if(m.rv){m.lost=1;banner('💀 ТЕБЯ ПОЙМАЛИ СНОВА','Второй шанс уже использован — ты ПРОИГРАЛ.\nТеперь ты полицейский до конца раунда.','#ff3050',2)}
else banner('🚔 ТЕБЯ ПОЙМАЛИ!','Теперь ты ПОЛИЦЕЙСКИЙ. Поймай '+S.cneed+' '+(S.cneed>1?'беглецов':'беглеца')+' — и снова станешь беглецом!\nВернувшись, найди ключ и дверь. Но второй раз поймают — проиграешь.','#4d7bff',2);
beep(120,.5,'sawtooth',.08)}
function revive(){const m=S.me;m.st='r';m.rv=1;m.inv=1.5;m.boost=3;S.alert=1;m.hidden=0;m.hid=null;m.k=0;m.k2=0;m.du=0;
banner('🏃 ТЫ СНОВА БЕГЛЕЦ!','Найди свой ключ и свою дверь — и выбирайся!\nЕсли поймают ещё раз — ПРОИГРЫШ. Полицейские услышат твоё возвращение и бросятся за тобой!','#7dff6b',2);beep(900,.3);setTimeout(()=>beep(1200,.3),200)}
function banner(t,s,c,d,sp){S.bn={t:15,d:15,title:t,sub:s,col:c,sp:sp?1:0,go:null}}// плашка висит, пока игрок не начнёт ходить; через 1 с после этого игра для него начинается (15 с — страховка)
const allMask=k=>{let v=S.me[k]||0;S.oth.forEach(p=>{if(p.presence.ph==='p')v|=p.presence[k]||0});return v};
function update(dt){const m=S.me,L=FL(),pz=!!(S.bn&&S.bn.sp);if(!pz)S.t+=dt;const fo=flashOn();if(fo&&!S.fo){beep(520,.35,'sine',.07);say('💡 Вспышка света! Видно всё вокруг')}S.fo=fo;const run=m.st==='r',cop=m.st==='c',frozen=!!S.bn,inp=!!(keys.KeyW||keys.KeyA||keys.KeyS||keys.KeyD||keys.ArrowUp||keys.ArrowDown||keys.ArrowLeft||keys.ArrowRight||(joy.on&&joy.mag));if(inp||frozen)S.lastIn=performance.now();if(inp&&S.bn&&S.bn.go==null)S.bn.go=1;
// пока на экране плашка: для этого игрока пауза, он «призрак» — невидим и неуязвим, остальные играют дальше
if(frozen)m.hidden=1;else if(S.wasFz&&m.st!=='o'){m.hidden=m.hid?1:0;if(S.alert&&m.st==='r'){S.alert=0;m.sd++;m.sx=m.x;m.sy=m.y;m.sf=m.f;sndEvent(S.pid,m.sd,m.x,m.y,m.f);say('🔔 Полицейские услышали твоё возвращение — бегут к тебе!',3)}}S.wasFz=frozen;
if((run||cop)&&!frozen){let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
if(joy.on&&joy.mag){dx=joy.x;dy=joy.y}if(m.slip>0){m.slip-=dt;const k=Math.max(0,m.slip)/2.5;move(L,m,m.pf.x*120*k*dt,m.pf.y*120*k*dt,9);m.phs+=dt*2}else if(!m.hid&&(dx||dy)){const d=hyp(dx,dy);dx/=d;dy/=d;m.pf={x:dx,y:dy};const sp=(cop?150:135)*(m.boost>0?1.7:1)*(joy.on&&joy.mag?Math.max(.6,joy.mag):1);move(L,m,dx*sp*dt,dy*sp*dt,9);m.phs+=dt*12}
const inSt=ST.some(s=>m.x>s.x&&m.x<s.x+s.w&&m.y>s.y&&m.y<s.y+s.h);if(inSt&&!S.onSt&&!m.hid){m.f=1-m.f;beep(420,.1);say(m.f?'Второй этаж':'Первый этаж')}S.onSt=inSt}
if(!frozen){m.hcd=Math.max(0,(m.hcd||0)-dt);m.inv=Math.max(0,(m.inv||0)-dt);m.boost=Math.max(0,(m.boost||0)-dt);m.slipCd=Math.max(0,(m.slipCd||0)-dt)}S.shake=Math.max(0,(S.shake||0)-dt);
if(run&&m.hid&&!frozen){const pT=Math.ceil(m.hidT);m.hidT-=dt;if(Math.ceil(m.hidT)<pT&&m.hidT<=3&&m.hidT>0)beep(700,.06,'square',.05);if(m.hidT<=0)leaveCover(1)}
if((run||cop)&&!frozen&&!m.hid&&!(m.slip>0)){
if(L.rags.some(r=>m.x>r.x&&m.x<r.x+r.w&&m.y>r.y&&m.y<r.y+r.h)&&!(m.slipCd>0)){m.slip=2.5;m.slipCd=4.5;S.shake=.4;burst(m.x,m.y,'#e8e0c8',12);say('🧽 Ты поскользнулся на тряпке! 2.5 c лежишь',2.5);beep(200,.35,'sawtooth',.07)}
const hl=m.f===1&&L.holes.find(h=>m.x>h.x+4&&m.x<h.x+h.w-4&&m.y>h.y+4&&m.y<h.y+h.h-4);
if(hl){const L0=S.fl[0],c=nearest(L0,m.x,m.y);m.f=0;m.x=(c%GW)*G+10;m.y=((c/GW)|0)*G+10;m.slip=1;m.slipCd=2.5;S.onSt=true;S.shake=.6;burst(m.x,m.y,'#ffd84d',16);say('🕳 Ты провалился в люк и упал на 1 этаж!',3);beep(110,.5,'sawtooth',.08)}}
if(run&&!frozen&&!m.hid){const cm=allMask('m'),tk=allMask('tm');
L.clk.forEach((c,i)=>{const id=12+m.f*2+i;if(!(tk>>id&1)&&hyp(c.x-m.x,c.y-m.y)<20){m.tm|=1<<id;m.boost=3;burst(c.x,c.y,'#7dffea',14);say('⚡ Ускорение на 3 секунды!',2);beep(1400,.2)}});
L.coins.forEach((c,i)=>{const id=m.f*15+i;if(!(cm>>id&1)&&hyp(c.x-m.x,c.y-m.y)<18){m.m|=1<<id;m.cn++;burst(c.x,c.y,'#ffd54a');S.texts.push({x:c.x,y:c.y,t:.8,s:'+1'});beep(1000+m.cn*40,.08)}});
L.toys.forEach((c,i)=>{const id=m.f*2+i;if(!(tk>>id&1)&&!m.toy&&hyp(c.x-m.x,c.y-m.y)<20){m.tm|=1<<id;m.toy=1;burst(c.x,c.y,'#ff9ad5');say('Игрушка: Q — бросить');beep(700,.1)}});
const k=L.keys.find(k=>k.c===S.idx);if(k&&!m.k&&hyp(k.x-m.x,k.y-m.y)<20){m.k=1;burst(k.x,k.y,COLS[S.idx],16);say('Ключ найден! Теперь к своей двери');beep(1200,.25)}
if(L.dual&&!m.du&&!(tk>>10&1)&&hyp(L.dual.x-m.x,L.dual.y-m.y)<22){m.du=1;m.tm|=1<<10;burst(L.dual.x,L.dual.y,'#fff',20);say('Ты двухцветный! Нужны 2 ключа и двойная дверь (1 этаж)');beep(1500,.4)}
if(L.k2&&m.du&&!m.k2&&hyp(L.k2.x-m.x,L.k2.y-m.y)<20){m.k2=1;burst(L.k2.x,L.k2.y,'#fff',16);say('Второй ключ найден!');beep(1300,.25)}}
// автопогоня: полицейский, которым давно не управляют (3 с без движения), сам идёт ловить ближайшего беглеца
S.ap=0;if(cop&&!frozen&&!m.hid&&!(m.slip>0)&&!inp&&performance.now()-(S.lastIn||0)>3000){const rs=S.oth.filter(p=>{const q=p.presence;return q.ph==='p'&&q.s==='r'&&!q.h&&S.ros.includes(p.peer)});
if(rs.length){let best=null,bd=1e9;rs.forEach(p=>{const q=p.presence,o=ro(p),d=hyp(o.x-m.x,o.y-m.y)+(q.f===m.f?0:700);if(d<bd){bd=d;best={x:o.x,y:o.y,f:q.f}}});
const goal=best.f===m.f?best:ST.map(s=>({x:s.x+s.w/2,y:s.y+s.h/2})).sort((a,b)=>hyp(a.x-m.x,a.y-m.y)-hyp(b.x-m.x,b.y-m.y))[0];
follow(m,L,goal,150,dt);m.pf={x:Math.cos(m.a||0),y:Math.sin(m.a||0)};m.phs+=dt*10;S.ap=1}}
// others interp + sounds
S.oth.forEach(p=>{const q=p.presence,o=ro(p),a=Math.min(1,dt*14);o.x+=(q.x-o.x)*a;o.y+=(q.y-o.y)*a;if(q.sd&&q.ph==='p')sndEvent(p.peer,q.sd,q.sx,q.sy,q.sf)});
// guards
const host=isHost();if(host){if(!pz)S.gs.forEach(g=>updGuard(g,dt));m.g=S.gs.map(g=>[Math.round(g.x),Math.round(g.y),Math.round(g.a*10),g.st==='CHASE'?1:g.st==='INVESTIGATE'?2:0])}
else{m.g=null;const hp=S.ros.map(r=>S.oth.find(p=>p.peer===r&&p.presence.g&&p.presence.ph==='p')).filter(Boolean).sort((a,b)=>a.peer<b.peer?-1:1)[0];
if(hp)hp.presence.g.forEach((v,i)=>{const g=S.gs[i];if(!g)return;g.x=v[0];g.y=v[1];g.a=v[2]/10;g.st=['PATROL','CHASE','INVESTIGATE'][v[3]]})}
S.gd.forEach((d,i)=>{const g=S.gs[i],a=Math.min(1,dt*14);d.x+=(g.x-d.x)*a;d.y+=(g.y-d.y)*a;d.a=g.a;d.st=g.st;d.alert=g.alert;d.ph=(d.ph||0)+dt*6});
if(run&&!frozen&&!m.hidden&&!(m.inv>0)){const hh=hunters(m.f).find(h=>hyp(h.x-m.x,h.y-m.y)<20);if(hh)becomeCop(hh.peer)}
if(cop&&!m.rv)S.oth.forEach(p=>{const q=p.presence;if(q.ph==='p'&&q.s==='c'&&q.cb===S.pid&&S.ros.includes(p.peer)&&!S.cg.has(p.peer)){S.cg.add(p.peer);say(`Ты поймал: ${q.n} (${S.cg.size}/${S.cneed})`,3);beep(500,.2)}});
if(cop&&!m.rv&&S.cg.size>=S.cneed)revive();
if(S.bn){S.bn.t-=dt;if(S.bn.go!=null)S.bn.go-=dt;if(S.bn.t<=0||(S.bn.go!=null&&S.bn.go<=0))S.bn=null}
const rr=S.oth.filter(p=>p.presence.ph==='p'&&S.ros.includes(p.peer));
if(S.t>3&&m.st!=='r'&&!rr.some(p=>p.presence.s==='r'))endRound();
S.parts.forEach(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.t-=dt});S.parts=S.parts.filter(q=>q.t>0);S.texts.forEach(q=>{q.y-=30*dt;q.t-=dt});S.texts=S.texts.filter(q=>q.t>0);
S.fx.forEach(f=>f.t+=dt);S.fx=S.fx.filter(f=>f.t<1.2);if(S.msgT>0)S.msgT-=dt}
// drawing
function legs(x,y,ph,c){X.fillStyle=c;const o=Math.sin(ph)*3;X.fillRect(x-6,y+4+o,4,6);X.fillRect(x+2,y+4-o,4,6)}
function person(x,y,ph,col,cop,hid,t,sec,lay){X.save();if(lay){X.translate(x,y+4);X.rotate(1.5);X.translate(-x,-y)}if(hid){X.fillStyle='#fff';X.fillRect(x-5,y-8,3,3);X.fillRect(x+2,y-8,3,3);X.restore();return}if(hid)X.globalAlpha=.55;
X.fillStyle='rgba(0,0,0,.4)';X.beginPath();X.ellipse(x,y+10,9,4,0,0,7);X.fill();legs(x,y,ph,'#222');X.fillStyle=cop?'#2a4bd6':col;X.fillRect(x-8,y-6,16,12);if(sec&&!cop){X.fillStyle=sec;X.fillRect(x,y-6,8,12)}X.fillStyle='#ffe0b0';X.fillRect(x-6,y-14,12,9);
X.fillStyle='#222';X.fillRect(x-4,y-11,2,2);X.fillRect(x+2,y-11,2,2);if(cop){X.fillStyle=Math.sin(t*10)>0?'#ff3050':'#4d7bff';X.fillRect(x-7,y-18,14,5)}else{X.fillStyle=col;X.fillRect(x-7,y-16,14,3)}X.restore()}
function guard(g){X.fillStyle='rgba(0,0,0,.4)';X.beginPath();X.ellipse(g.x,g.y+11,10,4,0,0,7);X.fill();legs(g.x,g.y,g.ph||0,'#3a0a14');X.fillStyle=g.st==='CHASE'?'#ff2a45':'#d93a52';X.fillRect(g.x-9,g.y-7,18,14);X.fillStyle='#e8b9a0';X.fillRect(g.x-6,g.y-15,12,9);X.fillStyle='#401018';X.fillRect(g.x-8,g.y-18,16,5);X.fillStyle='#fff';X.fillRect(g.x-4+Math.cos(g.a)*2,g.y-12,2,2);X.fillRect(g.x+2+Math.cos(g.a)*2,g.y-12,2,2)}
function glow(x,y,r,c,a){const gr=X.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,c.replace('A',a));gr.addColorStop(1,c.replace('A',0));X.fillStyle=gr;X.fillRect(x-r,y-r,r*2,r*2)}
const dk=document.createElement('canvas');dk.width=VW;dk.height=VH;const D=dk.getContext('2d');
function objective(){const m=S.me;if(m.st!=='r')return null;const kf=(S.idx+1)%2;let w;
if(!m.k)w={f:kf,p:S.fl[kf].keys.find(k=>k.c===S.idx)};else if(m.du&&!m.k2)w={f:1,p:S.fl[1].k2};
else{const df=m.du?0:S.idx%2,d=S.fl[df].doors.find(d=>d.c===(m.du?8:S.idx));w={f:df,p:d?{x:d.x+35,y:30}:null}}
if(!w||!w.p)return null;if(w.f===m.f)return w.p;return ST.map(s=>({x:s.x+s.w/2,y:s.y+s.h/2})).sort((a,b)=>hyp(a.x-m.x,a.y-m.y)-hyp(b.x-m.x,b.y-m.y))[0]}
function render(){if(!S.fl){X.fillStyle='#050a12';X.fillRect(0,0,VW,VH);return}
const fo=flashOn(),m=S.me,L=FL(),t=performance.now()/1000,cx=cl(m.x-VW/2,0,WW-VW),cy=cl(m.y-VH/2,0,WH-VH),zs=1,tx=0,ty=0;
X.fillStyle='#050a12';X.fillRect(0,0,VW,VH);X.save();X.translate(tx,ty);X.scale(zs,zs);X.translate(-cx,-cy);X.drawImage(FI[m.f],0,0);
if(S.shake>0)X.translate((Math.random()-.5)*8*S.shake,(Math.random()-.5)*8*S.shake);
L.rags.forEach(r=>{X.save();X.translate(r.x+16,r.y+11);X.rotate(r.a);X.fillStyle='#d9d0b4';X.beginPath();X.ellipse(0,0,17,11,0,0,7);X.fill();X.strokeStyle='#a89f82';X.lineWidth=1.5;X.beginPath();X.moveTo(-12,-2);X.quadraticCurveTo(-5,-7,0,-2);X.quadraticCurveTo(5,3,12,-2);X.moveTo(-10,4);X.quadraticCurveTo(-3,0,3,4);X.stroke();X.fillStyle='rgba(120,200,255,.35)';X.beginPath();X.ellipse(2,1,9,4,0,0,7);X.fill();X.restore()});
L.holes.forEach(h=>{X.fillStyle='#05070c';X.fillRect(h.x,h.y,h.w,h.h);X.fillStyle='#10161f';X.fillRect(h.x+3,h.y+3,h.w-6,6);
X.save();X.beginPath();X.rect(h.x-3,h.y-3,h.w+6,h.h+6);X.clip();X.strokeStyle='#ffd21f';X.lineWidth=4;for(let k=-h.h;k<h.w+h.h;k+=14){X.beginPath();X.moveTo(h.x+k,h.y-4);X.lineTo(h.x+k+h.h,h.y+h.h+4);X.stroke();X.beginPath();X.moveTo(h.x+k+h.h,h.y-4);X.lineTo(h.x+k,h.y+h.h+4);X.stroke()}X.restore();
X.strokeStyle='#ffd21f';X.lineWidth=3;X.strokeRect(h.x-1,h.y-1,h.w+2,h.h+2);X.strokeStyle='#111';X.lineWidth=1;X.strokeRect(h.x+2,h.y+2,h.w-4,h.h-4)});
for(const w of L.solids){if(w.door){X.fillStyle='#4a3416';X.fillRect(w.x,w.y,w.w,w.h);if(w.c===8){const di=dualIdx(),hw=(w.w-8)/2;X.fillStyle=di<0?'#eee':COLS[di];X.fillRect(w.x+4,w.y+4,hw,w.h-8);X.fillStyle=di<0?'#ffd84d':COLS[(di+4)%8];X.fillRect(w.x+4+hw,w.y+4,hw,w.h-8)}else{X.fillStyle=COLS[w.c];X.fillRect(w.x+4,w.y+4,w.w-8,w.h-8)}continue}
if(w.t==='w'){X.fillStyle='#2b5a5e';X.fillRect(w.x,w.y,w.w,w.h);X.fillStyle='#1b3f44';X.fillRect(w.x+w.w/2-1,w.y+3,2,w.h-6);X.fillStyle='#3d7a7e';X.fillRect(w.x,w.y,w.w,4)}
else if(w.t==='b'){X.fillStyle='#8a6a3c';X.fillRect(w.x,w.y,w.w,w.h);X.fillStyle='#a8844c';X.fillRect(w.x,w.y,w.w,5);X.fillStyle='#5e4524';X.fillRect(w.x+w.w/2-2,w.y,4,w.h)}
else{X.fillStyle=m.f?'#2c3566':'#1d3a52';X.fillRect(w.x,w.y,w.w,w.h);X.fillStyle=m.f?'#5560a8':'#3b6f99';X.fillRect(w.x,w.y,w.w,3)}}
L.sd.forEach(d=>{const op=dOpen(d),left=d.per*.5-((S.t+d.ph)%d.per)%(d.per*.5),warn=(op&&left<.8)||(!op&&left<.8),bl=warn&&Math.sin(t*20)>0;
if(!op){X.fillStyle='#5a5f6e';X.fillRect(d.x,d.y,d.w,d.h);X.fillStyle='#8c93a6';X.fillRect(d.x+2,d.y+2,d.w-4,d.h-4);X.fillStyle='#3a3e4a';if(d.w>d.h)X.fillRect(d.x+d.w/2-1,d.y,2,d.h);else X.fillRect(d.x,d.y+d.h/2-1,d.w,2)}
else{X.strokeStyle='rgba(120,255,160,.5)';X.setLineDash([4,4]);X.lineWidth=2;X.strokeRect(d.x+1,d.y+1,d.w-2,d.h-2);X.setLineDash([])}
X.fillStyle=bl?'#ffd21f':op?'#4dff88':'#ff3a4a';X.beginPath();X.arc(d.x+d.w/2,d.y+d.h/2,4,0,7);X.fill()});
const cm=allMask('m'),tk=allMask('tm');
L.clk.forEach((c,i)=>{if(tk>>(12+m.f*2+i)&1)return;const b=Math.sin(t*4+i)*2;X.save();X.translate(c.x,c.y+b);X.fillStyle='#7dffea';X.beginPath();X.arc(0,0,10,0,7);X.fill();X.fillStyle='#0b2b30';X.beginPath();X.arc(0,0,8,0,7);X.fill();X.strokeStyle='#7dffea';X.lineWidth=2;X.beginPath();X.moveTo(0,0);X.lineTo(0,-6);X.moveTo(0,0);X.lineTo(Math.cos(t*6)*5,Math.sin(t*6)*5);X.stroke();X.fillStyle='#7dffea';X.fillRect(-2,-13,4,3);X.restore()});
L.coins.forEach((c,i)=>{if(cm>>(m.f*15+i)&1)return;const b=Math.sin(t*4+i)*2;X.fillStyle='#ffc83d';X.beginPath();X.arc(c.x,c.y+b,7,0,7);X.fill();X.fillStyle='#fff3a0';X.fillRect(c.x-2,c.y+b-4,3,6)});
L.toys.forEach((c,i)=>{if(tk>>(m.f*2+i)&1)return;X.fillStyle='#ff6fb5';X.fillRect(c.x-7,c.y-6,14,13);X.fillStyle='#fff';X.fillRect(c.x-4,c.y-3,8,6)});
const key=L.keys.find(k=>k.c===S.idx&&!m.k);if(key){const kb=Math.sin(t*4)*2;X.save();X.translate(key.x,key.y+kb);X.scale(1.6,1.6);X.fillStyle=COLS[S.idx%8];X.strokeStyle='#fff';X.lineWidth=1.2;X.beginPath();X.arc(-4,0,6,0,7);X.fill();X.stroke();X.fillRect(0,-2,12,4);X.strokeRect(0,-2,12,4);X.fillRect(8,0,3,6);X.restore()}
if(L.dual&&!(tk>>10&1)){X.fillStyle='#fff';X.beginPath();X.arc(L.dual.x,L.dual.y,9,0,7);X.fill();X.fillStyle=COLS[Math.floor(t*3)%8];X.fillRect(L.dual.x-9,L.dual.y-3,18,6)}
const key2=L.k2&&m.du&&!m.k2?L.k2:null;if(key2){X.fillStyle='#fff';X.beginPath();X.arc(key2.x-4,key2.y,6,0,7);X.fill();X.fillRect(key2.x,key2.y-2,12,4);X.fillRect(key2.x+8,key2.y,3,6)}
const ents=[];S.gd.filter(g=>g.f===m.f).forEach(g=>ents.push({y:g.y,d:()=>guard(g)}));
S.oth.forEach(p=>{const q=p.presence;if(q.ph!=='p'||q.f!==m.f||q.s==='o'||q.h)return;const o=ro(p),i=S.ros.indexOf(p.peer);ents.push({y:o.y,d:()=>person(o.x,o.y,t*8,COLS[i%8],q.s==='c',0,t,q.d?COLS[(i+4)%8]:null)})});
if(m.st!=='o')ents.push({y:m.y,d:()=>person(m.x,m.y,m.phs,COLS[S.idx%8],m.st==='c',m.hid,t,m.du?COLS[(S.idx+4)%8]:null,m.slip>0)});
ents.sort((a,b)=>a.y-b.y).forEach(e=>e.d());S.parts.forEach(q=>{X.globalAlpha=q.t*2;X.fillStyle=q.c;X.fillRect(q.x,q.y,3,3)});X.globalAlpha=1;X.restore();
// darkness
const R0=m.st==='c'?85:105,R=R0+Math.sin(t*5)*3,px=m.x-cx,py=m.y-cy;
D.globalCompositeOperation='source-over';D.clearRect(0,0,VW,VH);S.da=fo?0:Math.min(.95,(S.da==null?.95:S.da)+.08);D.fillStyle='rgba(3,7,16,'+S.da.toFixed(3)+')';D.fillRect(0,0,VW,VH);D.globalCompositeOperation='destination-out';
let gr=D.createRadialGradient(px,py,10,px,py,R);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.55,'rgba(0,0,0,.9)');gr.addColorStop(1,'rgba(0,0,0,0)');D.fillStyle=gr;D.fillRect(px-R,py-R,R*2,R*2);
const hs=hunters(m.f);hs.forEach(h=>{const hx=h.x-cx,hy=h.y-cy;gr=D.createRadialGradient(hx,hy,0,hx,hy,48);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');D.fillStyle=gr;D.fillRect(hx-48,hy-48,96,96)});
X.drawImage(dk,0,0);X.save();X.translate(tx,ty);X.scale(zs,zs);X.translate(-cx,-cy);X.globalCompositeOperation='lighter';glow(m.x,m.y,R,'rgba(255,170,70,A)',.16);
const cm2=allMask('m');L.coins.forEach((c,i)=>{if(!(cm2>>(m.f*15+i)&1))glow(c.x,c.y,26,'rgba(255,200,60,A)',.35)});if(key)glow(key.x,key.y,fo?90:40,rg(COLS[S.idx%8]),fo?.9:.65);if(key2)glow(key2.x,key2.y,fo?90:34,'rgba(255,255,255,A)',.7);if(L.dual&&!(tk>>10&1))glow(L.dual.x,L.dual.y,30,'rgba(255,255,255,A)',.4);
L.toys.forEach((c,i)=>{if(!(tk>>(m.f*2+i)&1))glow(c.x,c.y,24,'rgba(255,110,190,A)',.3)});L.clk.forEach((c,i)=>{if(!(tk>>(12+m.f*2+i)&1))glow(c.x,c.y,34,'rgba(120,255,234,A)',.5)});L.holes.forEach(h=>glow(h.x+20,h.y+20,34,'rgba(255,210,31,A)',.22));
const dr=L.doors.find(d=>d.c===(m.du?8:S.idx));if(dr&&m.cn>=S.NEED&&m.k&&(!m.du||m.k2))glow(dr.x+35,18,60,'rgba(120,255,180,A)',.5+Math.sin(t*6)*.2);
L.doors.forEach(d=>glow(d.x+35,14,34,d.c===8?'rgba(255,255,255,A)':rg(COLS[d.c]),d.c===S.idx?.45:.22));
X.globalCompositeOperation='source-over';X.font='bold 26px "Courier New"';X.textAlign='center';
S.gd.filter(g=>g.f===m.f).forEach(g=>{X.fillStyle='rgba(255,60,80,.7)';X.fillRect(g.x-4,g.y-12,2,2);X.fillRect(g.x+2,g.y-12,2,2);if(g.alert>0||g.st==='CHASE'){X.fillStyle=g.st==='CHASE'?'#ff3050':'#ffd54a';X.fillText(g.st==='CHASE'?'!':'?',g.x,g.y-24)}});
S.oth.forEach(p=>{const q=p.presence;if(q.ph==='p'&&q.s==='c'&&q.f===m.f){const o=ro(p);X.fillStyle='rgba(80,120,255,.8)';X.fillRect(o.x-4,o.y-12,2,2);X.fillRect(o.x+2,o.y-12,2,2)}});
S.fx.forEach(f=>{X.strokeStyle=`rgba(255,200,120,${1-f.t/1.2})`;X.lineWidth=2;X.beginPath();X.arc(f.x,f.y,f.t*130,0,7);X.stroke()});
{const tg=objective();if(tg&&m.st==='r'&&!m.hidden){const dx=tg.x-m.x,dy=tg.y-m.y;if(hyp(dx,dy)>70){const a=Math.atan2(dy,dx);X.save();X.translate(m.x+Math.cos(a)*48,m.y+Math.sin(a)*48);X.rotate(a);X.fillStyle=COLS[S.idx%8];X.strokeStyle='#000';X.lineWidth=2;X.beginPath();X.moveTo(10,0);X.lineTo(-6,-7);X.lineTo(-6,7);X.closePath();X.fill();X.stroke();X.restore()}}}
X.font='bold 14px "Courier New"';X.fillStyle='#ffe07a';S.texts.forEach(q=>X.fillText(q.s,q.x,q.y));X.restore();
if(S.msgT>0&&!S.bn){const u=cl(VW/(C.clientWidth||VW),1,2.2),fs=Math.round(14*u),lh=Math.round(18*u),mw=Math.min(VW-16,640*Math.min(u,1.4));X.font=`bold ${fs}px "Courier New"`;X.textAlign='center';const ln=[];let cur='';
for(const wd of String(S.msg).split(' ')){const tt=cur?cur+' '+wd:wd;if(cur&&X.measureText(tt).width>mw-16){ln.push(cur);cur=wd}else cur=tt}ln.push(cur);
const bh=ln.length*lh+10,by=mobile()?58:VH-bh-14;X.globalAlpha=Math.min(1,S.msgT);X.fillStyle='rgba(0,0,0,.65)';X.fillRect(VW/2-mw/2,by,mw,bh);X.fillStyle='#ffe07a';ln.forEach((t2,i)=>X.fillText(t2,VW/2,by+lh*(i+1)-2));X.globalAlpha=1}
{// рамка роли
const rc=m.st==='c'?(m.lost?'#ff3050':'#4d7bff'):m.st==='o'?'#7dff6b':(m.rv?'#7dff6b':'#ffc83d');X.save();X.lineWidth=6;X.strokeStyle=rc;X.globalAlpha=m.st==='c'?.55+Math.sin(t*6)*.3:.4;X.strokeRect(3,3,VW-6,VH-6);X.restore();
X.save();X.textAlign='left';X.font='bold 13px "Courier New"';const rt=m.st==='c'?(m.lost?'💀 ПРОИГРАЛ · ПОЛИЦЕЙСКИЙ':'🚔 ТЫ ПОЛИЦЕЙСКИЙ'):m.st==='o'?'✅ СБЕЖАЛ':(m.rv?'🏃 БЕГЛЕЦ (2-й шанс!)':'🏃 ТЫ БЕГЛЕЦ');X.fillStyle='rgba(0,0,0,.6)';X.fillRect(8,mobile()?30:8,X.measureText(rt).width+14,22);X.fillStyle=rc;X.fillText(rt,15,(mobile()?30:8)+16);X.restore()}
// таймер укрытия
if(m.hid&&m.st==='r'){const lf=Math.max(0,m.hidT),lo=lf<=3,cx2=VW/2,pu=lo?1+Math.sin(t*14)*.08:1;X.save();X.translate(cx2,mobile()?84:78);X.scale(pu,pu);X.textAlign='center';X.fillStyle='rgba(0,0,0,.72)';X.fillRect(-120,-52,240,104);X.strokeStyle=lo?'#ff3050':'#ffc83d';X.lineWidth=4;X.strokeRect(-120,-52,240,104);
X.font='bold 13px "Courier New"';X.fillStyle='#cfe6ee';X.fillText('ТЫ В УКРЫТИИ — ВЫЙДЕШЬ ЧЕРЕЗ',0,-34);X.font='bold 56px "Courier New"';X.fillStyle=lo?'#ff3050':'#ffe07a';X.fillText(lf.toFixed(1),0,20);X.fillStyle='#222';X.fillRect(-100,32,200,10);X.fillStyle=lo?'#ff3050':'#7dff6b';X.fillRect(-100,32,200*lf/HIDE_T,10);X.restore()}
else if(m.hcd>0&&m.st==='r'){X.save();X.textAlign='center';X.font='bold 13px "Courier New"';X.fillStyle='rgba(0,0,0,.6)';X.fillRect(VW/2-130,50,260,22);X.fillStyle='#ff9a9a';X.fillText('Укрытие снова доступно через '+m.hcd.toFixed(1)+' c',VW/2,66);X.restore()}
if(m.slip>0){X.save();X.textAlign='center';X.font='bold 30px "Courier New"';X.fillStyle='#ffe07a';X.fillText('💫 УПАЛ! '+m.slip.toFixed(1),VW/2,VH/2-70);X.restore()}
if(m.boost>0){X.save();X.textAlign='center';X.font='bold 18px "Courier New"';X.fillStyle='#7dffea';X.fillText('⚡ УСКОРЕНИЕ '+m.boost.toFixed(1),VW/2,VH-60);X.restore()}
if(m.inv>0&&m.st==='r'){X.save();X.textAlign='center';X.font='bold 16px "Courier New"';X.fillStyle='#7dff6b';X.fillText('🛡 Защита '+m.inv.toFixed(1),VW/2,VH-82);X.restore()}
if(S.ap&&!S.bn){X.save();X.textAlign='center';X.font='bold 13px "Courier New"';const tx=(mobile()?'🤖 Автопогоня · двигайся сам, чтобы взять управление':'🤖 Автопогоня за беглецом · нажми WASD, чтобы управлять самому');X.fillStyle='rgba(0,0,0,.65)';X.fillRect(VW/2-X.measureText(tx).width/2-8,VH-46,X.measureText(tx).width+16,22);X.fillStyle='#8fb4ff';X.fillText(tx,VW/2,VH-30);X.restore()}
// большой баннер роли (текст переносится по ширине, рамка считается по реальной высоте)
if(S.bn){const b=S.bn,al=Math.min(1,b.t,(b.d-b.t)*3+.2)*(b.go==null?1:Math.max(0,Math.min(1,b.go*2))),u=cl(VW/(C.clientWidth||VW),1,2.2),pd=Math.round(12*u),mw=VW-2*pd-12;
const wrap=(txt,font)=>{X.font=font;const out=[];String(txt).split('\n').forEach(par=>{let cur='';par.split(' ').forEach(w2=>{const tt=cur?cur+' '+w2:w2;if(cur&&X.measureText(tt).width>mw){out.push(cur);cur=w2}else cur=tt});out.push(cur)});return out};
const fs=Math.round(cl(VW/12,18,34)*Math.min(u,1.4)),sf=Math.round(cl(VW/34,12,16)*Math.min(u,1.5));
const tl=wrap(b.title,`bold ${fs}px "Courier New"`),sl=wrap(b.sub+(b.go!=null?'\n▶ Начинаем через '+Math.max(1,Math.ceil(b.go))+' c…':b.sp?'\n⏸ ВСЯ ИГРА НА ПАУЗЕ. Начни ходить — и через 1 секунду игра начнётся':'\n⏸ Для тебя пауза: ты невидим, остальные играют. Начни ходить — через 1 секунду вернёшься в игру'),`bold ${sf}px "Courier New"`);
const th=tl.length*(fs+6),sh=sl.length*(sf+6),bh=pd*2+th+sh+10,by=Math.max(4,Math.round(VH/2-bh/2-20));
X.save();X.globalAlpha=al;X.fillStyle='rgba(2,6,14,.88)';X.fillRect(6,by,VW-12,bh);X.fillStyle=b.col;X.fillRect(6,by,VW-12,4);X.fillRect(6,by+bh-4,VW-12,4);X.textAlign='center';
let yy=by+pd+fs;X.font=`bold ${fs}px "Courier New"`;X.shadowColor=b.col;X.shadowBlur=14;X.fillStyle=b.col;tl.forEach(l=>{X.fillText(l,VW/2,yy);yy+=fs+6});X.shadowBlur=0;
yy+=10-6+sf-fs+6-6;X.font=`bold ${sf}px "Courier New"`;X.fillStyle='#fff';yy=by+pd+th+10+sf;sl.forEach(l=>{X.fillText(l,VW/2,yy);yy+=sf+6});X.restore()}
$('hr').textContent=m.st==='c'?(m.lost?'💀 Проиграл (полиция)':'🚔 ПОЛИЦЕЙСКИЙ'):m.st==='o'?'✅ Сбежал':(m.rv?'🏃 Беглец (2-й шанс)':'🏃 Беглец');$('hr').style.color=m.st==='c'?'#4d7bff':COLS[S.idx%8];
$('hq').textContent=m.st==='c'&&!m.lost?`🎯 Поймать: ${S.cg.size}/${S.cneed}`:''
$('hc').textContent=`${m.cn||0}/${S.NEED}`;$('hk').textContent=m.du?`${(m.k?1:0)+(m.k2?1:0)}/2`:(m.k?'есть':'нет');{const kf=(S.idx+1)%2+1,df=m.du?1:S.idx%2+1,nk=!m.k?kf:(m.du&&!m.k2?2:0);$('hg').textContent=m.st!=='r'?'':nk?'(ключ: этаж '+nk+')':'(дверь: этаж '+df+')';$('hg').style.color=COLS[S.idx%8]}$('ht').textContent=m.toy?'есть (Q)':'нет';$('hf').textContent=m.f+1;$('hl').textContent=fo?'сейчас':Math.ceil(15-(S.t%15));
$('hn').textContent=(m.st==='r'?1:0)+S.oth.filter(p=>p.presence.ph==='p'&&S.ros.includes(p.peer)&&p.presence.s==='r').length;tui(m)}
function menu(){OV.className='';OV.innerHTML=`<div><h1>SHADOW HUNT</h1><p>Онлайн-кооператив: найди свой ключ, собери монеты и выберись через дверь своего цвета.<br>Пойманные становятся полицейскими и охотятся на друзей.</p><div class="rules"><b>ПРАВИЛА</b><br>🏃 Ты беглец: найди свой ключ, собери монеты, выберись через свою дверь.<br>🚔 Поймал полицейский — ты полицейский. Поймай ~30% игроков (из 10 — троих, вдвоём — одного), и ты СНОВА беглец и можешь добежать до двери.<br>☝ Возродиться можно только ОДИН раз: поймают второй раз — проигрыш.<br>🫥 Прятаться можно только ВНУТРИ шкафа или коробки и не дольше 8 секунд.<br>🕳 Жёлтая лента на 2 этаже — люк, упадёшь на 1 этаж. 🧽 Тряпка — падаешь на 2–3 с. ⚡ Часы — ускорение 3 с. Комнаты с дверями открываются и закрываются по таймеру.</div><p><input id="nm" placeholder="Имя" maxlength="12"></p><p><input id="cd" placeholder="Код комнаты" value="room1" maxlength="20"></p><button onclick="online(false)">Играть онлайн</button><button class="s" onclick="online(true)">Одному</button></div>`}
let last=performance.now();function loop(n){const dt=Math.min(.05,(n-last)/1000);last=n;const pl=S.mode==='play';if(document.body.classList.contains('play')!==pl){document.body.classList.toggle('play',pl);if(!pl)joyOff()}if(pl)update(dt);render();requestAnimationFrame(loop)}
addEventListener('shadownet',e=>{const s=e.detail&&e.detail.state;
if(s==='reconnecting')say('⚠ Связь пропала — переподключаюсь…');
else if(s==='online')say('Связь восстановлена');
else if(s==='newid')say('Связь восстановлена, но твоё место в раунде потеряно — доиграй до конца или выйди в лобби');
else if(s==='lost')say('Связь потеряна. Обнови страницу и зайди снова')});
addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,250));
if(window.ResizeObserver)new ResizeObserver(fit).observe($('stage'));
document.addEventListener('contextmenu',e=>{if(mobile())e.preventDefault()});
fit();menu();requestAnimationFrame(loop);
