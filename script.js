const screens = {1:document.getElementById('screen-1'),2:document.getElementById('screen-2'),3:document.getElementById('screen-3')};
let current=1;
function show(n){Object.values(screens).forEach(s=>s.classList.remove('active'));screens[n].classList.add('active');current=n;}

// Verificación
const verifyBtn=document.getElementById('verifyBtn');
const nameInput=document.getElementById('nameInput');
const err=document.getElementById('err');
verifyBtn.addEventListener('click',()=>{
  const val=(nameInput.value||'').trim();
  if(val==='MARBELLA MARTINEZ LUIS'){err.style.display='none';show(2);}else{err.style.display='block';}
});
document.getElementById('clearBtn').addEventListener('click',()=>{nameInput.value='';nameInput.focus();err.style.display='none';});

// --- Collage persistente ---
const filesEl=document.getElementById('files');
const grid=document.getElementById('grid');
const resetCollage=document.getElementById('resetCollage');
const toLetter=document.getElementById('toLetter');
let images=JSON.parse(localStorage.getItem('collageImages')||'[]');
renderGrid();

filesEl.addEventListener('change',(e)=>{
  const chosen=Array.from(e.target.files);
  chosen.forEach(file=>{
    if(!file.type.startsWith('image/'))return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      images.push({name:file.name,src:ev.target.result});
      saveImages();renderGrid();
    };
    reader.readAsDataURL(file);
  });
  filesEl.value='';
});

function renderGrid(){
  grid.innerHTML='';
  images.forEach((img,i)=>{
    const div=document.createElement('div');
    div.className='thumb';
    div.innerHTML=`<img src="${img.src}" alt="img-${i}"><div class="remove">✕</div>`;
    div.querySelector('.remove').addEventListener('click',()=>{
      images.splice(i,1);saveImages();renderGrid();
    });
    grid.appendChild(div);
  });
}
function saveImages(){localStorage.setItem('collageImages',JSON.stringify(images));}
resetCollage.addEventListener('click',()=>{if(confirm('¿Seguro que deseas borrar todas las imágenes?')){images=[];saveImages();renderGrid();}});
toLetter.addEventListener('click',()=>show(3));

// --- Fondo persistente ---
const bgUpload=document.getElementById('bgUpload');
const savedBg=localStorage.getItem('bgImage');
if(savedBg)document.body.style.setProperty('background-image',`url(${savedBg})`);
bgUpload.addEventListener('change',e=>{
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const data=ev.target.result;
    localStorage.setItem('bgImage',data);
    document.body.style.backgroundImage=`url(${data})`;
  };
  reader.readAsDataURL(file);
});

// Botones básicos
document.getElementById('backBtn').addEventListener('click',()=>{if(current>1)show(current-1);});
document.getElementById('downloadLetter').addEventListener('click',()=>{
  const text=document.querySelector('.letter').innerText;
  const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='carta_marabella.txt';
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
});

// Sonido ambiente
let audioCtx,masterGain,isPlaying=false,noiseNode,oscA,oscB;
const toggleAudio=document.getElementById('toggleAudio');
const audioState=document.getElementById('audioState');
function startAmbient(){
  audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  masterGain=audioCtx.createGain();masterGain.gain.value=0.0;masterGain.connect(audioCtx.destination);
  oscA=audioCtx.createOscillator();oscA.type='sine';oscA.frequency.value=110;
  oscB=audioCtx.createOscillator();oscB.type='sine';oscB.frequency.value=114;
  const fader=audioCtx.createGain();fader.gain.value=0.15;oscA.connect(fader);oscB.connect(fader);fader.connect(masterGain);
  const bufferSize=2*audioCtx.sampleRate;
  const noiseBuffer=audioCtx.createBuffer(1,bufferSize,audioCtx.sampleRate);
  const output=noiseBuffer.getChannelData(0);
  for(let i=0;i<bufferSize;i++){output[i]=(Math.random()*2-1)*0.003;}
  noiseNode=audioCtx.createBufferSource();noiseNode.buffer=noiseBuffer;noiseNode.loop=true;
  const noiseGain=audioCtx.createGain();noiseGain.gain.value=0.02;
  noiseNode.connect(noiseGain);noiseGain.connect(masterGain);
  const lfo=audioCtx.createOscillator();lfo.type='sine';lfo.frequency.value=0.07;
  const lfoGain=audioCtx.createGain();lfoGain.gain.value=0.03;
  lfo.connect(lfoGain);lfoGain.connect(masterGain.gain);
  oscA.start();oscB.start();noiseNode.start();lfo.start();
  masterGain.gain.linearRampToValueAtTime(0.16,audioCtx.currentTime+2.5);
  isPlaying=true;audioState.textContent='Ambiente: ON';toggleAudio.textContent='Pausar ambiente';
}
function stopAmbient(){
  if(!audioCtx)return;
  masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.0,audioCtx.currentTime+1.5);
  setTimeout(()=>{try{oscA.stop();oscB.stop();noiseNode.stop();audioCtx.close();}catch(e){}
    audioCtx=null;isPlaying=false;audioState.textContent='Silencio';toggleAudio.textContent='Reproducir ambiente';},1700);
}
toggleAudio.addEventListener('click',()=>{if(!isPlaying)startAmbient();else stopAmbient();});
nameInput.addEventListener('keyup',(e)=>{if(e.key==='Enter')verifyBtn.click();});
nameInput.focus();
