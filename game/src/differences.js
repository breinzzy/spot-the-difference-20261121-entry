// Difference model: hit-testing clicks against a scene's differences.
// Coordinates are in the scene's 600 x 640 space; render.js draws the
// objects at these same coordinates, so a click that looks right, is right.

/** How many differences are still unfound in this level. */
export function remaining(scene, found) {
  return scene.diffs.length - found.size;
}

/**
 * Find the unfound difference nearest to a scene-space click, within its
 * radius plus a small forgiveness margin. Returns the diff or null.
 */
export function hitTest(scene, found, sx, sy) {
  let best = null;
  let bestD = Infinity;
  for (const diff of scene.diffs) {
    if (found.has(diff.id)) continue;
    const dx = sx - diff.x;
    const dy = sy - diff.y;
    const dist = Math.hypot(dx, dy);
    const reach = diff.r + 8;
    if (dist <= reach && dist < bestD) {
      best = diff;
      bestD = dist;
    }
  }
  return best;
}

/** The first unfound difference (the hint target), or null when all found. */
export function firstUnfound(scene, found) {
  return scene.diffs.find((d) => !found.has(d.id)) ?? null;
}
