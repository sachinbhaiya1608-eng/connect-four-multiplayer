// @ts-nocheck
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
const ROWS = 6, COLS = 7;
const rooms = new Map();
const clients = new Map(); // socketId -> { res, roomCode, player }

function emptyBoard() { return Array.from({length: ROWS}, () => Array(COLS).fill(null)); }
function roomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let code;
  do { code = Array.from({length:5}, () => chars[Math.floor(Math.random()*chars.length)]).join(''); } while (rooms.has(code));
  return code;
}
function id() { return crypto.randomBytes(12).toString('hex'); }
function state(room) {
  return { roomCode: room.code, board: room.board, players: { red: !!room.players.red, yellow: !!room.players.yellow }, currentTurn: room.currentTurn, status: room.status, winner: room.winner, winningCells: room.winningCells };
}
function send(res, status, type, body) {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {'Content-Type': type, 'Cache-Control':'no-store', 'Access-Control-Allow-Origin':'*'}); res.end(data);
}
function sse(client, event, data) { client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); }
function broadcast(room, event='state', data=state(room)) {
  for (const c of clients.values()) if (c.roomCode === room.code) sse(c, event, data);
}
function inBounds(r,c){return r>=0&&r<ROWS&&c>=0&&c<COLS;}
function winningLine(board,row,col,player){
  for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){
    const cells=[[row,col]];
    for(const sign of [-1,1]){ let r=row+dr*sign,c=col+dc*sign; while(inBounds(r,c)&&board[r][c]===player){cells.push([r,c]);r+=dr*sign;c+=dc*sign;} }
    if(cells.length>=4)return cells;
  } return null;
}
function move(room,col,player){
  if(room.status!=='playing')return 'The game is already over.';
  if(room.currentTurn!==player)return 'It is not your turn.';
  if(!Number.isInteger(col)||col<0||col>=COLS)return 'Invalid column.';
  let row=-1; for(let r=ROWS-1;r>=0;r--)if(!room.board[r][col]){row=r;break;}
  if(row<0)return 'That column is full.';
  room.board[row][col]=player;
  const line=winningLine(room.board,row,col,player);
  if(line){room.status='finished';room.winner=player;room.winningCells=line;}
  else if(room.board[0].every(Boolean)){room.status='draw';room.winner=null;room.winningCells=[];}
  else room.currentTurn=player==='red'?'yellow':'red';
  return null;
}
function join(socketId, code){
  const c=clients.get(socketId); const room=rooms.get(String(code||'').trim().toUpperCase());
  if(!room)return {error:'Room not found. Check the code and try again.'};
  if(room.players.yellow)return {error:'That room already has two players.'};
  room.players.yellow=socketId; room.status='playing'; c.roomCode=room.code;c.player='yellow';
  return {ok:true, player:'yellow', room};
}
function leave(socketId){
  const c=clients.get(socketId); if(!c)return; const room=rooms.get(c.roomCode); if(!room)return;
  if(room.players[c.player]===socketId)room.players[c.player]=null;
  if(!room.players.red&&!room.players.yellow){rooms.delete(room.code);return;}
  room.status='waiting';room.currentTurn='red';room.board=emptyBoard();room.winner=null;room.winningCells=[];
  broadcast(room,'notice',`${c.player==='red'?'Red':'Yellow'} left the room. Waiting for a new player.`);broadcast(room);
  c.roomCode=null;c.player=null;
}
function body(req){return new Promise((resolve,reject)=>{let d='';req.on('data',x=>d+=x);req.on('end',()=>{try{resolve(JSON.parse(d||'{}'))}catch(e){reject(e)}});});}
function html(){return fs.readFileSync(path.join(__dirname,'public','index.html'),'utf8');}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host}`);
  if(req.method==='GET' && url.pathname==='/') return send(res,200,'text/html; charset=utf-8',html());
  if(req.method==='GET' && url.pathname==='/app.js') return send(res,200,'text/javascript; charset=utf-8',fs.readFileSync(path.join(__dirname,'public','app.js')));
  if(req.method==='GET' && url.pathname==='/styles.css') return send(res,200,'text/css; charset=utf-8',fs.readFileSync(path.join(__dirname,'public','styles.css')));
  if(req.method==='GET' && url.pathname==='/events'){
    const socketId=id(); const client={res,roomCode:null,player:null}; clients.set(socketId,client);
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','Access-Control-Allow-Origin':'*'});res.write(`event: connected\ndata: ${JSON.stringify({socketId})}\n\n`);
    req.on('close',()=>{leave(socketId);clients.delete(socketId);}); return;
  }
  if(req.method==='POST'){
    try{
      const b=await body(req);
      if(url.pathname==='/room/create'){
        const socketId=b.socketId,c=clients.get(socketId);if(!c)return send(res,400,'application/json',JSON.stringify({error:'Not connected.'}));
        const code=roomCode(),room={code,board:emptyBoard(),players:{red:socketId,yellow:null},currentTurn:'red',status:'waiting',winner:null,winningCells:[]};rooms.set(code,room);c.roomCode=code;c.player='red';sse(c,'room',{roomCode:code,player:'red'});sse(c,'state',state(room));return send(res,200,'application/json',JSON.stringify({ok:true}));
      }
      if(url.pathname==='/room/join'){
        const result=join(b.socketId,b.code);if(result.error)return send(res,400,'application/json',JSON.stringify(result));const c=clients.get(b.socketId);sse(c,'room',{roomCode:result.room.code,player:'yellow'});broadcast(result.room);return send(res,200,'application/json',JSON.stringify({ok:true}));
      }
      if(url.pathname==='/game/move'){
        const c=clients.get(b.socketId),room=c&&rooms.get(c.roomCode);if(!c||!room)return send(res,400,'application/json',JSON.stringify({error:'You are not in a room.'}));const error=move(room,Number(b.column),c.player);if(error){sse(c,'error',error);return send(res,400,'application/json',JSON.stringify({error}));}broadcast(room);return send(res,200,'application/json',JSON.stringify({ok:true}));
      }
      if(url.pathname==='/room/leave'){leave(b.socketId);return send(res,200,'application/json',JSON.stringify({ok:true}));}
    }catch(e){return send(res,400,'application/json',JSON.stringify({error:'Invalid request.'}));}
  }
  send(res,404,'text/plain','Not found');
});
server.listen(PORT,'0.0.0.0',()=>console.log(`Connect Four running at http://localhost:${PORT}`));
