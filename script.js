// NAV scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// Hamburger
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.toggle('open');
});

// Hero canvas particles
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
let bgParticles = [];
let waveLines = [];
let waveParticles = [];
let time = 0;
let targetSpeedMultiplier = 1;
let currentSpeedMultiplier = 1;
let mouse = { x: -1000, y: -1000, radius: 150 };

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
window.addEventListener('mouseleave', () => {
  mouse.x = -1000;
  mouse.y = -1000;
});

const activateBtn = document.querySelector('.hero-actions .btn-primary');
if (activateBtn) {
  activateBtn.addEventListener('mouseenter', () => targetSpeedMultiplier = 5.0);
  activateBtn.addEventListener('mouseleave', () => targetSpeedMultiplier = 1);
}

function initParticles() {
  bgParticles = Array.from({length: 250}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2,
    alpha: Math.random() * 0.5 + 0.1,
    speed: Math.random() * 0.4 + 0.1
  }));

  // Define multiple overlapping wave paths
  // Split into top flow and bottom flow to avoid text overlap
  waveLines = [
    // Top flow (above text, below nav buttons)
    { amp: 30, freq: 0.002, speed: 0.015, offset: -270, color: '0, 212, 255', width: 2 },
    { amp: 25, freq: 0.003, speed: 0.01,  offset: -300, color: '124, 58, 237', width: 1.5 },
    { amp: 35, freq: 0.0015, speed: 0.012, offset: -330, color: '0, 100, 255', width: 1.5 },
    { amp: 20, freq: 0.0025, speed: 0.018, offset: -250, color: '0, 255, 200', width: 1 },
    { amp: 40, freq: 0.001, speed: 0.008, offset: -310, color: '200, 100, 255', width: 2 },
    { amp: 20, freq: 0.004, speed: 0.02, offset: -290, color: '100, 200, 255', width: 1 },
    
    // Bottom flow (below text)
    { amp: 40, freq: 0.0025, speed: 0.018, offset: 300, color: '0, 255, 200', width: 2 },
    { amp: 35, freq: 0.004, speed: 0.02, offset: 340, color: '200, 100, 255', width: 1.5 },
    { amp: 50, freq: 0.001, speed: 0.008, offset: 380, color: '0, 212, 255', width: 1 },
    { amp: 30, freq: 0.002, speed: 0.015, offset: 280, color: '124, 58, 237', width: 2 },
    { amp: 45, freq: 0.0015, speed: 0.012, offset: 420, color: '0, 100, 255', width: 1.5 },
    { amp: 25, freq: 0.003, speed: 0.01, offset: 360, color: '100, 200, 255', width: 1 }
  ];

  waveParticles = Array.from({length: 3000}, () => {
    return {
      waveIndex: Math.floor(Math.random() * waveLines.length),
      x: Math.random() * canvas.width,
      speed: (Math.random() * 1.5 + 0.5) * 0.5,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.8 + 0.2,
      isNode: Math.random() < 0.008 // Reduced frequency because there are so many particles now
    }
  });
}
initParticles();

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  currentSpeedMultiplier += (targetSpeedMultiplier - currentSpeedMultiplier) * 0.05;
  time += 0.5 * currentSpeedMultiplier;

  // Background stars
  bgParticles.forEach(p => {
    p.x -= p.speed * currentSpeedMultiplier;
    if (p.x < 0) p.x = canvas.width;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
    ctx.fill();
  });

  ctx.globalCompositeOperation = 'screen';
  const centerY = canvas.height * 0.5; // Centered vertically

  // Removed solid continuous wave lines, only rendering dots now.

  // Draw particles traveling along the waves
  waveParticles.forEach(p => {
    p.x += p.speed * currentSpeedMultiplier;
    if (p.x > canvas.width) p.x = 0;
    
    const w = waveLines[p.waveIndex];
    let drawX = p.x;
    let drawY = centerY + 
              Math.sin(p.x * w.freq + time * w.speed) * w.amp + 
              Math.cos(p.x * w.freq * 0.5 - time * w.speed * 0.5) * (w.amp * 0.4) + 
              w.offset;
    let drawSize = p.size;
              
    // Mouse hover interaction: Repel particles and increase size
    const dx = drawX - mouse.x;
    const dy = drawY - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < mouse.radius && dist > 0) {
      const force = (mouse.radius - dist) / mouse.radius;
      const repelStrength = force * force * 50; // Smooth non-linear push
      drawX += (dx / dist) * repelStrength;
      drawY += (dy / dist) * repelStrength;
      drawSize += force * 4; // Increase size on hover proportionally
    }
    
    ctx.beginPath();
    ctx.arc(drawX, drawY, drawSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${w.color}, ${p.alpha})`;
    ctx.fill();
    
    if (p.isNode) {
      // Smooth glowing node using radial gradient
      const gradient = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, drawSize * 12);
      gradient.addColorStop(0, `rgba(255, 255, 255, 0.9)`);
      gradient.addColorStop(0.1, `rgba(${w.color}, 0.8)`);
      gradient.addColorStop(0.4, `rgba(${w.color}, 0.3)`);
      gradient.addColorStop(1, `rgba(${w.color}, 0)`);
      
      ctx.beginPath();
      ctx.arc(drawX, drawY, drawSize * 12, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  });

  ctx.globalCompositeOperation = 'source-over';
  requestAnimationFrame(drawParticles);
}
drawParticles();

// Signal card switching
const signalCards = document.querySelectorAll('.signal-card');
signalCards.forEach(card => {
  card.addEventListener('click', () => {
    signalCards.forEach(c => c.classList.remove('signal-card--active'));
    card.classList.add('signal-card--active');
    const sig = card.dataset.signal;
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
    const scene = document.getElementById('scene-' + sig);
    if (scene) scene.classList.add('active');
  });
});

// How-it-works timeline scroll activation
const howSteps = document.querySelectorAll('.how-step');
const spineFill = document.getElementById('spineFill');

function activateSteps() {
  let activeCount = 0;
  howSteps.forEach((step, i) => {
    const rect = step.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.75) {
      step.classList.add('active');
      activeCount = i + 1;
    }
  });
  if (spineFill && howSteps.length) {
    spineFill.style.height = (activeCount / howSteps.length * 100) + '%';
  }
}
window.addEventListener('scroll', activateSteps);
activateSteps();

// Metric gauge animation on scroll
const metricCards = document.querySelectorAll('.metric-card');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.gauge-fill').forEach(g => {
        g.style.animation = 'none';
        void g.offsetWidth;
        g.style.animation = '';
      });
    }
  });
}, {threshold: 0.3});
metricCards.forEach(c => observer.observe(c));

// Contact form
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const success = document.getElementById('formSuccess');
  success.style.display = 'block';
  this.reset();
  setTimeout(() => success.style.display = 'none', 5000);
});
