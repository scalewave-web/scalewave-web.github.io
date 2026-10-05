// ScaleWave site: 3D wave background, mouse tilt, scroll reveals, mobile menu. No libraries.
(function () {
  document.documentElement.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav: solid background after scrolling; mobile menu toggle.
  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const menuBtn = document.querySelector('.menu-btn');
  const links = document.querySelector('.nav-links');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? '✕' : '☰';
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = '☰';
    }));
  }

  // Reveal sections as they scroll into view.
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  // 3D tilt: the hero phone stage follows the mouse; cards tilt slightly on hover.
  const stage = document.querySelector('.stage');
  const inner = document.querySelector('.stage-inner');
  if (stage && inner && !reduce && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('mousemove', e => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      inner.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 10}deg)`;
    });
  }
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.tilt').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  // 3D wave of dots behind the hero (the "wave" in ScaleWave). Pauses when off screen.
  const canvas = document.getElementById('wave');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, running = true, t = 0;
  const COLS = 54, ROWS = 26;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    const fov = 420, camY = -120, horizon = h * 0.42;
    for (let r = 0; r < ROWS; r++) {
      const z = 120 + r * 34;                       // depth away from the viewer
      for (let c = 0; c < COLS; c++) {
        const x = (c - COLS / 2) * 38;
        const y = Math.sin(c * 0.22 + t * 1.1) * 26 + Math.cos(r * 0.32 + t * 0.8) * 22 + Math.sin((c + r) * 0.12 + t * 0.6) * 14;
        const s = fov / (fov + z);
        const px = w / 2 + x * s;
        const py = horizon + (y - camY) * s + (ROWS - r) * 6;
        if (px < -10 || px > w + 10 || py < -10 || py > h + 10) continue;
        const depth = r / ROWS;                     // 0 = near, 1 = far
        const mix = (c / COLS);
        const red = Math.round(46 + (139 - 46) * mix), green = Math.round(230 + (92 - 230) * mix), blue = Math.round(197 + (246 - 197) * mix);
        ctx.fillStyle = `rgba(${red},${green},${blue},${(1 - depth) * 0.75 + 0.05})`;
        const size = Math.max(0.6, 2.6 * s);
        ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  function loop() {
    if (!running) return;
    t += 0.012; frame(); requestAnimationFrame(loop);
  }
  resize();
  window.addEventListener('resize', () => { resize(); if (reduce) frame(); });
  if (reduce) { frame(); return; }
  const heroEl = canvas.parentElement;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      const vis = e.isIntersecting && !document.hidden;
      if (vis && !running) { running = true; loop(); } else if (!vis) running = false;
    }).observe(heroEl);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) running = false; else if (!running) { running = true; loop(); } });
  loop();
})();
