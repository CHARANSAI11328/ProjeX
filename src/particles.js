// ==========================================================================
// PROJEX ATMOSPHERIC ZERO-GRAVITY PARTICLE SYSTEM
// Lightweight, GPU-efficient floating stardust & digital data bits
// Responds to scroll inertia and mouse parallax
// ==========================================================================

export class ParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.particles = [];
    this.particleCount = 50;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    this.scrollVelocity = 0;
    this.animId = null;
    this.isActive = true;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.loop();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(this.dpr, this.dpr);
  }

  createParticles() {
    this.particles = [];
    const colors = [
      'rgba(0, 229, 255, ',    // Cyan
      'rgba(157, 78, 221, ',   // Violet
      'rgba(255, 255, 255, ',  // White
      'rgba(77, 171, 247, '    // Soft blue
    ];

    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        z: Math.random() * 0.8 + 0.2, // depth factor 0.2 - 1.0
        radius: Math.random() * 1.6 + 0.6,
        baseAlpha: Math.random() * 0.5 + 0.2,
        colorPrefix: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.2 - 0.15,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = e.clientX / this.width;
      this.mouse.targetY = e.clientY / this.height;
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      this.isActive = !document.hidden;
      if (this.isActive && !this.animId && !this.prefersReducedMotion) {
        this.loop();
      }
    });

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
      if (this.prefersReducedMotion) {
        if (this.animId) {
          cancelAnimationFrame(this.animId);
          this.animId = null;
        }
        this.renderStatic();
      } else if (this.isActive && !this.animId) {
        this.loop();
      }
    });
  }

  setScrollVelocity(vel) {
    if (this.prefersReducedMotion) return;
    this.scrollVelocity = Math.max(-15, Math.min(15, vel));
  }

  renderStatic() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * p.z, 0, Math.PI * 2);
      ctx.fillStyle = `${p.colorPrefix}${p.baseAlpha * 0.7})`;
      ctx.fill();
    }
  }

  loop(time = 0) {
    if (!this.isActive) {
      this.animId = null;
      return;
    }

    if (this.prefersReducedMotion) {
      this.renderStatic();
      return;
    }

    this.animId = requestAnimationFrame((t) => this.loop(t));

    // Smooth mouse lerp
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Decay scroll velocity
    this.scrollVelocity *= 0.92;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const parallaxX = (this.mouse.x - 0.5) * 20;
    const parallaxY = (this.mouse.y - 0.5) * 20;
    const scrollDeltaY = this.scrollVelocity * 0.8;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Update position with drift + scroll velocity + depth weighting
      p.x += p.vx * p.z;
      p.y += (p.vy - scrollDeltaY * 0.4) * p.z;

      // Wrap around screen boundaries
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.height + 10;
      if (p.y > this.height + 10) p.y = -10;

      // Pulse opacity
      const alpha = p.baseAlpha + Math.sin(time * 0.002 * p.pulseSpeed + p.pulseOffset) * 0.15;
      const clampedAlpha = Math.max(0.05, Math.min(0.9, alpha));

      // Draw particle with depth offset
      const drawX = p.x + parallaxX * p.z;
      const drawY = p.y + parallaxY * p.z;

      ctx.beginPath();
      ctx.arc(drawX, drawY, p.radius * p.z, 0, Math.PI * 2);
      ctx.fillStyle = `${p.colorPrefix}${clampedAlpha})`;
      ctx.fill();

      // Subtle glow on closer particles
      if (p.z > 0.7 && p.radius > 1.2) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0, 229, 255, 0.4)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  destroy() {
    this.isActive = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}
