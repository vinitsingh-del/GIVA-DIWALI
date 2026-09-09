(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile nav
  const menu = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (menu && mobileNav) {
    const closeNav = () => { mobileNav.classList.remove('open'); mobileNav.setAttribute('aria-hidden','true'); menu.setAttribute('aria-expanded','false'); };
    menu.addEventListener('click', () => {
      const open = !mobileNav.classList.contains('open');
      mobileNav.classList.toggle('open', open);
      mobileNav.setAttribute('aria-hidden', String(!open));
      menu.setAttribute('aria-expanded', String(open));
    });
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
  }

  // Hero carousel: 3 slides, autoplay + manual + touch swipe.
  const slider = document.querySelector('[data-slider]');
  if (slider) {
    const slides = [...slider.querySelectorAll('[data-slide]')];
    const dots = [...slider.querySelectorAll('[data-dot]')];
    let index = 0, timer = null, startX = 0;
    const show = n => {
      index = (n + slides.length) % slides.length;
      slides.forEach((s,i) => s.classList.toggle('active', i === index));
      dots.forEach((d,i) => {
        const active = i === index;
        d.classList.toggle('active', active);
        d.setAttribute('aria-selected', String(active));
      });
    };
    const play = () => { if (reduced) return; clearInterval(timer); timer = setInterval(() => show(index + 1), 5200); };
    slider.querySelector('.next')?.addEventListener('click', () => { show(index+1); play(); });
    slider.querySelector('.prev')?.addEventListener('click', () => { show(index-1); play(); });
    dots.forEach((d,i) => d.addEventListener('click', () => { show(i); play(); }));
    slider.addEventListener('pointerdown', e => { startX = e.clientX; });
    slider.addEventListener('pointerup', e => { const dx = e.clientX - startX; if (Math.abs(dx) > 55) { show(index + (dx < 0 ? 1 : -1)); play(); } });
    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', play);
    play();
  }

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if (reduced) revealEls.forEach(el => el.classList.add('visible'));
  else {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); }
    }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  // Wish buttons are local demo interactions only.
  document.querySelectorAll('.wish').forEach(btn => btn.addEventListener('click', () => {
    btn.textContent = btn.textContent === '♥' ? '♡' : '♥';
  }));

  // Play & Win modal: deliberately lightweight prototype interaction.
  const modal = document.getElementById('gameModal');
  const title = document.getElementById('gameTitle');
  const text = document.getElementById('gameText');
  const action = document.getElementById('gameAction');
  const reward = document.getElementById('rewardMessage');
  let game = 'crackers';
  const openGame = type => {
    game = type;
    title.textContent = type === 'crackers' ? 'Burst the Crackers' : 'Catch the Mithai';
    text.textContent = type === 'crackers' ? 'Tap the button and enjoy a small web-native firework moment.' : 'Tap the button for a festive demo reward moment.';
    action.textContent = type === 'crackers' ? 'Burst now' : 'Catch now';
    reward.textContent = '';
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); body.classList.add('no-scroll');
  };
  const closeGame = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); body.classList.remove('no-scroll'); };
  document.querySelectorAll('[data-game]').forEach(btn => btn.addEventListener('click', () => openGame(btn.dataset.game)));
  document.querySelectorAll('[data-close-game]').forEach(btn => btn.addEventListener('click', closeGame));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeGame(); });
  action?.addEventListener('click', () => {
    reward.textContent = game === 'crackers' ? 'Festive sparkle unlocked!' : 'Festive treat unlocked!';
    burstParticles(modal.querySelector('.modal-card'), 42);
  });

  // Newsletter demo feedback
  document.getElementById('newsletter')?.addEventListener('submit', e => {
    e.preventDefault();
    document.getElementById('newsletterMessage').textContent = 'Thank you — demo subscription captured locally.';
    e.currentTarget.reset();
  });

  // Non-AI, web-native canvas sparkle/firework systems.
  function setupCanvas(canvas, intensity = 1) {
    if (!canvas || reduced) return;
    const ctx = canvas.getContext('2d');
    let w=0,h=0,dpr=Math.min(window.devicePixelRatio||1,2), particles=[];
    const resize = () => {
      const rect = canvas.getBoundingClientRect(); w=rect.width; h=rect.height;
      canvas.width=Math.max(1,Math.round(w*dpr)); canvas.height=Math.max(1,Math.round(h*dpr));
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    const launch = () => {
      const x = Math.random()*w*.85 + w*.075, y = Math.random()*h*.42 + h*.06;
      const count = Math.round(18*intensity);
      const hue = Math.random()>.45 ? '#ffd36a' : '#e9718b';
      for(let i=0;i<count;i++){
        const a=(Math.PI*2*i/count)+Math.random()*.16, s=1+Math.random()*2.2;
        particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:1+Math.random()*1.4,c:hue});
      }
    };
    let last=0;
    const draw=t=>{
      ctx.clearRect(0,0,w,h);
      if(t-last>2200/intensity){launch();last=t;}
      particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.008;p.vx*=.995;p.life-=.012;ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();});
      particles=particles.filter(p=>p.life>0);ctx.globalAlpha=1;requestAnimationFrame(draw);
    };
    resize(); window.addEventListener('resize',resize,{passive:true}); requestAnimationFrame(draw);
  }
  setupCanvas(document.getElementById('festiveCanvas'), .75);
  setupCanvas(document.getElementById('closingCanvas'), 1.15);

  function burstParticles(container, count){
    if(reduced || !container) return;
    const rect=container.getBoundingClientRect();
    for(let i=0;i<count;i++){
      const p=document.createElement('i');
      const angle=Math.random()*Math.PI*2, dist=70+Math.random()*120;
      p.style.cssText=`position:absolute;left:50%;top:38%;width:${2+Math.random()*4}px;height:${2+Math.random()*4}px;border-radius:50%;background:${Math.random()>.45?'#ffd36a':'#e9718b'};pointer-events:none;z-index:8;transition:transform .8s ease-out,opacity .8s ease-out;`;
      container.appendChild(p);
      requestAnimationFrame(()=>{p.style.transform=`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px)`;p.style.opacity='0';});
      setTimeout(()=>p.remove(),850);
    }
  }
})();


// Cursor firecracker tracer.
(() => {
  if (!window.matchMedia('(pointer:fine)').matches || window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-firework-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  let particles = [];
  let lastSpawn = 0;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const spark = (x, y) => {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = .7 + Math.random() * 2.1;
      particles.push({x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, size: 1 + Math.random() * 2, color: Math.random() > .35 ? '#ffd66d' : '#e9718b'});
    }
  };
  window.addEventListener('pointermove', event => {
    const now = performance.now();
    if (now - lastSpawn < 22) return;
    lastSpawn = now;
    spark(event.clientX, event.clientY);
  }, { passive: true });
  const draw = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += .035; p.life -= .035;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    particles = particles.filter(p => p.life > 0);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    requestAnimationFrame(draw);
  };
  resize();
  addEventListener('resize', resize, { passive: true });
  requestAnimationFrame(draw);
})();
