/**
 * Evolutionary algorithm for composing shapes on a canvas.
 *
 * Each individual (composition) is an array of shape genes.
 * A shape gene encodes: position, size, rotation, colour index, shape type, and opacity.
 *
 * The fitness function rewards:
 *   - Colour balance across the canvas
 *   - Spatial distribution (no clumping, good use of space)
 *   - Size-luminosity correlation (bright/saturated -> small, pale -> large)
 *   - Low overlap between shapes
 *   - Visual weight balance (centre of visual mass near canvas centre)
 */

const Evolution = (() => {
  const W = 800;
  const H = 800;

  /** Create a random shape gene. */
  function randomGene(palette, shapeTypes, index, total) {
    const colorIdx = Math.floor(Math.random() * palette.length);
    const rgb = Color.hexToRgb(palette[colorIdx]);
    const idealSize = Color.sizeForColour(rgb.r, rgb.g, rgb.b);
    // Base radius between 20 and 120, scaled by colour
    const baseRadius = 20 + Math.random() * 100;
    const radius = baseRadius * idealSize;

    return {
      x: Math.random() * W,
      y: Math.random() * H,
      radius: Math.max(12, Math.min(150, radius)),
      rotation: Math.random() * Math.PI * 2,
      colorIdx,
      shapeType: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
      opacity: 0.5 + Math.random() * 0.5,
    };
  }

  /** Create a random individual (composition). */
  function randomIndividual(palette, shapeTypes, shapeCount) {
    const genes = [];
    for (let i = 0; i < shapeCount; i++) {
      genes.push(randomGene(palette, shapeTypes, i, shapeCount));
    }
    return genes;
  }

  /** Create initial population. */
  function createPopulation(popSize, palette, shapeTypes, shapeCount) {
    const pop = [];
    for (let i = 0; i < popSize; i++) {
      pop.push(randomIndividual(palette, shapeTypes, shapeCount));
    }
    return pop;
  }

  // ─── Fitness components ───────────────────────────────────────

  /**
   * Colour balance: penalise compositions where palette colours
   * are unevenly distributed across canvas quadrants.
   */
  function fitnessColourBalance(genes, palette) {
    if (palette.length < 2) return 1;
    // Count colour usage per quadrant
    const quadrants = [[], [], [], []]; // TL, TR, BL, BR
    for (const g of genes) {
      const qi = (g.x < W / 2 ? 0 : 1) + (g.y < H / 2 ? 0 : 2);
      quadrants[qi].push(g.colorIdx);
    }
    // For each quadrant, measure how many distinct colours appear
    let totalDistinct = 0;
    for (const q of quadrants) {
      const unique = new Set(q).size;
      totalDistinct += unique;
    }
    const maxPossible = Math.min(palette.length, genes.length) * 4;
    return totalDistinct / maxPossible;
  }

  /**
   * Spatial distribution: reward even spread across canvas.
   * Uses a grid-based approach — count shapes per cell, penalise variance.
   */
  function fitnessSpatialDistribution(genes) {
    const gridSize = 4;
    const cellW = W / gridSize;
    const cellH = H / gridSize;
    const counts = new Array(gridSize * gridSize).fill(0);

    for (const g of genes) {
      const cx = Math.min(gridSize - 1, Math.floor(g.x / cellW));
      const cy = Math.min(gridSize - 1, Math.floor(g.y / cellH));
      counts[cy * gridSize + cx]++;
    }

    const mean = genes.length / counts.length;
    let variance = 0;
    for (const c of counts) {
      variance += (c - mean) * (c - mean);
    }
    variance /= counts.length;

    // Normalise: if all shapes in one cell, variance ~ mean^2
    const maxVariance = mean * mean;
    return maxVariance > 0 ? 1 - Math.min(1, variance / maxVariance) : 1;
  }

  /**
   * Size-luminosity rule: brighter, more saturated colours should be smaller;
   * paler colours should be larger.
   */
  function fitnessSizeLuminosity(genes, palette) {
    let score = 0;
    for (const g of genes) {
      const rgb = Color.hexToRgb(palette[g.colorIdx]);
      const idealMul = Color.sizeForColour(rgb.r, rgb.g, rgb.b);
      // Ideal radius range: 20-120 * idealMul
      const idealRadius = 60 * idealMul;
      const diff = Math.abs(g.radius - idealRadius) / 100;
      score += Math.max(0, 1 - diff);
    }
    return score / genes.length;
  }

  /**
   * Overlap penalty: penalise shapes that overlap too much.
   * Some overlap is fine, heavy overlap is penalised.
   */
  function fitnessOverlap(genes) {
    let overlapCount = 0;
    let totalPairs = 0;

    for (let i = 0; i < genes.length; i++) {
      for (let j = i + 1; j < genes.length; j++) {
        const a = genes[i];
        const b = genes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (a.radius + b.radius) * 0.6;
        if (dist < minDist) {
          overlapCount += 1 - dist / minDist;
        }
        totalPairs++;
      }
    }

    return totalPairs > 0 ? 1 - Math.min(1, overlapCount / (totalPairs * 0.15)) : 1;
  }

  /**
   * Visual weight balance: the weighted centre of mass
   * (using visual weight) should be near the canvas centre.
   */
  function fitnessVisualWeight(genes, palette) {
    let totalWeight = 0;
    let cx = 0, cy = 0;

    for (const g of genes) {
      const rgb = Color.hexToRgb(palette[g.colorIdx]);
      const w = Color.visualWeight(rgb.r, rgb.g, rgb.b) * g.radius * g.radius * g.opacity;
      cx += g.x * w;
      cy += g.y * w;
      totalWeight += w;
    }

    if (totalWeight === 0) return 1;
    cx /= totalWeight;
    cy /= totalWeight;

    // Distance from canvas centre, normalised
    const dx = cx - W / 2;
    const dy = cy - H / 2;
    const maxDist = Math.sqrt((W / 2) ** 2 + (H / 2) ** 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    return 1 - Math.min(1, dist / (maxDist * 0.4));
  }

  /** Combined fitness function. */
  function fitness(genes, palette, weights) {
    const fColor = fitnessColourBalance(genes, palette);
    const fSpatial = fitnessSpatialDistribution(genes);
    const fLum = fitnessSizeLuminosity(genes, palette);
    const fOverlap = fitnessOverlap(genes);
    const fWeight = fitnessVisualWeight(genes, palette);

    const wTotal = weights.color + weights.spatial + weights.lum +
                   weights.overlap + weights.weight;
    if (wTotal === 0) return 0;

    return (
      fColor * weights.color +
      fSpatial * weights.spatial +
      fLum * weights.lum +
      fOverlap * weights.overlap +
      fWeight * weights.weight
    ) / wTotal;
  }

  // ─── Genetic operators ────────────────────────────────────────

  /** Tournament selection: pick the best of k random individuals. */
  function tournamentSelect(population, fitnesses, k = 3) {
    let bestIdx = Math.floor(Math.random() * population.length);
    for (let i = 1; i < k; i++) {
      const idx = Math.floor(Math.random() * population.length);
      if (fitnesses[idx] > fitnesses[bestIdx]) bestIdx = idx;
    }
    return population[bestIdx];
  }

  /** Uniform crossover: for each gene, randomly pick from parent A or B. */
  function crossover(parentA, parentB) {
    const child = [];
    const len = Math.min(parentA.length, parentB.length);
    for (let i = 0; i < len; i++) {
      child.push(Math.random() < 0.5
        ? { ...parentA[i] }
        : { ...parentB[i] });
    }
    return child;
  }

  /** Mutate an individual. */
  function mutate(individual, mutationRate, palette, shapeTypes) {
    return individual.map((gene) => {
      if (Math.random() > mutationRate) return gene;

      const g = { ...gene };
      const field = Math.floor(Math.random() * 6);

      switch (field) {
        case 0: // position
          g.x = Math.max(0, Math.min(W, g.x + (Math.random() - 0.5) * 120));
          g.y = Math.max(0, Math.min(H, g.y + (Math.random() - 0.5) * 120));
          break;
        case 1: // radius
          g.radius = Math.max(12, Math.min(150, g.radius + (Math.random() - 0.5) * 40));
          break;
        case 2: // rotation
          g.rotation += (Math.random() - 0.5) * 0.8;
          break;
        case 3: // colour
          g.colorIdx = Math.floor(Math.random() * palette.length);
          break;
        case 4: // shape type
          g.shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
          break;
        case 5: // opacity
          g.opacity = Math.max(0.2, Math.min(1, g.opacity + (Math.random() - 0.5) * 0.3));
          break;
      }
      return g;
    });
  }

  /**
   * Run one generation: evaluate, select, crossover, mutate.
   * Returns { population, fitnesses, bestIdx, bestFitness }.
   */
  function evolveGeneration(population, palette, shapeTypes, mutationRate, weights) {
    // Evaluate fitness
    const fitnesses = population.map((ind) => fitness(ind, palette, weights));

    // Find best
    let bestIdx = 0;
    for (let i = 1; i < fitnesses.length; i++) {
      if (fitnesses[i] > fitnesses[bestIdx]) bestIdx = i;
    }

    // Elitism: keep top 2
    const sorted = fitnesses.map((f, i) => ({ f, i }))
      .sort((a, b) => b.f - a.f);
    const newPop = [
      population[sorted[0].i].map((g) => ({ ...g })),
      population[sorted[1] ? sorted[1].i : sorted[0].i].map((g) => ({ ...g })),
    ];

    // Fill rest with offspring
    while (newPop.length < population.length) {
      const parentA = tournamentSelect(population, fitnesses);
      const parentB = tournamentSelect(population, fitnesses);
      let child = crossover(parentA, parentB);
      child = mutate(child, mutationRate, palette, shapeTypes);
      newPop.push(child);
    }

    return {
      population: newPop,
      fitnesses: fitnesses,
      bestIdx: 0, // after elitism, best is first
      bestFitness: fitnesses[bestIdx],
    };
  }

  return {
    createPopulation,
    evolveGeneration,
    fitness,
    W,
    H,
  };
})();
