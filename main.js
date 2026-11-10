// ------------------------------------------------------------
// Particle Text
// Thousands of particles fly into the shape of a word.
// Each particle is a tiny physics object:
//   - a spring pulls it toward its "home" (a pixel of the text)
//   - the mouse pushes it away
//   - friction slowly calms it down
// ------------------------------------------------------------

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const settings = {
  gap: 5,            // distance between sampled pixels (smaller = more particles)
  size: 2.2,         // particle size in px
  spring: 0.045,     // how strongly particles are pulled home
  friction: 0.86,    // 1 = no friction, 0 = instant stop
  mouseRadius: 110,  // how far the mouse pushes
  mouseForce: 7,     // how hard the mouse pushes
  trail: 0.28,       // background fade per frame (lower = longer trails)
};

// Colour ramp: slow particles are deep blue, fast ones glow cyan/white.
const COLORS = ["#3b3f9e", "#4f5bd5", "#6d7cff", "#7fa8ff", "#8fe3ff", "#e8fbff"];

let width = 0, height = 0;
let particles = [];
const mouse = { x: -9999, y: -9999, down: false };

// ---------- Text -> points ----------

// Draw the word on a hidden canvas, then read its pixels.
// Every visible pixel (every `gap` px) becomes a target point.
function textToPoints(word) {
  const off = document.createElement("canvas");
  off.width = width;
  off.height = height;
  const o = off.getContext("2d");

  // Pick the biggest font size that fits the screen.
  let fontSize = Math.min(height * 0.42, 260);
  o.font = `900 ${fontSize}px system-ui, sans-serif`;
  const maxWidth = width * 0.88;
  const measured = o.measureText(word).width;
  if (measured > maxWidth) fontSize *= maxWidth / measured;

  o.font = `900 ${fontSize}px system-ui, sans-serif`;
  o.textAlign = "center";
  o.textBaseline = "middle";
  o.fillStyle = "#fff";
  o.fillText(word, width / 2, height / 2);

  const data = o.getImageData(0, 0, width, height).data;
  const points = [];
  const gap = settings.gap;
  for (let y = 0; y < height; y += gap) {
    for (let x = 0; x < width; x += gap) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 128) points.push({ x, y });
    }
  }

  // Shuffle so particles travel to random spots (looks more organic).
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }
  return points;
}

// ---------- Build / morph ----------

function setWord(word) {
  word = (word || "").trim().toUpperCase() || "CREATE";
  const points = textToPoints(word);

  const next = points.map((pt, i) => {
    // Reuse an existing particle if we have one, so the old word
    // morphs into the new one instead of disappearing.
    const p = particles[i] || {
      x: Math.random() * width,
      y: Math.random() < 0.5 ? -20 : height + 20,
      vx: 0,
      vy: 0,
    };
    p.hx = pt.x; // home x
    p.hy = pt.y; // home y
    return p;
  });

  particles = next;
}

// ---------- Physics + drawing ----------

function update() {
  const r = settings.mouseRadius;
  const r2 = r * r;

  for (const p of particles) {
    // 1) Spring toward home: force grows with distance (Hooke's law).
    p.vx += (p.hx - p.x) * settings.spring;
    p.vy += (p.hy - p.y) * settings.spring;

    // 2) Mouse repulsion: closer = stronger push.
    const dx = p.x - mouse.x;
    const dy = p.y - mouse.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < r2 && d2 > 0.01) {
      const d = Math.sqrt(d2);
      const strength = (1 - d / r) * settings.mouseForce;
      p.vx += (dx / d) * strength;
      p.vy += (dy / d) * strength;
    }

    // 3) Friction, then move.
    p.vx *= settings.friction;
    p.vy *= settings.friction;
    p.x += p.vx;
    p.y += p.vy;
  }
}

function draw() {
  // Paint a see-through background instead of clearing:
  // the previous frames fade out slowly and leave motion trails.
  ctx.fillStyle = `rgba(7, 8, 13, ${settings.trail})`;
  ctx.fillRect(0, 0, width, height);

  // Group particles by colour so we change fillStyle only a few times.
  const buckets = COLORS.map(() => []);
  for (const p of particles) {
    const speed = Math.abs(p.vx) + Math.abs(p.vy);
    const i = Math.min(COLORS.length - 1, Math.floor(speed / 1.6));
    buckets[i].push(p);
  }

  const s = settings.size;
  buckets.forEach((list, i) => {
    ctx.fillStyle = COLORS[i];
    for (const p of list) ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  });
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ---------- Explosion ----------

function explode(x, y) {
  for (const p of particles) {
    const dx = p.x - x;
    const dy = p.y - y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const force = 30 + Math.random() * 30;
    p.vx += (dx / d) * force;
    p.vy += (dy / d) * force;
  }
}

// ---------- Setup & events ----------

function resize() {
  const dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#07080d";
  ctx.fillRect(0, 0, width, height);
}

function setMouse(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
}

canvas.addEventListener("pointermove", setMouse);
canvas.addEventListener("pointerdown", (e) => { setMouse(e); explode(e.clientX, e.clientY); });
canvas.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });

const input = document.getElementById("word");
document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  setWord(input.value);
  history.replaceState(null, "", "#" + encodeURIComponent(input.value.trim()));
  input.blur();
});

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { resize(); setWord(input.value || currentWordFromUrl()); }, 200);
});

function currentWordFromUrl() {
  return decodeURIComponent(location.hash.slice(1));
}

resize();
input.value = currentWordFromUrl();
setWord(input.value);
loop();
