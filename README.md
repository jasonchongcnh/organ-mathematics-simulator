# 3D Organ and Mathematics Simulator

An interactive Three.js simulation of a bendable corrugated organ tube based on
the Figure 12 virtual-link kinematics.

## Model

The adjustable dimensions are `S1`, `S2`, `r`, and `L`. The simulator derives:

```text
L = (S1 + S2) / 4
theta = 2 atan((S1 - S2) / (4r))
x = -L sin(theta)
y = L + L cos(theta)
```

The yellow `S1` and red `S2` components are constrained to the tube's outer
surface and update with the calculated geometry.

## Local Development

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## GitHub Pages

Pushes to `main` deploy automatically through
`.github/workflows/deploy-pages.yml`. The workflow derives the repository base
path and publishes the static `out` directory.
