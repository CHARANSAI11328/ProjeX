// ==========================================================================
// PROJEX PURE CINEMATIC SCROLLYTELLING RUNTIME
// Pure Visual Experience — Zero UI Text / Zero Header / Zero Footer
// - Hardware-accelerated canvas sequence scrubbing (Frames 1–285)
// - Sub-frame crossfading & dynamic camera push-in
// - Atmospheric zero-gravity particle field with velocity coupling
// - Idle breathing animation on final Reveal destination
// ==========================================================================

import 'lenis/dist/lenis.css';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SequenceRenderer } from './sequenceRenderer.js';
import { ParticleField } from './particles.js';

gsap.registerPlugin(ScrollTrigger);

class ProjexPureCinematicApp {
  constructor() {
    this.lenis = null;
    this.sequence = null;
    this.particles = null;
    this.timeline = null;
    this.init();
  }

  async init() {
    // 1. Initialize Lenis Smooth Scroll with inertia physics
    this.initLenis();

    // 2. Initialize Atmospheric Particle Field
    const particleCanvas = document.getElementById('particles-canvas');
    if (particleCanvas) {
      this.particles = new ParticleField(particleCanvas);
    }

    // 3. Initialize Hardware-Accelerated Sequence Renderer
    const sequenceCanvas = document.getElementById('sequence-canvas');
    this.sequence = new SequenceRenderer(sequenceCanvas, {
      totalFrames: 285,
      framePrefix: '/frames/ezgif-frame-',
      frameExt: '.jpg',
      onProgress: (loaded, total, pct) => {
        const fill = document.getElementById('loader-fill');
        if (fill) fill.style.width = `${Math.min(100, Math.max(12, pct))}%`;
      },
      onInteractiveReady: () => {
        // Hero batch ready — dismiss preloader
        const preloader = document.getElementById('preloader');
        if (preloader) {
          preloader.classList.add('loaded');
        }
        ScrollTrigger.refresh();
      },
      onComplete: () => {
        const preloader = document.getElementById('preloader');
        if (preloader && !preloader.classList.contains('loaded')) {
          preloader.classList.add('loaded');
        }
        ScrollTrigger.refresh();
      }
    });

    // 4. Setup Pure Scrubbed Scroll Timeline
    this.setupChoreography();

    // 5. Preload keyframes progressively
    await this.sequence.preloadFrames();
  }

  initLenis() {
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: true,
      touchInertiaExponent: 1.7,
      infinite: false,
    });

    // Couple Lenis scroll with ScrollTrigger and Particle velocity
    this.lenis.on('scroll', (e) => {
      ScrollTrigger.update();
      if (this.particles) {
        this.particles.setScrollVelocity(e.velocity || 0);
      }
    });

    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  setupChoreography() {
    const scrollTrack = document.getElementById('scroll-track');

    // Single scrubbed timeline covering Frames 1-285 across normalized 0% -> 100%
    this.timeline = gsap.timeline({
      scrollTrigger: {
        trigger: scrollTrack,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3, // Ultra-smooth inertia damping
        invalidateOnRefresh: true,
      }
    });

    // Scrub frame state from 1 to 285
    const frameState = { frame: 1 };
    this.timeline.to(frameState, {
      frame: 285,
      ease: 'none',
      duration: 10,
      onUpdate: () => {
        this.sequence.drawFrame(frameState.frame);
      }
    }, 0);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ProjexPureCinematicApp();
  });
} else {
  new ProjexPureCinematicApp();
}
