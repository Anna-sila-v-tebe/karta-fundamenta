
  const ZONES=[
    {id:1,name:'Отношения',sub:'Ловушка эмпата'},
    {id:2,name:'Семья и роли',sub:'«Хорошая девочка»'},
    {id:3,name:'Деньги и ценность',sub:'Золото за медь'},
    {id:4,name:'Проявленность',sub:'Маяк в тумане'},
    {id:5,name:'Желания',sub:'Чужое меню'},
    {id:6,name:'Эмиграция и переход',sub:'Чемодан без ручки'},
    {id:7,name:'Страх быть неудобной',sub:'Маска приличия'}
  ];
  const KEY='karta-opory-v2';
  let state={scores:{},name:'',contact:''};
  try{const s=localStorage.getItem(KEY);if(s)state=Object.assign(state,JSON.parse(s));}catch(e){}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}};

  // sliders
  document.querySelectorAll('.zscore').forEach(sl=>{
    const z=sl.dataset.zone;
    const valEl=document.querySelector('[data-val-for="'+z+'"]');
    if(state.scores[z]!==undefined){sl.value=state.scores[z];valEl.querySelector('span').textContent=state.scores[z];valEl.removeAttribute('data-empty');}
    sl.addEventListener('input',()=>{
      const v=parseInt(sl.value,10);
      state.scores[z]=v;valEl.querySelector('span').textContent=v;valEl.removeAttribute('data-empty');
      save();updateAll();
    });
  });

  // score buttons use the existing range inputs and their input handlers
  document.querySelectorAll('.score-picker').forEach(picker=>{
    const sl=picker.querySelector('.zscore');
    const z=sl.dataset.zone;
    const buttons=[];
    const sync=()=>{
      const selected=state.scores[z];
      buttons.forEach(btn=>btn.classList.toggle('is-selected',parseInt(btn.value,10)===selected));
    };
    for(let value=1;value<=10;value++){
      const btn=document.createElement('button');
      btn.type='button';btn.className='score-option';btn.value=value;btn.textContent=value;
      btn.setAttribute('aria-label','Оценка '+value+' из 10');
      btn.addEventListener('click',()=>{
        sl.value=value;
        sl.dispatchEvent(new Event('input',{bubbles:true}));
      });
      picker.appendChild(btn);buttons.push(btn);
    }
    sl.addEventListener('input',sync);
    sync();
  });

  // flip cards
  document.querySelectorAll('[data-flip]').forEach(c=>c.addEventListener('click',()=>c.classList.toggle('flipped')));

  function band(total){
    if(total<=25)return{name:'Тотальный шторм',cls:'lvl-low'};
    if(total<=50)return{name:'Качающийся парусник',cls:'lvl-mid'};
    return{name:'Свой курс',cls:'lvl-high'};
  }
  function zlvl(v){if(v<=3)return'lvl-low';if(v<=6)return'lvl-mid';return'lvl-high';}

  function updateAll(){
    const table=document.getElementById('summaryTable');
    let total=0,answered=0,weakest=null,weakScore=99;
    let html='';
    ZONES.forEach(z=>{
      const v=state.scores[z.id];
      const has=v!==undefined;
      if(has){total+=v;answered++;if(v<weakScore){weakScore=v;weakest=z;}}
      const roman=['I','II','III','IV','V','VI','VII'][z.id-1];
      const lvlName=!has?'нет данных':(v<=3?'критично':v<=6?'утечка':'опора');
      html+='<div class="summary-row" data-row="'+z.id+'"><span class="num">'+roman+'</span>'
        +'<span class="name">'+z.name+'<small>'+z.sub+'</small></span>'
        +'<span class="score">'+(has?v:'—')+'<small>'+(has?'/10':'')+'</small></span>'
        +'<span class="level '+(has?zlvl(v):'lvl-empty')+'">'+lvlName+'</span></div>';
    });
    table.innerHTML=html;
    document.getElementById('summaryTotal').textContent=total;
    document.getElementById('totalScore').textContent=total+' / 70';
    const pct=answered/7*100;
    document.getElementById('progressFill').style.width=pct+'%';
    document.getElementById('progressSail').style.left=pct+'%';

    if(answered===7 && weakest){
      document.querySelector('[data-row="'+weakest.id+'"]').classList.add('weakest');
      const b=band(total);
      document.getElementById('verdictTitle').textContent=b.name+' · '+total+'/70';
      document.getElementById('verdictMsg').innerHTML='Ваша самая уязвимая зона — <strong>«'+weakest.name+'»</strong> ('+weakScore+'/10). Именно здесь критически не хватает опоры на себя. С неё я и предлагаю начать на бесплатном разборе — найдём корневую установку и ваш первый шаг.';
    } else if(answered>0 && weakest){
      document.getElementById('verdictTitle').textContent='Заполнено '+answered+' из 7';
      document.getElementById('verdictMsg').textContent='Пока самая слабая опора — в зоне «'+weakest.name+'». Пройдите оставшиеся тесты для точной карты.';
    }
  }

  // contact (optional, may be absent in practicum layout)
  const fName=document.getElementById('fName'),fContact=document.getElementById('fContact');
  if(fName&&fContact){
    if(state.name)fName.value=state.name; if(state.contact)fContact.value=state.contact;
    fName.addEventListener('input',()=>{state.name=fName.value;save();});
    fContact.addEventListener('input',()=>{state.contact=fContact.value;save();});
  }

  const sendBtn=document.getElementById('sendBtn');
  if(sendBtn) sendBtn.addEventListener('click',()=>{
    save();
    const cw=document.getElementById('codeWord');
    if(cw){cw.classList.remove('hidden');cw.scrollIntoView({behavior:'smooth',block:'center'});}
    const c=(state.contact||'').replace(/^@/,'').trim();
    const tg=document.getElementById('tgBtn');
    if(tg && c && /^[A-Za-z0-9_]{3,}$/.test(c)){tg.href='https://t.me/'+c;}
  });

  const dlBtn=document.getElementById('downloadBtn');
  if(dlBtn) dlBtn.addEventListener('click',e=>{
    e.preventDefault();
    let t='КАРТА ОПОРЫ · Мои ответы\n========================\n\n';
    t+='Имя: '+(state.name||'—')+'\nTelegram: '+(state.contact||'—')+'\n\n';
    let total=0;
    ZONES.forEach(z=>{const v=state.scores[z.id];if(v!==undefined)total+=v;t+='Зона '+z.id+'. '+z.name+': '+(v!==undefined?v+'/10':'не пройдено')+'\n';});
    t+='\nИТОГО: '+total+' / 70\n';
    const blob=new Blob([t],{type:'text/plain;charset=utf-8'});
    const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='Karta-Opory.txt';a.click();URL.revokeObjectURL(u);
  });

  // stars
  document.querySelectorAll('.starry-bg').forEach(c=>{
    for(let i=0;i<26;i++){const s=document.createElement('div');s.className='star';const sz=Math.random()*2.5+1;
      s.style.cssText='width:'+sz+'px;height:'+sz+'px;top:'+(Math.random()*100)+'%;left:'+(Math.random()*100)+'%;--duration:'+(Math.random()*3+2)+'s;--delay:'+(Math.random()*4)+'s;';c.appendChild(s);}
  });

  // fade-in
  const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}});},{threshold:0.12,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.fade-in-block').forEach(el=>io.observe(el));

  // scratch
  (function(){
    const canvas=document.getElementById('scratchCanvas');if(!canvas)return;
    const wrap=canvas.closest('.scratch-wrapper');const ctx=canvas.getContext('2d');
    function draw(){canvas.width=wrap.offsetWidth;canvas.height=wrap.offsetHeight;
      const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);
      g.addColorStop(0,'#D4A853');g.addColorStop(0.5,'#C49040');g.addColorStop(1,'#B85C38');
      ctx.globalCompositeOperation='source-over';ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='rgba(255,255,255,0.55)';ctx.font='600 '+Math.max(13,canvas.width*0.026)+"px 'Montserrat',sans-serif";ctx.textAlign='center';
      ctx.fillText('✦  Сотри, чтобы открыть послание  ✦',canvas.width/2,canvas.height/2);
      ctx.globalCompositeOperation='destination-out';}
    draw();window.addEventListener('resize',draw);
    let drawing=false;
    function pos(e){const r=canvas.getBoundingClientRect();const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;const y=(e.touches?e.touches[0].clientY:e.clientY)-r.top;return{x:x*(canvas.width/r.width),y:y*(canvas.height/r.height)};}
    function scratch(e){if(!drawing)return;e.preventDefault();const p=pos(e);ctx.beginPath();ctx.arc(p.x,p.y,26,0,Math.PI*2);ctx.fill();check();}
    function check(){const d=ctx.getImageData(0,0,canvas.width,canvas.height).data;let tr=0;for(let i=3;i<d.length;i+=4)if(d[i]<128)tr++;if(tr/(canvas.width*canvas.height)>0.55){canvas.style.transition='opacity .8s ease';canvas.style.opacity='0';setTimeout(()=>canvas.remove(),800);}}
    canvas.addEventListener('mousedown',e=>{drawing=true;scratch(e);});
    canvas.addEventListener('mousemove',scratch);
    window.addEventListener('mouseup',()=>drawing=false);
    canvas.addEventListener('touchstart',e=>{drawing=true;scratch(e);},{passive:false});
    canvas.addEventListener('touchmove',scratch,{passive:false});
    canvas.addEventListener('touchend',()=>drawing=false);
  })();

  // smooth anchor
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');if(id.length>1){const t=document.querySelector(id);if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});}}}));

  updateAll();
