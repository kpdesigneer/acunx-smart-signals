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

let currentShape = 'cube';
let targetShape = 'cube';
let shapeMorphProgress = 0;

// Cube definition for morphing
const cubeSize = 120;
const cubeVertices = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
];
const cubeEdges = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7]
];
// Precompute two perpendicular unit axes for each edge (for thickness displacement)
const cubeEdgeDirs = cubeEdges.map(([a, b]) => {
  const d = cubeVertices[b].map((v, i) => v - cubeVertices[a][i]);
  if (Math.abs(d[0]) > 0.5) return { p1: [0,1,0], p2: [0,0,1] }; // along X
  if (Math.abs(d[1]) > 0.5) return { p1: [1,0,0], p2: [0,0,1] }; // along Y
  return { p1: [1,0,0], p2: [0,1,0] }; // along Z
});

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

// Intent Card Hover
const intentCards = document.querySelectorAll('[data-signal="intent"]');
intentCards.forEach(card => {
  card.addEventListener('mouseenter', () => targetShape = 'search');
  card.addEventListener('mouseleave', () => targetShape = 'cube');
});

function initParticles() {
  bgParticles = Array.from({ length: 250 }, () => ({
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
    { amp: 60, freq: 0.003, speed: 0.015, offset: -270, color: '0, 212, 255', width: 2 },
    { amp: 50, freq: 0.0045, speed: 0.01, offset: -300, color: '124, 58, 237', width: 1.5 },
    { amp: 70, freq: 0.0022, speed: 0.012, offset: -330, color: '0, 100, 255', width: 1.5 },
    { amp: 40, freq: 0.0035, speed: 0.018, offset: -250, color: '0, 255, 200', width: 1 },
    { amp: 80, freq: 0.0015, speed: 0.008, offset: -310, color: '200, 100, 255', width: 2 },
    { amp: 40, freq: 0.006, speed: 0.02, offset: -290, color: '100, 200, 255', width: 1 },

    // Bottom flow (below text)
    { amp: 80, freq: 0.0035, speed: 0.018, offset: 300, color: '0, 255, 200', width: 2 },
    { amp: 70, freq: 0.006, speed: 0.02, offset: 340, color: '200, 100, 255', width: 1.5 },
    { amp: 100, freq: 0.0015, speed: 0.008, offset: 380, color: '0, 212, 255', width: 1 },
    { amp: 60, freq: 0.003, speed: 0.015, offset: 280, color: '124, 58, 237', width: 2 },
    { amp: 90, freq: 0.0022, speed: 0.012, offset: 420, color: '0, 100, 255', width: 1.5 },
    { amp: 50, freq: 0.0045, speed: 0.01, offset: 360, color: '100, 200, 255', width: 1 }
  ];

  waveParticles = Array.from({ length: 6000 }, () => {
    const inCircle = Math.random() < 0.82;
    // Random starting angle and distance inside the circle
    const ang = Math.random() * Math.PI * 2;
    const rad = Math.sqrt(Math.random()) * 0.5;
    // Random velocity direction, small magnitude
    const vAngle = Math.random() * Math.PI * 2;
    const vMag = 0.00075 + Math.random() * 0.0015;
    
    return {
      waveIndex: Math.floor(Math.random() * waveLines.length),
      x: Math.random() * canvas.width,
      speed: (Math.random() * 1.5 + 0.5) * 0.5,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.8 + 0.2,
      isNode: Math.random() < 0.008,
      cubeEdgeIndex: Math.floor(Math.random() * 12),
      cubeT: Math.random(),
      // Cube edge thickness displacement (random walk perpendicular to each edge)
      cubeOffA: (Math.random() - 0.5) * 0.1,
      cubeOffB: (Math.random() - 0.5) * 0.1,
      cubeVA: (Math.random() - 0.5) * 0.003,
      cubeVB: (Math.random() - 0.5) * 0.003,
      searchSeed1: Math.random(),
      inSearchCircle: inCircle,
      // Random-walk state in shape space
      sx: inCircle ? -0.1 + Math.cos(ang) * rad : 0.3 + Math.random() * 0.5,
      sy: inCircle ? -0.1 + Math.sin(ang) * rad : 0.3 + Math.random() * 0.5,
      svx: Math.cos(vAngle) * vMag,
      svy: Math.sin(vAngle) * vMag
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

  // Calculate morph progress based on scroll distance to signals section
  const scrollY = window.scrollY;
  const signalsSection = document.getElementById('signals');
  const signalsTop = signalsSection ? signalsSection.offsetTop : window.innerHeight;
  let rawProgress = (scrollY - 50) / (signalsTop - window.innerHeight * 0.5);
  rawProgress = Math.max(0, Math.min(1, rawProgress));
  const morphProgress = rawProgress * rawProgress * (3 - 2 * rawProgress); // Smoothstep easing

  // Shape morph animation state
  shapeMorphProgress += (targetShape === 'search' ? 1 - shapeMorphProgress : -shapeMorphProgress) * 0.08;

  // Shape setup
  const cubeX = window.innerWidth * 0.2; // Left side of heading
  const cubeY = window.innerHeight * 0.5; // Centered vertically
  const rotX = time * 0.005 * (1 - shapeMorphProgress); // Flatten rotation for search
  const rotY = time * 0.008 * (1 - shapeMorphProgress);
  const sinX = Math.sin(rotX), cosX = Math.cos(rotX);
  const sinY = Math.sin(rotY), cosY = Math.cos(rotY);

  // Draw particles traveling along the waves
  waveParticles.forEach(p => {
    p.x += p.speed * currentSpeedMultiplier;
    if (p.x > canvas.width) p.x = 0;

    // 1. Wave Calculation
    const w = waveLines[p.waveIndex];
    let waveDrawX = p.x;
    let waveDrawY = centerY +
      Math.sin(p.x * w.freq + time * w.speed) * w.amp +
      Math.cos(p.x * w.freq * 0.5 - time * w.speed * 0.5) * (w.amp * 0.4) +
      w.offset;

    // 2. Shape Calculation (Cube vs Search Flow)
    let lx, ly, lz;
    
    // Cube coordinate
    const cEdge = cubeEdges[p.cubeEdgeIndex];
    const cv1 = cubeVertices[cEdge[0]];
    const cv2 = cubeVertices[cEdge[1]];
    let movingT = (p.cubeT + time * 0.003 * p.speed * currentSpeedMultiplier) % 1;
    let cx = cv1[0] + (cv2[0] - cv1[0]) * movingT;
    let cy = cv1[1] + (cv2[1] - cv1[1]) * movingT;
    let cz = cv1[2] + (cv2[2] - cv1[2]) * movingT;

    if (shapeMorphProgress > 0) {
      // Advance the particle's own random velocity
      p.sx += p.svx * currentSpeedMultiplier;
      p.sy += p.svy * currentSpeedMultiplier;
      
      // Add tiny random jitter to velocity each frame for non-repeating chaos
      p.svx += (Math.random() - 0.5) * 0.0005;
      p.svy += (Math.random() - 0.5) * 0.0005;
      
      // Clamp velocity magnitude so particles don't fly out of control
      const vMag = Math.sqrt(p.svx * p.svx + p.svy * p.svy);
      if (vMag > 0.003) { p.svx *= 0.003 / vMag; p.svy *= 0.003 / vMag; }
      
      // Boundary: keep inside the magnifying glass
      if (p.inSearchCircle) {
        // Circle boundary: center (-0.1, -0.1), radius 0.5
        const dx = p.sx - (-0.1);
        const dy = p.sy - (-0.1);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.5) {
          // Reflect velocity off the circular wall
          const nx = dx / dist; const ny = dy / dist;
          const dot = p.svx * nx + p.svy * ny;
          p.svx -= 2 * dot * nx;
          p.svy -= 2 * dot * ny;
          // Push back inside
          p.sx = -0.1 + nx * 0.49;
          p.sy = -0.1 + ny * 0.49;
        }
      } else {
        // Handle boundary: a thick diagonal band from (0.22,0.22) to (0.95,0.95)
        // Project particle onto the handle axis and clamp
        const t = Math.max(0, Math.min(1, ((p.sx - 0.22) + (p.sy - 0.22)) / (2 * 0.73)));
        const hx = 0.22 + 0.73 * t;
        const hy = 0.22 + 0.73 * t;
        const perp = ((p.sx - hx) - (p.sy - hy)) * 0.5;
        if (Math.abs(perp) > 0.08) {
          p.svx = -p.svx * 0.6;
          p.svy = -p.svy * 0.6;
          p.sx = hx + perp * 0.07 / Math.abs(perp);
          p.sy = hy - perp * 0.07 / Math.abs(perp);
        }
        if (t <= 0 || t >= 1) {
          p.svx = -p.svx * 0.6;
          p.svy = -p.svy * 0.6;
        }
      }
      
      // Scale search icon coordinates 2x to make it twice as large on screen
      const sx = p.sx * 2, sy = p.sy * 2, sz = 0;
      lx = cx + (sx - cx) * shapeMorphProgress;
      ly = cy + (sy - cy) * shapeMorphProgress;
      lz = cz + (sz - cz) * shapeMorphProgress;
    } else {
      lx = cx;
      ly = cy;
      lz = cz;
    }
    
    // Apply cube edge thickness: random displacement perpendicular to each edge
    const edgeThick = 0.15; // ~18px at cubeSize 120 (6x visual thickness)
    const cubeFactor = 1 - shapeMorphProgress; // fades out as morphing to search
    if (cubeFactor > 0.001) {
      const eDir = cubeEdgeDirs[p.cubeEdgeIndex];
      p.cubeVA += (Math.random() - 0.5) * 0.0005;
      p.cubeVB += (Math.random() - 0.5) * 0.0005;
      const cvm = Math.sqrt(p.cubeVA*p.cubeVA + p.cubeVB*p.cubeVB);
      if (cvm > 0.003) { p.cubeVA *= 0.003/cvm; p.cubeVB *= 0.003/cvm; }
      p.cubeOffA += p.cubeVA;
      p.cubeOffB += p.cubeVB;
      if (Math.abs(p.cubeOffA) > edgeThick) { p.cubeVA *= -0.8; p.cubeOffA = Math.sign(p.cubeOffA) * edgeThick; }
      if (Math.abs(p.cubeOffB) > edgeThick) { p.cubeVB *= -0.8; p.cubeOffB = Math.sign(p.cubeOffB) * edgeThick; }
      lx += (eDir.p1[0]*p.cubeOffA + eDir.p2[0]*p.cubeOffB) * cubeFactor;
      ly += (eDir.p1[1]*p.cubeOffA + eDir.p2[1]*p.cubeOffB) * cubeFactor;
      lz += (eDir.p1[2]*p.cubeOffA + eDir.p2[2]*p.cubeOffB) * cubeFactor;
    }

    // 3D Rotation
    let x1 = lx * cosY - lz * sinY;
    let z1 = lx * sinY + lz * cosY;
    let y2 = ly * cosX - z1 * sinX;
    let z2 = ly * sinX + z1 * cosX;

    // Perspective Projection
    const perspective = 300 / (300 + z2 * cubeSize);
    let boxDrawX = cubeX + x1 * cubeSize * perspective;
    let boxDrawY = cubeY + y2 * cubeSize * perspective;

    // 3. Morph Lerping
    let drawX = waveDrawX + (boxDrawX - waveDrawX) * morphProgress;
    let drawY = waveDrawY + (boxDrawY - waveDrawY) * morphProgress;

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
}, { threshold: 0.3 });
metricCards.forEach(c => observer.observe(c));

// Contact form
document.getElementById('contactForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const success = document.getElementById('formSuccess');
  success.style.display = 'block';
  this.reset();
  setTimeout(() => success.style.display = 'none', 5000);
});
