const app=document.getElementById('app');
let socketId=null,myPlayer=null,roomCode='',game=null,error='',notice='';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){
 if(!myPlayer){app.innerHTML=`<main class="page center"><section class="card home"><div class="logo">🔴 CONNECT <b>FOUR</b> 🟡</div><p class="sub">Real-time multiplayer • 7 × 6</p><button id="create" class="primary">Create Room</button><div class="or">OR</div><label>Have a room code?</label><div class="join"><input id="code" maxlength="5" placeholder="ABCDE"><button id="join" class="secondary">Join</button></div>${error?`<div class="error">${esc(error)}</div>`:''}</section></main>`;
  $('#create').onclick=create;$('#join').onclick=join;$('#code').onkeydown=e=>e.key==='Enter'&&join();return; }
 const win=new Set((game?.winningCells||[]).map(x=>x.join('-')));
 const status=!game?'Connecting…':game.status==='waiting'?'Waiting for Player 2…':game.status==='draw'?'🤝 Draw — Board Full!':game.status==='finished'?(game.winner==='red'?'🔴 Red Wins!':'🟡 Yellow Wins!'):(game.currentTurn===myPlayer?`Your Turn — ${myPlayer==='red'?'🔴 Red':'🟡 Yellow'}`:`${game.currentTurn==='red'?'🔴 Red':'🟡 Yellow'}'s Turn`);
 const board=game?.board||Array.from({length:6},()=>Array(7).fill(null));
 app.innerHTML=`<main class="page"><header><div class="brand">🔴 CONNECT FOUR 🟡</div><div class="pill">ROOM <strong>${esc(roomCode)}</strong><button id="copy">Copy</button></div></header><section class="game"><div class="status card"><div class="big">${status}</div><div class="players"><span class="red">● Red ${myPlayer==='red'?'(You)':''}</span><span class="yellow">● Yellow ${myPlayer==='yellow'?'(You)':''}</span></div></div>${notice?`<div class="notice">${esc(notice)}</div>`:''}${error?`<div class="error">${esc(error)}</div>`:''}<div class="boardShell"><div class="drops">${Array.from({length:7},(_,c)=>`<button data-col="${c}" ${!game||game.status!=='playing'||game.currentTurn!==myPlayer||board[0][c]?'disabled':''}>↓</button>`).join('')}</div><div class="board">${board.map((row,r)=>row.map((cell,c)=>`<div class="cell"><div class="token ${cell||''} ${win.has(`${r}-${c}`)?'winning':''}"></div></div>`).join('')).join('')}</div></div>${game&&(game.status==='finished'||game.status==='draw')?'<button id="again" class="primary again">Play Again</button>':''}<p class="hint">${game?.status==='waiting'?'Share the room code with Player 2. The game starts automatically when they join.':''}</p><button id="leave" class="leave">Leave Room</button></section></main>`;
 document.querySelectorAll('[data-col]').forEach(b=>b.onclick=()=>move(Number(b.dataset.col)));$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(roomCode)}catch{} notice='Room code copied!';render();setTimeout(()=>{notice='';render()},1500)};$('#leave').onclick=leave;if($('#again'))$('#again').onclick=leave;
}
async function post(path,data){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw new Error(j.error||'Request failed');return j;}
function create(){error='';post('/room/create',{socketId}).catch(e=>{error=e.message;render()})}
function join(){const code=$('#code').value.trim().toUpperCase();if(!code)return;error='';post('/room/join',{socketId,code}).catch(e=>{error=e.message;render()})}
function move(column){error='';post('/game/move',{socketId,column}).catch(e=>{error=e.message;render()})}
function leave(){post('/room/leave',{socketId}).finally(()=>{myPlayer=null;roomCode='';game=null;notice='';error='';render()})}
const events=new EventSource('/events');
events.addEventListener('connected',e=>{socketId=JSON.parse(e.data).socketId;render()});
events.addEventListener('room',e=>{const x=JSON.parse(e.data);roomCode=x.roomCode;myPlayer=x.player;error='';render()});
events.addEventListener('state',e=>{game=JSON.parse(e.data);render()});events.addEventListener('error',e=>{try{error=JSON.parse(e.data)}catch{}render()});events.addEventListener('notice',e=>{notice=JSON.parse(e.data);render()});
render();
