// ==========================================================================
// PROJEX HARDWARE-ACCELERATED FRAME SEQUENCE ENGINE
// Pure, High-Fidelity Canvas Scrubbing (Apple-Grade Fluidity)
// - Non-blocking progressive launch (interactive in <300ms)
// - Milestone-first loading (1, 72, 143, 214, 285 + buffer)
// - Sub-frame crossfade interpolation for butter-smooth scrubbing
// - Dynamic cinematic push-in & ambient breathing on Reveal destination
// ==========================================================================

export class SequenceRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    });

    this.totalFrames = options.totalFrames || 285;
    this.framePrefix = options.framePrefix || '/frames/ezgif-frame-';
    this.frameExt = options.frameExt || '.jpg';

    this.images = new Array(this.totalFrames + 1);
    this.loadedFrames = new Set();
    this.pendingRequests = new Set();

    this.currentFrameIndex = 1;
    this.lastDrawnActualFrame = -1;
    this.lastRequestedIndex = -1;

    this.onProgress = options.onProgress || (() => {});
    this.onInteractiveReady = options.onInteractiveReady || (() => {});
    this.onComplete = options.onComplete || (() => {});

    this.isInteractive = false;
    this.isDestroyed = false;

    // Ambient idle breathing loop on Reveal destination
    this.idleAnimId = null;
    this.isIdleBreathing = false;
    this.idleStartTime = 0;

    // Motion sensitivity check
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.initCanvasSize();
    this.bindEvents();
  }

  getFrameUrl(index) {
    const clamped = Math.max(1, Math.min(this.totalFrames, Math.round(index)));
    const padded = String(clamped).padStart(3, '0');
    return `${this.framePrefix}${padded}${this.frameExt}`;
  }

  bindEvents() {
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) cancelAnimationFrame(resizeTimer);
      resizeTimer = requestAnimationFrame(() => {
        this.initCanvasSize();
        this.drawFrame(this.currentFrameIndex, true);
      });
    }, { passive: true });
  }

  initCanvasSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /**
   * Load a single frame by index, decoding asynchronously on the GPU.
   */
  async loadImage(index) {
    if (this.images[index] && this.images[index].complete) {
      return this.images[index];
    }

    if (this.pendingRequests.has(index)) {
      return null;
    }

    this.pendingRequests.add(index);

    return new Promise((resolve) => {
      let settled = false;
      const img = new Image();
      img.decoding = 'async';

      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.pendingRequests.delete(index);
          resolve(null);
        }
      }, 5000);

      img.onload = async () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        this.pendingRequests.delete(index);
        this.images[index] = img;
        this.loadedFrames.add(index);

        // Pre-decode onto GPU memory if supported
        if ('decode' in img) {
          try {
            await img.decode();
          } catch {
            // Ignore decode failures on older browsers
          }
        }

        // Auto-upgrade canvas if the current scrub position benefits from this frame
        this.checkAutoUpgrade(index);

        resolve(img);
      };

      img.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        this.pendingRequests.delete(index);
        resolve(null);
      };

      img.src = this.getFrameUrl(index);
    });
  }

  /**
   * If newly loaded frame is closer to `this.currentFrameIndex`
   * than what is currently drawn, redraw immediately.
   */
  checkAutoUpgrade(newlyLoadedIndex) {
    if (this.lastDrawnActualFrame === -1) return;

    const currentTarget = this.currentFrameIndex;
    const currentDistance = Math.abs(this.lastDrawnActualFrame - currentTarget);
    const newDistance = Math.abs(newlyLoadedIndex - currentTarget);

    if (newDistance < currentDistance) {
      this.drawFrame(currentTarget, true);
    }
  }

  /**
   * Finds the best available loaded frame closest to targetIndex.
   * Returns { img, frameIndex } or null.
   */
  getNearestLoadedImage(targetIndex) {
    const clamped = Math.max(1, Math.min(this.totalFrames, Math.round(targetIndex)));

    // 1. Direct hit
    if (this.loadedFrames.has(clamped)) {
      return { img: this.images[clamped], frameIndex: clamped };
    }

    // 2. Bidirectional nearest search
    for (let offset = 1; offset < this.totalFrames; offset++) {
      const prev = clamped - offset;
      if (prev >= 1 && this.loadedFrames.has(prev)) {
        return { img: this.images[prev], frameIndex: prev };
      }
      const next = clamped + offset;
      if (next <= this.totalFrames && this.loadedFrames.has(next)) {
        return { img: this.images[next], frameIndex: next };
      }
    }

    return null;
  }

  /**
   * Apple-grade progressive preloader:
   * Phase 1: Frame 1 immediately (hero ready in <50ms)
   * Phase 2: Distributed keyframes across the 5 milestones (1, 72, 143, 214, 285)
   *          plus initial buffer for instant scrubbing
   * Phase 3: Background streaming for all remaining frames
   */
  async preloadFrames() {
    // Phase 1: Immediate hero frame
    await this.loadImage(1);
    this.drawFrame(1, true);

    // Phase 2: Strategic milestone keyframes + first 25 frames
    const initialBatch = new Set();
    // Milestone 1 (Awakening): 1..25
    for (let i = 2; i <= 25; i++) {
      initialBatch.add(i);
    }
    // Milestone 2 (Convergence): ~72
    for (let i = 65; i <= 78; i++) {
      initialBatch.add(i);
    }
    // Milestone 3 (Architecture): ~143
    for (let i = 136; i <= 150; i++) {
      initialBatch.add(i);
    }
    // Milestone 4 (Assembly): ~214
    for (let i = 207; i <= 221; i++) {
      initialBatch.add(i);
    }
    // Milestone 5 (Reveal): ~275..285
    for (let i = 275; i <= this.totalFrames; i++) {
      initialBatch.add(i);
    }
    // Periodic intermediate keyframes
    for (let i = 30; i <= this.totalFrames; i += 12) {
      initialBatch.add(i);
    }

    const initialList = Array.from(initialBatch);
    let initialLoaded = 1;

    const loadConcurrency = 6;
    let initialIdx = 0;

    const initialWorker = async () => {
      while (initialIdx < initialList.length) {
        const frameNum = initialList[initialIdx++];
        await this.loadImage(frameNum);
        initialLoaded++;
        const pct = Math.round((initialLoaded / (initialList.length + 1)) * 100);
        this.onProgress(initialLoaded, initialList.length + 1, pct);
      }
    };

    const initialPool = [];
    for (let c = 0; c < loadConcurrency; c++) {
      initialPool.push(initialWorker());
    }
    await Promise.all(initialPool);

    // Key milestones ready! Full interactivity enabled
    this.isInteractive = true;
    this.onInteractiveReady();

    // Phase 3: Background streaming for remaining frames
    this.startBackgroundStream();
  }

  /**
   * Background loader that fills all remaining frames with priority towards current scroll.
   */
  async startBackgroundStream() {
    const allFrames = [];
    for (let i = 2; i <= this.totalFrames; i++) {
      if (!this.loadedFrames.has(i)) {
        allFrames.push(i);
      }
    }

    let loadedCount = this.loadedFrames.size;
    const workerCount = 4;

    const getNextPriorityFrame = () => {
      const current = this.currentFrameIndex;
      let bestIndex = -1;
      let minDistance = Infinity;

      for (let i = 0; i < allFrames.length; i++) {
        const f = allFrames[i];
        if (!this.loadedFrames.has(f) && !this.pendingRequests.has(f)) {
          const diff = f - current;
          const weightedDist = diff >= 0 ? diff : Math.abs(diff) * 1.5;
          if (weightedDist < minDistance) {
            minDistance = weightedDist;
            bestIndex = i;
          }
        }
      }

      if (bestIndex !== -1) {
        return allFrames.splice(bestIndex, 1)[0];
      }
      return null;
    };

    const streamWorker = async () => {
      while (allFrames.length > 0) {
        const nextFrame = getNextPriorityFrame();
        if (!nextFrame) {
          await new Promise((r) => setTimeout(r, 50));
          if (allFrames.length === 0) break;
          continue;
        }

        await this.loadImage(nextFrame);
        loadedCount++;
        // Background stream fills remaining frames quietly without resetting preloader UI
      }
    };

    const streamPool = [];
    for (let c = 0; c < workerCount; c++) {
      streamPool.push(streamWorker());
    }

    await Promise.all(streamPool);
    this.onComplete();
  }

  /**
   * Starts ambient breathing animation on the final Reveal frame (Frame 285).
   * Makes the completed showcase feel alive and interactive while pinned.
   */
  startIdleBreathing() {
    if (this.isIdleBreathing || this.prefersReducedMotion) return;
    this.isIdleBreathing = true;
    this.idleStartTime = performance.now();

    const breathe = (timestamp) => {
      if (!this.isIdleBreathing) return;

      const elapsed = timestamp - this.idleStartTime;
      const breatheScale = 1.0 + Math.sin(elapsed * 0.001) * 0.007; // subtle 0.7% float
      const breatheY = Math.sin(elapsed * 0.0008) * 3; // subtle 3px vertical drift

      this.renderCanvas(285, 285, 0, breatheScale, breatheY);
      this.idleAnimId = requestAnimationFrame(breathe);
    };

    this.idleAnimId = requestAnimationFrame(breathe);
  }

  stopIdleBreathing() {
    if (!this.isIdleBreathing) return;
    this.isIdleBreathing = false;
    if (this.idleAnimId) {
      cancelAnimationFrame(this.idleAnimId);
      this.idleAnimId = null;
    }
  }

  /**
   * Draw the frame onto canvas with sub-frame crossfade & camera dynamics.
   */
  drawFrame(frameIndex, force = false) {
    const clampedTarget = Math.max(1, Math.min(this.totalFrames, frameIndex));
    this.currentFrameIndex = clampedTarget;

    // Trigger idle breathing on destination Reveal frame (>= 284.5)
    if (clampedTarget >= 284.5) {
      if (!this.isIdleBreathing) {
        this.startIdleBreathing();
      }
      return;
    } else {
      if (this.isIdleBreathing) {
        this.stopIdleBreathing();
      }
    }

    const lowIndex = Math.floor(clampedTarget);
    const highIndex = Math.min(this.totalFrames, Math.ceil(clampedTarget));
    const blendFactor = clampedTarget - lowIndex;

    // Camera push-in dynamics: subtle forward zoom across each phase
    let cameraPush = 1.0;
    if (!this.prefersReducedMotion) {
      const progress = (clampedTarget - 1) / (this.totalFrames - 1);
      // Gentle cyclical camera breathing through the 5 chapters
      cameraPush = 1.0 + Math.sin(progress * Math.PI * 4) * 0.018;
    }

    this.renderCanvas(lowIndex, highIndex, blendFactor, cameraPush, 0);
  }

  /**
   * High-precision canvas renderer with cover-fit math and crossfading.
   */
  renderCanvas(lowIndex, highIndex, blendFactor = 0, cameraScale = 1.0, offsetY = 0) {
    const primary = this.getNearestLoadedImage(lowIndex);
    if (!primary || !primary.img || !primary.img.complete || primary.img.naturalWidth === 0) {
      return;
    }

    this.lastDrawnActualFrame = primary.frameIndex;
    this.lastRequestedIndex = lowIndex;

    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const img1 = primary.img;
    const iw1 = img1.naturalWidth;
    const ih1 = img1.naturalHeight;

    // Object-fit: cover with dynamic camera scale
    const baseScale = Math.max(cw / iw1, ch / ih1);
    const effectiveScale = baseScale * cameraScale;
    const rw = iw1 * effectiveScale;
    const rh = ih1 * effectiveScale;
    const rx = (cw - rw) * 0.5;
    const ry = (ch - rh) * 0.5 + offsetY;

    // 1. Draw base frame
    ctx.globalAlpha = 1.0;
    ctx.drawImage(img1, 0, 0, iw1, ih1, rx, ry, rw, rh);

    // 2. Crossfade next frame if blending between frames
    if (blendFactor > 0.02 && highIndex !== lowIndex && this.loadedFrames.has(highIndex)) {
      const img2 = this.images[highIndex];
      if (img2 && img2.complete && img2.naturalWidth > 0) {
        ctx.globalAlpha = blendFactor;
        ctx.drawImage(img2, 0, 0, img2.naturalWidth, img2.naturalHeight, rx, ry, rw, rh);
        ctx.globalAlpha = 1.0;
      }
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.stopIdleBreathing();
  }
}
