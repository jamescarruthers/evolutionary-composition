/**
 * Application controller: wires up UI controls to the evolutionary engine
 * and manages the animation loop.
 */

(function () {
  'use strict';

  // ─── DOM references ─────────────────────────────────────────
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const generationEl = document.getElementById('generation-count');
  const fitnessEl = document.getElementById('fitness-score');

  const paletteContainer = document.getElementById('palette');
  const addColorBtn = document.getElementById('add-color');

  const shapeCountInput = document.getElementById('shape-count');
  const shapeCountVal = document.getElementById('shape-count-val');
  const minSizeInput = document.getElementById('min-size');
  const minSizeVal = document.getElementById('min-size-val');
  const maxSizeInput = document.getElementById('max-size');
  const maxSizeVal = document.getElementById('max-size-val');
  const useClusteringInput = document.getElementById('use-clustering');
  const popSizeInput = document.getElementById('pop-size');
  const popSizeVal = document.getElementById('pop-size-val');
  const mutationRateInput = document.getElementById('mutation-rate');
  const mutationRateVal = document.getElementById('mutation-rate-val');
  const speedInput = document.getElementById('speed');
  const speedVal = document.getElementById('speed-val');

  const wColorInput = document.getElementById('w-color');
  const wSpatialInput = document.getElementById('w-spatial');
  const wLumInput = document.getElementById('w-lum');
  const wOverlapInput = document.getElementById('w-overlap');
  const wWeightInput = document.getElementById('w-weight');

  const bgColorInput = document.getElementById('bg-color');

  const btnStart = document.getElementById('btn-start');
  const btnPause = document.getElementById('btn-pause');
  const btnReset = document.getElementById('btn-reset');
  const btnExport = document.getElementById('btn-export');

  // ─── State ──────────────────────────────────────────────────
  let population = null;
  let generation = 0;
  let running = false;
  let animFrameId = null;

  // For smooth transitions
  let prevBest = null;
  let currentBest = null;
  let transitionStart = 0;
  const TRANSITION_MS = 300;

  // ─── Helpers ────────────────────────────────────────────────

  function getPalette() {
    const swatches = paletteContainer.querySelectorAll('.swatch');
    return Array.from(swatches).map((s) => s.value);
  }

  function getShapeTypes() {
    const checks = document.querySelectorAll('#shape-types input[type=checkbox]:checked');
    const types = Array.from(checks).map((c) => c.value);
    return types.length > 0 ? types : ['circle'];
  }

  function getWeights() {
    return {
      color: parseInt(wColorInput.value),
      spatial: parseInt(wSpatialInput.value),
      lum: parseInt(wLumInput.value),
      overlap: parseInt(wOverlapInput.value),
      weight: parseInt(wWeightInput.value),
    };
  }

  // ─── Palette management ─────────────────────────────────────

  function addSwatchRow(hex) {
    const row = document.createElement('div');
    row.className = 'swatch-row';
    row.innerHTML = `
      <input type="color" class="swatch" value="${hex}">
      <button class="remove-swatch" title="Remove">&times;</button>
    `;
    row.querySelector('.remove-swatch').addEventListener('click', () => {
      if (paletteContainer.querySelectorAll('.swatch-row').length > 2) {
        row.remove();
      }
    });
    paletteContainer.appendChild(row);
  }

  // Wire up existing remove buttons
  paletteContainer.querySelectorAll('.remove-swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (paletteContainer.querySelectorAll('.swatch-row').length > 2) {
        btn.parentElement.remove();
      }
    });
  });

  addColorBtn.addEventListener('click', () => {
    const randomHex = '#' + Math.floor(Math.random() * 16777215)
      .toString(16).padStart(6, '0');
    addSwatchRow(randomHex);
  });

  // ─── Slider value displays ──────────────────────────────────
  shapeCountInput.addEventListener('input', () => {
    shapeCountVal.textContent = shapeCountInput.value;
  });
  minSizeInput.addEventListener('input', () => {
    minSizeVal.textContent = minSizeInput.value;
    // Enforce min < max
    if (parseInt(minSizeInput.value) >= parseInt(maxSizeInput.value)) {
      maxSizeInput.value = Math.min(parseInt(maxSizeInput.max), parseInt(minSizeInput.value) + 20);
      maxSizeVal.textContent = maxSizeInput.value;
    }
  });
  maxSizeInput.addEventListener('input', () => {
    maxSizeVal.textContent = maxSizeInput.value;
    // Enforce min < max
    if (parseInt(maxSizeInput.value) <= parseInt(minSizeInput.value)) {
      minSizeInput.value = Math.max(parseInt(minSizeInput.min), parseInt(maxSizeInput.value) - 20);
      minSizeVal.textContent = minSizeInput.value;
    }
  });
  popSizeInput.addEventListener('input', () => {
    popSizeVal.textContent = popSizeInput.value;
  });
  mutationRateInput.addEventListener('input', () => {
    mutationRateVal.textContent = mutationRateInput.value + '%';
  });
  speedInput.addEventListener('input', () => {
    speedVal.textContent = speedInput.value;
  });

  // ─── Evolution loop ─────────────────────────────────────────

  function init() {
    const palette = getPalette();
    const shapeTypes = getShapeTypes();
    const popSize = parseInt(popSizeInput.value);
    const shapeCount = parseInt(shapeCountInput.value);
    const minSize = parseInt(minSizeInput.value);
    const maxSize = parseInt(maxSizeInput.value);
    const useClustering = useClusteringInput.checked;

    population = Evolution.createPopulation(popSize, palette, shapeTypes, shapeCount, minSize, maxSize, useClustering);
    generation = 0;
    prevBest = null;
    currentBest = population[0];

    updateDisplay(0);
    Render.drawComposition(ctx, currentBest, palette, bgColorInput.value);
  }

  function step() {
    const palette = getPalette();
    const shapeTypes = getShapeTypes();
    const mutRate = parseInt(mutationRateInput.value) / 100;
    const weights = getWeights();
    const minSize = parseInt(minSizeInput.value);
    const maxSize = parseInt(maxSizeInput.value);

    const result = Evolution.evolveGeneration(
      population, palette, shapeTypes, mutRate, weights, minSize, maxSize
    );

    population = result.population;
    generation++;

    // Smooth transition
    prevBest = currentBest;
    currentBest = population[result.bestIdx];
    transitionStart = performance.now();

    updateDisplay(result.bestFitness);
  }

  function updateDisplay(bestFitness) {
    generationEl.textContent = `Generation: ${generation}`;
    fitnessEl.textContent = `Fitness: ${(bestFitness * 100).toFixed(1)}%`;
  }

  // ─── Animation loop ─────────────────────────────────────────

  let lastStepTime = 0;

  function animate(timestamp) {
    if (!running) return;

    const palette = getPalette();
    const bg = bgColorInput.value;
    const speed = parseInt(speedInput.value);
    const stepInterval = Math.max(20, 500 / speed);

    // Run evolution steps at the configured speed
    if (timestamp - lastStepTime >= stepInterval) {
      step();
      lastStepTime = timestamp;
    }

    // Render with interpolation
    if (prevBest && currentBest) {
      const elapsed = timestamp - transitionStart;
      const t = Math.min(1, elapsed / TRANSITION_MS);

      if (t < 1) {
        const interpolated = Render.interpolate(prevBest, currentBest, t);
        Render.drawComposition(ctx, interpolated, palette, bg);
      } else {
        Render.drawComposition(ctx, currentBest, palette, bg);
      }
    } else if (currentBest) {
      Render.drawComposition(ctx, currentBest, palette, bg);
    }

    animFrameId = requestAnimationFrame(animate);
  }

  // ─── Button handlers ────────────────────────────────────────

  btnStart.addEventListener('click', () => {
    if (!population) init();
    running = true;
    btnStart.disabled = true;
    btnPause.disabled = false;
    lastStepTime = performance.now();
    animFrameId = requestAnimationFrame(animate);
  });

  btnPause.addEventListener('click', () => {
    running = false;
    btnStart.disabled = false;
    btnPause.disabled = true;
    if (animFrameId) cancelAnimationFrame(animFrameId);
  });

  btnReset.addEventListener('click', () => {
    running = false;
    btnStart.disabled = false;
    btnPause.disabled = true;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    init();
  });

  btnExport.addEventListener('click', () => {
    if (!currentBest) return;
    const palette = getPalette();
    const bg = bgColorInput.value;

    // Render at full resolution
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = Evolution.W;
    exportCanvas.height = Evolution.H;
    const exportCtx = exportCanvas.getContext('2d');
    Render.drawComposition(exportCtx, currentBest, palette, bg);

    const link = document.createElement('a');
    link.download = `composition-gen${generation}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  });

  // ─── Background colour sync ─────────────────────────────────
  bgColorInput.addEventListener('input', () => {
    canvas.style.background = bgColorInput.value;
    if (currentBest && !running) {
      Render.drawComposition(ctx, currentBest, getPalette(), bgColorInput.value);
    }
  });

  // ─── Initial render ─────────────────────────────────────────
  init();

})();
