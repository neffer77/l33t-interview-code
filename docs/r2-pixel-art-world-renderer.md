# R2 — Pixel-Art World Renderer

R2 replaces the old orthogonal 32×32 Phaser presentation with the first world renderer that matches the Codeopolis Product Constitution.

## Player-facing contract

- The City uses a 64×32 isometric projection rather than square orthogonal tiles.
- Terrain is rendered as layered pixel-art diamonds with grass, dirt, forest, and animated water variants.
- Roads follow the isometric grid and visibly connect along the diamond axes.
- Trees, flowers, stones, tufts, and terrain variation make empty land read as a world instead of a debug grid.
- Buildings use cohesive isometric pixel placeholders until R3 supplies the dedicated building asset/sprite system.
- Citizens and ambient activity use the same isometric projection as buildings and roads.
- Camera, tap selection, road painting, and building placement all share the canonical `PixelWorldProjection` transform.

## Architecture

`PixelWorldProjection` is now the coordinate contract for the visual city. It exposes deterministic world layout, tile-to-world, world-to-tile, tile corners, footprint centers, and depth ordering. Future R3+ artwork must consume this projection rather than inventing another renderer coordinate system.

## R2 acceptance gate

A deployed City should no longer resemble the old dark-blue diamond/debug grid or a flat orthogonal tile board. Even on mostly empty land it should read as a coherent isometric pixel-art landscape with terrain variation, vegetation, roads, depth, and a camera framed around the playable world.

R2 does not claim the building art is finished. R3 is responsible for the dedicated building sprite/atlas system, construction stages, footprint-aware structures, and age/district variants.
