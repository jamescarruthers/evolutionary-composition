/**
 * Rendering engine: draws a composition (array of shape genes) to a canvas.
 */

const Render = (() => {
  /**
   * Draw a single shape gene onto the given 2D context.
   */
  function drawShape(ctx, gene, palette) {
    const hex = palette[gene.colorIdx] || '#888888';
    const rgb = Color.hexToRgb(hex);

    ctx.save();
    ctx.translate(gene.x, gene.y);
    ctx.rotate(gene.rotation);
    ctx.globalAlpha = gene.opacity;

    ctx.fillStyle = hex;
    // Subtle shadow for depth
    ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`;
    ctx.shadowBlur = gene.radius * 0.15;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const r = gene.radius;

    switch (gene.shapeType) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'rect':
        ctx.beginPath();
        // Slightly rounded rectangle
        roundRect(ctx, -r, -r * 0.7, r * 2, r * 1.4, r * 0.12);
        ctx.fill();
        break;

      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.866, r * 0.5);
        ctx.lineTo(-r * 0.866, r * 0.5);
        ctx.closePath();
        ctx.fill();
        break;

      case 'ellipse':
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'hexagon':
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const px = r * Math.cos(angle);
          const py = r * Math.sin(angle);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        break;

      case 'star':
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          const rad = i % 2 === 0 ? r : r * 0.42;
          const px = rad * Math.cos(angle);
          const py = rad * Math.sin(angle);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        break;

      default:
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
  }

  /** Helper: draw a rounded rectangle path. */
  function roundRect(ctx, x, y, w, h, radius) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  /**
   * Draw a full composition.
   * Sorts shapes back-to-front by visual weight (lighter behind, heavier in front).
   */
  function drawComposition(ctx, genes, palette, bgColor) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Background
    ctx.globalAlpha = 1;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    // Sort: lower visual weight (paler, bigger) drawn first (behind)
    const sorted = [...genes].sort((a, b) => {
      const rgbA = Color.hexToRgb(palette[a.colorIdx] || '#888');
      const rgbB = Color.hexToRgb(palette[b.colorIdx] || '#888');
      const wA = Color.visualWeight(rgbA.r, rgbA.g, rgbA.b) * a.opacity;
      const wB = Color.visualWeight(rgbB.r, rgbB.g, rgbB.b) * b.opacity;
      return wA - wB;
    });

    for (const gene of sorted) {
      drawShape(ctx, gene, palette);
    }

    // Reset
    ctx.globalAlpha = 1;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  /**
   * Smooth interpolation between two compositions for animated transitions.
   * Returns an interpolated gene array.
   */
  function interpolate(genesA, genesB, t) {
    const ease = t * t * (3 - 2 * t); // smoothstep
    const len = Math.min(genesA.length, genesB.length);
    const result = [];

    for (let i = 0; i < len; i++) {
      const a = genesA[i];
      const b = genesB[i];
      result.push({
        x: a.x + (b.x - a.x) * ease,
        y: a.y + (b.y - a.y) * ease,
        radius: a.radius + (b.radius - a.radius) * ease,
        rotation: a.rotation + (b.rotation - a.rotation) * ease,
        colorIdx: ease < 0.5 ? a.colorIdx : b.colorIdx,
        shapeType: ease < 0.5 ? a.shapeType : b.shapeType,
        opacity: a.opacity + (b.opacity - a.opacity) * ease,
      });
    }

    return result;
  }

  return {
    drawComposition,
    interpolate,
  };
})();
