# Evolutionary Composition

An interactive web application that uses genetic algorithms to evolve abstract visual compositions toward aesthetic harmony.

## How to Run

Simply open `index.html` in a modern web browser. No build process or installation required.

**Quick Start:**
1. Open `index.html` in your web browser (Chrome, Firefox, Safari, or Edge)
2. Click the **"Evolve"** button to start the evolution
3. Watch as shapes evolve toward visual harmony based on the configured rules

That's it! The evolution will begin immediately, and you'll see compositions transform through successive generations.

## What is This?

This project demonstrates interactive genetic algorithms applied to visual design. A population of abstract compositions (collections of colored shapes) evolves over time, with each generation being slightly "better" than the last according to configurable aesthetic criteria.

The evolutionary algorithm uses:
- **Selection**: Tournament selection picks the fittest individuals to reproduce
- **Crossover**: Parent compositions combine to create offspring
- **Mutation**: Random changes introduce variation and exploration
- **Fitness Functions**: Multiple harmony rules evaluate aesthetic quality

## Interface Guide

### Canvas
The main canvas (800x800px) displays the current best composition, smoothly transitioning between generations.

**Stats Display:**
- **Generation**: Current generation number
- **Fitness**: Quality score (0-100%) based on harmony weights

### Controls

#### Palette
Configure the color palette for your compositions:
- Click color swatches to change colors
- **+ Add Colour**: Add a new color to the palette
- **×**: Remove a color (minimum 2 colors required)

#### Shapes
- **Number of shapes** (5-60): How many shapes in each composition
- **Shape types**: Select which shapes to include (circles, rectangles, triangles, ellipses)

#### Evolution
- **Population size** (10-100): How many compositions evolve simultaneously (larger = better results but slower)
- **Mutation rate** (1-50%): Probability of random changes (higher = more exploration)
- **Speed** (1-50): Generations per second

#### Harmony Weights
Fine-tune what makes a "good" composition by adjusting these fitness components:

- **Colour balance** (0-100): Rewards even use of all palette colors and spreading colors across regions
- **Spatial distribution** (0-100): Encourages shapes to spread across the canvas without clumping
- **Size-luminosity rule** (0-100): Bright colors should be small, pale colors should be large
- **Overlap penalty** (0-100): Reduces excessive overlapping of shapes
- **Visual weight balance** (0-100): Centers visual mass near the canvas center

Set a weight to 0 to disable that rule entirely.

#### Background
Choose the canvas background color.

### Buttons
- **Evolve**: Start the evolution process
- **Pause**: Pause evolution (can be resumed)
- **Reset**: Generate a new random population and reset generation counter
- **Export PNG**: Download the current composition as a PNG image

## Features

- **Real-time Evolution**: Watch compositions improve live with smooth animated transitions
- **Interactive Parameters**: Adjust all settings during evolution - changes apply immediately
- **Multiple Aesthetic Rules**: Combine different harmony principles with configurable weights
- **Genetic Algorithm**: Tournament selection, uniform crossover, and smart mutations
- **Export Capability**: Save interesting compositions as PNG files
- **No Dependencies**: Pure JavaScript with no external libraries

## Technical Details

**Architecture:**
- Pure JavaScript (ES5+ compatible)
- HTML5 Canvas for rendering
- Modular design with separate concerns:
  - `evolution.js`: Core genetic algorithm engine
  - `render.js`: Canvas drawing and interpolation
  - `color.js`: Color utilities and perceptual calculations
  - `app.js`: UI controller and animation loop
  - `style.css`: Interface styling

**Genetic Representation:**
Each individual is an array of "shape genes" with properties:
- Position (x, y)
- Size (radius)
- Rotation
- Color (palette index)
- Shape type
- Opacity

**Fitness Evaluation:**
Compositions are scored on multiple weighted criteria:
1. Color balance across regions and palette coverage
2. Spatial distribution (grid occupancy and anti-clumping)
3. Size-luminosity correlation (perceptual harmony)
4. Overlap penalty (avoiding visual clutter)
5. Visual weight balance (compositional stability)

## Tips for Best Results

- **Start Simple**: Begin with default settings to understand the basics
- **Adjust Weights**: Experiment with different harmony weights to achieve different aesthetic styles
- **Population vs Speed**: Larger populations find better solutions but evolve slower; balance based on your needs
- **Mutation Rate**: Lower rates refine existing solutions; higher rates explore more radically different designs
- **Color Palette**: The palette dramatically affects results - try complementary, analogous, or monochromatic schemes
- **Let It Run**: Good compositions often emerge after 50-100+ generations

## Examples of Use

**Minimalist Compositions**:
- Low shape count (5-15)
- High spatial distribution weight
- Low overlap penalty

**Dense Abstract Art**:
- High shape count (40-60)
- Low overlap penalty
- High color balance weight

**Balanced Designs**:
- Medium shape count (20-30)
- Equal weights across all harmony rules
- Moderate mutation rate (10-20%)

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES5+ JavaScript
- CSS3

Tested in Chrome, Firefox, Safari, and Edge.
