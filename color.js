/**
 * Colour utility functions: parsing, luminosity, perceived brightness,
 * contrast, and visual weight calculations.
 */

const Color = (() => {
  /** Parse hex (#RRGGBB) to {r, g, b} in 0-255. */
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  }

  function rgbToHex(r, g, b) {
    const toHex = (v) => Math.round(Math.max(0, Math.min(255, v)))
      .toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /** RGB to HSL. Returns {h: 0-360, s: 0-1, l: 0-1}. */
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return { h: h * 360, s, l };
  }

  /**
   * Relative luminance (WCAG formula).
   * Takes 0-255 RGB values, returns 0-1.
   */
  function relativeLuminance(r, g, b) {
    const srgb = [r, g, b].map((c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  }

  /**
   * Perceived brightness (0-1).
   * Uses a weighted formula closer to human perception.
   */
  function perceivedBrightness(r, g, b) {
    return Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b) / 255;
  }

  /**
   * Saturation (0-1) from RGB.
   */
  function saturation(r, g, b) {
    return rgbToHsl(r, g, b).s;
  }

  /**
   * Visual weight of a colour.
   * Bright, saturated colours feel heavier; pale/light colours feel lighter.
   * Returns 0-1, where 1 = maximum visual weight.
   */
  function visualWeight(r, g, b) {
    const bright = perceivedBrightness(r, g, b);
    const sat = saturation(r, g, b);
    // High saturation + medium brightness = heaviest
    // Very bright (pale) = lightest
    // Very dark = moderately heavy
    return sat * 0.6 + (1 - bright) * 0.4;
  }

  /**
   * Target size multiplier based on colour properties.
   * Brighter colours -> smaller shapes. Paler -> bigger.
   * Returns a multiplier roughly in 0.3 - 1.5 range.
   */
  function sizeForColour(r, g, b) {
    const bright = perceivedBrightness(r, g, b);
    const sat = saturation(r, g, b);
    // Highly saturated bright colours => small
    // Low saturation, high lightness (pale) => large
    // Dark colours => medium-large
    const paleness = (1 - sat) * bright; // high when pale
    const intensity = sat * bright;       // high when vivid+bright
    return 0.4 + paleness * 1.0 - intensity * 0.3;
  }

  /** Colour distance (simple Euclidean in RGB space). */
  function distance(c1, c2) {
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /** CIEDE2000-ish perceptual distance (simplified). */
  function perceptualDistance(c1, c2) {
    // Weight green channel more for perceptual accuracy
    const dr = (c1.r - c2.r) * 0.30;
    const dg = (c1.g - c2.g) * 0.59;
    const db = (c1.b - c2.b) * 0.11;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  return {
    hexToRgb,
    rgbToHex,
    rgbToHsl,
    relativeLuminance,
    perceivedBrightness,
    saturation,
    visualWeight,
    sizeForColour,
    distance,
    perceptualDistance,
  };
})();
