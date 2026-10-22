// ==========================================================================
// PROJEX MASTER CINEMATIC RUNTIME
// True Unified Scroll-Storytelling Controller (Apple-Grade Fluidity)
// - Normalized 0.0 -> 1.0 Single Timeline covering Frames 1 to 5
// - Hardware-accelerated canvas sequence scrubbing (Frames 1 - 285)
// - Atmospheric zero-gravity particle field with velocity coupling
// - Permanent Reveal destination state with integrated Frosted Specs HUD
// - Complete WCAG 2.1 & prefers-reduced-motion compliance
// ==========================================================================

import 'lenis/dist/lenis.css';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SequenceRenderer } from './sequenceRenderer.js';
import { ParticleField } from './particles.js';

gsap.registerPlugin(ScrollTrigger);

class ProjexCinematicApp {
  constructor() {
    this.lenis = null;
    this.sequence = null;
    this.particles = null;
    this.currentChapter = 0;
    this.timeline = null;
    this.lastFocusedElement = null;
    this.init();
  }

  async init() {
    // 1. Initialize Lenis Smooth Scroll with Apple inertia physics
    this.initLenis();

    // 2. Initialize Atmospheric Particle Field
    const particleCanvas = document.getElementById('particles-canvas');
    if (particleCanvas) {
      this.particles = new ParticleField(particleCanvas);
    }

    // 3. Initialize Hardware-Accelerated Sequence Renderer
    const sequenceCanvas = document.getElementById('sequence-canvas');
    let maxPct = 0;
    this.sequence = new SequenceRenderer(sequenceCanvas, {
      totalFrames: 285,
      framePrefix: '/frames/ezgif-frame-',
      frameExt: '.jpg',
      onProgress: (loaded, total, pct) => {
        if (pct < maxPct) return;
        maxPct = pct;
        const fill = document.getElementById('loader-fill');
        const text = document.getElementById('loader-text');
        if (fill) fill.style.width = `${Math.min(100, Math.max(12, pct))}%`;
        if (text) text.innerText = `Loading experience ${pct}%`;
      },
      onInteractiveReady: () => {
        // Hero batch + key milestones ready! Dismiss preloader immediately
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

    // Safety emergency timeout: Dismiss preloader after 4.5s max regardless of network stalls
    setTimeout(() => {
      const preloader = document.getElementById('preloader');
      if (preloader && !preloader.classList.contains('loaded')) {
        preloader.classList.add('loaded');
        ScrollTrigger.refresh();
      }
    }, 4500);

    // 4. Setup Single Unified GSAP Scroll Timeline
    this.setupChoreography();

    // Setup dynamic reduced-motion listener
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', (e) => {
      const reduced = e.matches;
      if (this.sequence) {
        this.sequence.prefersReducedMotion = reduced;
        if (reduced) {
          if (this.sequence.isIdleBreathing) this.sequence.stopIdleBreathing();
          this.sequence.drawFrame(this.sequence.currentFrameIndex, true);
        }
      }
      if (this.lenis) {
        this.lenis.options.smoothWheel = !reduced;
      }
      if (this.timeline && this.timeline.scrollTrigger) {
        this.timeline.scrollTrigger.vars.scrub = reduced ? 0 : 0.3;
        if (typeof this.timeline.scrollTrigger.scrubDuration === 'function') {
          this.timeline.scrollTrigger.scrubDuration(reduced ? 0 : 0.3);
        }
      }
    });

    // 5. Setup Chapter Scrubber, Top Navigation, and Modals
    this.setupChapterScrubber();
    this.setupNavigation();
    this.setupInteractiveModals();
    this.setupCardParallax();

    // 6. Preload keyframe milestones progressively
    await this.sequence.preloadFrames();
  }

  initLenis() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.lenis = new Lenis({
      duration: prefersReducedMotion ? 0 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !prefersReducedMotion,
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
    const scrubProgressFill = document.getElementById('scrub-progress-fill');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Single scrubbed timeline covering Frames 1-5 across normalized 0% -> 100%
    this.timeline = gsap.timeline({
      scrollTrigger: {
        trigger: scrollTrack,
        start: 'top top',
        end: 'bottom bottom',
        scrub: prefersReducedMotion ? 0 : 0.3, // Ultra-smooth inertia damping (instant on reduced-motion)
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress;

          // Update chapter scrubber progress bar
          if (scrubProgressFill) {
            scrubProgressFill.style.width = `${(progress * 100).toFixed(1)}%`;
          }

          // Update active chapter state
          this.updateActiveChapter(progress);
        }
      }
    });

    // =========================================================================
    // 1. FRAME SEQUENCE SCRUB: Duration 10.0 (Frame 1 to Frame 285)
    // 0% -> Frame 1 (Awakening)
    // 25% -> Frame 72 (Convergence)
    // 50% -> Frame 143 (Architecture)
    // 75% -> Frame 214 (Assembly & Transformation)
    // 100% -> Frame 285 (Reveal - Completed Showcase)
    // =========================================================================
    const frameState = { frame: 1 };
    this.timeline.to(frameState, {
      frame: 285,
      ease: 'none',
      duration: 10,
      onUpdate: () => {
        this.sequence.drawFrame(frameState.frame);
      }
    }, 0);

    // =========================================================================
    // 2. STAGE 1: AWAKENING (0% Milestone, Frames 1 - 72)
    // Active at start, fades out cleanly as scroll travels toward Convergence
    // =========================================================================
    this.timeline.to('#stage-awakening', {
      opacity: 0,
      y: -40,
      scale: 0.96,
      ease: 'power1.inOut',
      duration: 0.9
    }, 1.3);

    // =========================================================================
    // 3. STAGE 2: CONVERGENCE (25% Milestone, Frames 72 - 143)
    // Peak at timeline time 2.5
    // =========================================================================
    this.timeline.fromTo('#stage-convergence',
      { opacity: 0, y: 40, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 0.8 },
      1.8
    );
    this.timeline.to('#stage-convergence', {
      opacity: 0,
      y: -35,
      scale: 0.96,
      ease: 'power1.in',
      duration: 0.7
    }, 3.8);

    // =========================================================================
    // 4. STAGE 3: ARCHITECTURE (50% Milestone, Frames 143 - 214)
    // Peak at timeline time 5.0
    // =========================================================================
    this.timeline.fromTo('#stage-architecture',
      { opacity: 0, y: 40, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 0.8 },
      4.3
    );
    this.timeline.to('#stage-architecture', {
      opacity: 0,
      y: -35,
      scale: 0.96,
      ease: 'power1.in',
      duration: 0.7
    }, 6.3);

    // =========================================================================
    // 5. STAGE 4: ASSEMBLY & TRANSFORMATION (75% Milestone, Frames 214 - 285)
    // Peak at timeline time 7.5
    // =========================================================================
    this.timeline.fromTo('#stage-assembly',
      { opacity: 0, y: 40, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 0.8 },
      6.8
    );
    this.timeline.to('#stage-assembly', {
      opacity: 0,
      y: -35,
      scale: 0.96,
      ease: 'power1.in',
      duration: 0.7
    }, 8.8);

    // =========================================================================
    // 6. STAGE 5: REVEAL — FINAL DESTINATION (100% Milestone, Frame 285)
    // Settles at 10.0 and REMAINS VISIBLE PERMANENTLY! Does NOT fade out!
    // =========================================================================
    this.timeline.fromTo('#stage-reveal',
      { opacity: 0, y: 35, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 0.9 },
      9.1
    );
  }

  updateActiveChapter(progress) {
    let chapterIndex = 0;
    if (progress >= 0.88) {
      chapterIndex = 4; // Reveal (Frame 5)
    } else if (progress >= 0.63) {
      chapterIndex = 3; // Assembly & Transformation (Frame 4)
    } else if (progress >= 0.38) {
      chapterIndex = 2; // Architecture (Frame 3)
    } else if (progress >= 0.12) {
      chapterIndex = 1; // Convergence (Frame 2)
    } else {
      chapterIndex = 0; // Awakening (Frame 1)
    }

    if (chapterIndex !== this.currentChapter) {
      this.currentChapter = chapterIndex;
      const buttons = document.querySelectorAll('.chapter-btn');
      buttons.forEach((btn, idx) => {
        btn.classList.toggle('active', idx === chapterIndex);
      });

      // Update active nav link
      const navLinks = document.querySelectorAll('.nav-menu .nav-link[data-milestone]');
      navLinks.forEach((link, idx) => {
        link.classList.toggle('active', idx === chapterIndex);
      });
    }
  }

  setupChapterScrubber() {
    const buttons = document.querySelectorAll('.chapter-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPct = parseFloat(btn.dataset.target || '0');
        this.scrollToProgress(targetPct);
      });
    });
  }

  scrollToProgress(targetPct) {
    if (!this.lenis) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = maxScroll * Math.max(0, Math.min(1, targetPct));
    this.lenis.scrollTo(targetScroll, { duration: 1.4 });
  }

  setupNavigation() {
    // Logo returns to Frame 1 (top)
    const logo = document.getElementById('nav-logo');
    if (logo) {
      logo.addEventListener('click', (e) => {
        e.preventDefault();
        this.scrollToProgress(0);
      });
    }

    // Story chapter nav links
    document.querySelectorAll('.nav-menu .nav-link[data-milestone]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const milestone = parseFloat(link.dataset.milestone || '0');
        this.scrollToProgress(milestone);
      });
    });

    // Hero buttons
    const heroExplore = document.getElementById('hero-explore-btn');
    if (heroExplore) {
      heroExplore.addEventListener('click', () => {
        this.scrollToProgress(0.25);
      });
    }

    const heroSpecs = document.getElementById('hero-specs-btn');
    if (heroSpecs) {
      heroSpecs.addEventListener('click', () => {
        this.openSpecsHUD();
      });
    }

    // Scroll hint click
    const scrollHint = document.getElementById('scroll-hint');
    if (scrollHint) {
      scrollHint.addEventListener('click', () => {
        this.scrollToProgress(0.25);
      });
    }

    // Reveal buttons
    const revealSpecs = document.getElementById('reveal-specs-btn');
    if (revealSpecs) {
      revealSpecs.addEventListener('click', () => {
        this.openSpecsHUD();
      });
    }

    const revealCta = document.getElementById('reveal-cta-btn');
    if (revealCta) {
      revealCta.addEventListener('click', () => {
        this.openLaunchModal();
      });
    }

    const revealTerminal = document.getElementById('reveal-terminal-btn');
    if (revealTerminal) {
      revealTerminal.addEventListener('click', () => {
        this.openLaunchModal();
      });
    }

    // Top CTA button
    const navCta = document.getElementById('nav-cta-btn');
    if (navCta) {
      navCta.addEventListener('click', () => {
        this.openLaunchModal();
      });
    }

    // Nav specs link
    const navSpecs = document.getElementById('nav-specs-link');
    if (navSpecs) {
      navSpecs.addEventListener('click', (e) => {
        e.preventDefault();
        this.openSpecsHUD();
      });
    }

    // Footer strip links
    const footerSpecs = document.getElementById('footer-specs-link');
    if (footerSpecs) {
      footerSpecs.addEventListener('click', (e) => {
        e.preventDefault();
        this.openSpecsHUD();
      });
    }

    const footerPrivacy = document.getElementById('footer-privacy-link');
    if (footerPrivacy) {
      footerPrivacy.addEventListener('click', (e) => {
        e.preventDefault();
        alert('ProjeX Privacy: Zero telemetry tracking. All architectural benchmarks run locally in your development sandbox.');
      });
    }

    const footerTerms = document.getElementById('footer-terms-link');
    if (footerTerms) {
      footerTerms.addEventListener('click', (e) => {
        e.preventDefault();
        alert('ProjeX Terms: Open architectural mastery. Built for engineering teams and ambitious developers.');
      });
    }

    // Guard all generic hash links to prevent jumping to top
    document.querySelectorAll('a[href="#"]').forEach((a) => {
      a.addEventListener('click', (e) => e.preventDefault());
    });
  }

  setupInteractiveModals() {
    // Specs HUD
    const specsHud = document.getElementById('specs-hud');
    const specsClose = document.getElementById('specs-hud-close');
    const specsDismiss = document.getElementById('specs-hud-dismiss');
    const specsBackdrop = document.getElementById('specs-hud-backdrop');
    const specsLaunch = document.getElementById('specs-hud-launch');

    const closeSpecs = () => {
      if (specsHud && specsHud.classList.contains('active')) {
        specsHud.classList.remove('active');
        specsHud.setAttribute('aria-hidden', 'true');
        if (this.lenis) this.lenis.start();
        if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
          this.lastFocusedElement.focus();
          this.lastFocusedElement = null;
        }
      }
    };

    if (specsClose) specsClose.addEventListener('click', closeSpecs);
    if (specsDismiss) specsDismiss.addEventListener('click', closeSpecs);
    if (specsBackdrop) specsBackdrop.addEventListener('click', closeSpecs);

    if (specsLaunch) {
      specsLaunch.addEventListener('click', () => {
        closeSpecs();
        this.openLaunchModal();
      });
    }

    // Launch Terminal Modal
    const launchModal = document.getElementById('launch-modal');
    const launchClose = document.getElementById('launch-modal-close');
    const launchBackdrop = document.getElementById('launch-modal-backdrop');

    const closeLaunch = () => {
      if (launchModal && launchModal.classList.contains('active')) {
        launchModal.classList.remove('active');
        launchModal.setAttribute('aria-hidden', 'true');
        if (this.lenis) this.lenis.start();
        if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
          this.lastFocusedElement.focus();
          this.lastFocusedElement = null;
        }
      }
    };

    if (launchClose) launchClose.addEventListener('click', closeLaunch);
    if (launchBackdrop) launchBackdrop.addEventListener('click', closeLaunch);

    // Terminal copy button
    const termCopyBtn = document.getElementById('term-copy-btn');
    const termCmd = document.getElementById('terminal-cmd');
    if (termCopyBtn && termCmd) {
      termCopyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(termCmd.innerText);
          termCopyBtn.innerText = 'Copied!';
          termCopyBtn.classList.add('copied');
          setTimeout(() => {
            termCopyBtn.innerText = 'Copy';
            termCopyBtn.classList.remove('copied');
          }, 2000);
        } catch {
          termCopyBtn.innerText = 'Copied!';
        }
      });
    }

    // Global ESC key listener to dismiss any open modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSpecs();
        closeLaunch();
      }
    });
  }

  openSpecsHUD() {
    this.lastFocusedElement = document.activeElement;
    const specsHud = document.getElementById('specs-hud');
    if (specsHud) {
      specsHud.classList.add('active');
      specsHud.setAttribute('aria-hidden', 'false');
      if (this.lenis) this.lenis.stop();
      const closeBtn = document.getElementById('specs-hud-close');
      if (closeBtn) closeBtn.focus();
    }
  }

  openLaunchModal() {
    this.lastFocusedElement = document.activeElement;
    const launchModal = document.getElementById('launch-modal');
    if (launchModal) {
      launchModal.classList.add('active');
      launchModal.setAttribute('aria-hidden', 'false');
      if (this.lenis) this.lenis.stop();
      const closeBtn = document.getElementById('launch-modal-close');
      if (closeBtn) closeBtn.focus();
    }
  }

  setupCardParallax() {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cards = document.querySelectorAll('.story-card-glass');

    window.addEventListener('mousemove', (e) => {
      if (motionQuery.matches) return;
      const cx = window.innerWidth * 0.5;
      const cy = window.innerHeight * 0.5;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;

      cards.forEach((card) => {
        card.style.transform = `perspective(1000px) rotateY(${dx * 3}deg) rotateX(${-dy * 3}deg) translateZ(10px)`;
      });
    }, { passive: true });

    motionQuery.addEventListener('change', (e) => {
      if (e.matches) {
        cards.forEach((card) => {
          card.style.transform = '';
        });
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ProjexCinematicApp();
  });
} else {
  new ProjexCinematicApp();
}
