# Deep Interview Spec: Flappy Bird — Elite Lighthouse Edition

## Metadata
- Interview ID: flappy-di-001
- Rounds: 4
- Final Ambiguity Score: 11.5%
- Type: greenfield
- Generated: 2026-03-24
- Threshold: 0.2
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.90 | 40% | 0.36 |
| Constraint Clarity | 0.85 | 30% | 0.255 |
| Success Criteria | 0.90 | 30% | 0.27 |
| **Total Clarity** | | | **0.885** |
| **Ambiguity** | | | **11.5%** |

## Goal
Build the most successful, user-friendly, and visually engaging Flappy Bird game in pure vanilla HTML/CSS/JavaScript — featuring smooth 60fps gameplay, visual polish with animations and particle effects, and a Lighthouse composite score of 95+ across Performance, Accessibility, and Best Practices. The game must be locally deployable with zero build steps.

## Constraints
- Vanilla HTML/CSS/JS only — no frameworks, no npm dependencies in the game itself
- Single `index.html` entry point (optionally with linked `.js`/`.css` files)
- Must run via `npx serve .` or `python -m http.server` — zero build step
- Target: Lighthouse composite ≥ 95 (Performance + Accessibility + Best Practices averaged)
- Local deployment only (no cloud/CDN required)

## Non-Goals
- Backend / server-side logic
- Multiplayer
- Mobile native app (responsive web is fine)
- Sound effects or music (not selected)
- Leaderboard/high-score persistence (not selected)

## Acceptance Criteria
- [ ] Game loads and renders a canvas with bird + pipes in under 2 seconds
- [ ] Bird responds to spacebar / tap with smooth flap animation
- [ ] Pipes scroll at consistent speed, gaps are passable
- [ ] Score increments when passing through pipes
- [ ] Game-over state triggers on collision with pipe or ground
- [ ] Particle explosion effect on bird death
- [ ] Parallax scrolling background (at least 2 layers)
- [ ] Bird has frame animation (wing flap cycle)
- [ ] 60fps maintained via requestAnimationFrame + delta-time physics
- [ ] `npx lighthouse http://localhost:3000 --output json` composite score ≥ 95
- [ ] All interactive elements have ARIA labels (accessibility)
- [ ] No console errors on load or during gameplay

## Technical Context
- **Stack:** Vanilla HTML5 Canvas + JavaScript (ES6+)
- **Rendering:** requestAnimationFrame loop, delta-time physics
- **Assets:** Procedurally drawn or inline SVG/Canvas shapes (no external image files needed for top Lighthouse score)
- **Local server:** `npx serve .` on port 3000, or `python -m http.server 3000`
- **Evaluator:** Lighthouse headless on http://localhost:3000, composite score = (performance + accessibility + best-practices) / 3 × 100, pass = ≥ 95

## Ontology (Key Entities)
| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| Bird | core domain | x, y, velocity, rotation, frameIndex | collides with Pipe, Ground |
| Pipe | core domain | x, gapY, gapHeight, speed, passed | spawned by PipeManager |
| PipeManager | supporting | pipes[], spawnInterval, speed | manages Pipe lifecycle |
| GameLoop | core domain | fps, deltaTime, state | drives Bird, PipeManager, Renderer |
| Renderer | supporting | canvas, ctx | draws Bird, Pipe, Background, Particles |
| ParticleSystem | supporting | particles[], maxParticles | triggered on Bird collision |
| Background | supporting | layers[], scrollSpeed | parallax layers drawn by Renderer |
| Score | supporting | current, best | updated by GameLoop on pipe pass |
| GameState | core domain | IDLE, PLAYING, DEAD | controls GameLoop behavior |

## Interview Transcript
<details>
<summary>Full Q&A (4 rounds)</summary>

### Round 1
**Q:** What metric should autoresearch optimize for?
**A:** Lighthouse score (Performance + Accessibility + Best Practices)
**Ambiguity:** 75%

### Round 2
**Q:** What technology stack?
**A:** Vanilla HTML/CSS/JS
**Ambiguity:** 55%

### Round 3
**Q:** What features matter most for engagement?
**A:** Smooth 60fps gameplay + Visual polish & animations
**Ambiguity:** 35%

### Round 4
**Q:** Target Lighthouse score threshold?
**A:** 95+ (Elite)
**Ambiguity:** 11.5%
</details>
