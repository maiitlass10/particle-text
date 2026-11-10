# Particle Text

Type any word and thousands of particles fly in to form it. Move the mouse through the text to scatter them, or click to blow it apart. They always find their way home.

Built with plain JavaScript and the HTML Canvas API. No libraries.

| | | |
|---|---|---|
| ![](shot-1.png) | ![](shot-2.png) | ![](shot-3.png) |

## Features
- **Text to particles**: the word is drawn on a hidden canvas and its pixels are sampled into ~4,000+ target points
- **Real-time physics**: every particle has velocity, a spring force pulling it home (Hooke's law), friction, and mouse repulsion
- **Morphing**: typing a new word re-uses the existing particles, so one word flows into the next
- **Speed-based colour**: fast particles glow bright, slow ones settle into deep blue
- **Motion trails**: a translucent background fade instead of a full clear
- **Click to explode**, touch support, shareable links (`#yourword`)
- Runs at 60 FPS with ~4,700 particles

## How it works
Each frame, for every particle:
1. `velocity += (home - position) * spring`: pull toward its spot in the text
2. If the mouse is close: `velocity += direction_away * (1 - distance / radius) * force`
3. `velocity *= friction`, then `position += velocity`

## Run it
Open `index.html` in a browser.

## Tech
JavaScript (ES6), HTML5 Canvas 2D, CSS
