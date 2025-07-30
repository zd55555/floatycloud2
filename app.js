/* =========================================================
   Floaty Cloud – vanilla-JS endless “flappy” game
   Extra features: pause, day/night shift, star parallax
   ========================================================= */

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

/* ---------- helpers ------------------ */
function resize(){
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

function rand(min,max){ return Math.random()*(max-min)+min; }

/* ---------- game constants ----------- */
const gravity      = 0.4;
const flapStrength = -8;
const obstacleGap  = 1500;
const starCount    = 60;

/* ---------- state -------------------- */
const player = { x: 0, y: 0, r: 24, vy: 0 };
let score = 0, highScore = parseInt(localStorage.getItem('floatyHigh')||0,10);
let gameRunning = true, paused = false;
const obstacles = [];
let obstacleTimer = 0;

/* stars for parallax night sky */
const stars = [];
function initStars(){
  stars.length = 0;
  for(let i=0;i<starCount;i++){
    stars.push({x:rand(0,canvas.width), y:rand(0,canvas.height), s:rand(1,3)});
  }
}
initStars();

/* ---------- obstacle factory ---------- */
function spawnObstacle(){
  const size = rand(50,90);
  const yPos = rand(60, canvas.height-60);
  obstacles.push({
    x: canvas.width + size,
    y: yPos,
    w: size,
    h: size,
    type: Math.random() < 0.5 ? 'cloud':'bird'
  });
}

/* ---------- reset --------------------- */
function reset(){
  obstacles.length = 0;
  score=0;
  gameRunning=true;
  paused=false;
  obstacleTimer=0;
  player.x = canvas.width*0.25;
  player.y = canvas.height*0.5;
  player.vy=0;
  initStars();
}
reset();

/* ---------- input --------------------- */
function flap(){
  if(!gameRunning){
    reset();
  }else if(paused){
    paused=false;
  }else{
    player.vy = flapStrength;
  }
}
canvas.addEventListener('pointerdown', flap);
window.addEventListener('keydown', e=>{
  if(e.code==='Space'){ flap(); }
  if(e.code==='KeyP'){ paused=!paused; }
});
canvas.addEventListener('dblclick', ()=>{ paused=!paused; });

/* ---------- update -------------------- */
function update(dt){
  if(!gameRunning || paused) return;

  // physics
  player.vy += gravity;
  player.y  += player.vy;

  if(player.y+player.r > canvas.height || player.y-player.r<0){
    endGame();
  }

  obstacleTimer += dt;
  if(obstacleTimer > obstacleGap){
    spawnObstacle();
    obstacleTimer=0;
  }

  // move obstacles
  const speed = 3 + Math.min(8, score/200);
  for(let i=obstacles.length-1; i>=0; i--){
    const o = obstacles[i];
    o.x -= speed;

    // collision (circle-rect)
    const nearestX = Math.max(o.x-o.w/2, Math.min(player.x, o.x+o.w/2));
    const nearestY = Math.max(o.y-o.h/2, Math.min(player.y, o.y+o.h/2));
    const dx = player.x - nearestX;
    const dy = player.y - nearestY;
    if(dx*dx+dy*dy < player.r*player.r){
      endGame();
    }

    // out of screen
    if(o.x + o.w/2 < 0){
      obstacles.splice(i,1);
      score++;
    }
  }

  // move stars slowly
  stars.forEach(st=>{
    st.x -= 0.5;
    if(st.x < 0){ st.x = canvas.width; st.y = rand(0,canvas.height); }
  });
}

function endGame(){
  gameRunning=false;
  if(navigator.vibrate) navigator.vibrate(100);
  highScore = Math.max(highScore, score);
  localStorage.setItem('floatyHigh', highScore);
}

/* ---------- draw ---------------------- */
function draw(){
  // sky
  const night = (score % 400 > 200);
  ctx.fillStyle = night ? getComputedStyle(document.documentElement).getPropertyValue('--sky-night')
                        : getComputedStyle(document.documentElement).getPropertyValue('--sky-day');
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // stars when night
  if(night){
    ctx.fillStyle = '#fff';
    stars.forEach(st=>{
      ctx.fillRect(st.x, st.y, st.s, st.s);
    });
  }

  // player (cloud body)
  ctx.fillStyle='#fff';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
  ctx.fill();
  // umbrella
  ctx.strokeStyle='#feda3e';
  ctx.lineWidth=4;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y-player.r);
  ctx.lineTo(player.x, player.y-player.r-30);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(player.x, player.y-player.r-30, 20, Math.PI, 2*Math.PI);
  ctx.fillStyle='#feda3e';
  ctx.fill();

  // obstacles
  obstacles.forEach(o=>{
    if(o.type==='cloud'){
      ctx.fillStyle='#888';
      ctx.beginPath();
      ctx.ellipse(o.x, o.y, o.w/2, o.h/3, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle='#ff0';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y+o.h/3);
      ctx.lineTo(o.x+5, o.y+o.h/2);
      ctx.lineTo(o.x-5, o.y+o.h*0.66);
      ctx.stroke();
    }else{
      ctx.fillStyle='#000';
      ctx.beginPath();
      ctx.moveTo(o.x-o.w/2, o.y);
      ctx.lineTo(o.x, o.y-o.h/4);
      ctx.lineTo(o.x+o.w/2, o.y);
      ctx.lineTo(o.x, o.y+o.h/4);
      ctx.closePath();
      ctx.fill();
    }
  });

  // score HUD
  ctx.fillStyle='#fff';
  ctx.textAlign='center';
  ctx.font='bold 24px monospace';
  ctx.fillText(score, canvas.width/2, 40);

  if(!gameRunning){
    ctx.font='bold 28px monospace';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2 - 20);
    ctx.font='bold 18px monospace';
    ctx.fillText('Tap to restart', canvas.width/2, canvas.height/2 + 10);
    ctx.fillText('High: '+highScore, canvas.width/2, canvas.height/2 + 35);
  }else if(paused){
    ctx.font='bold 28px monospace';
    ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
    ctx.font='bold 18px monospace';
    ctx.fillText('Double-tap or press P to resume', canvas.width/2, canvas.height/2 + 30);
  }
}

/* ---------- loop ---------------------- */
let last=0;
function loop(now){
  const dt = now - last;
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ---------- Service worker ------------ */
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js');
}
