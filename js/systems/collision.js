export function overlapsCircleRect(x, y, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - nearestX, dy = y - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

export function moveWithCollisions(entity, dx, dy, scene) {
  // Resolve eixo a eixo para permitir deslizar junto às paredes.
  const nextX = entity.x + dx;
  if (nextX - entity.radius >= 0 && nextX + entity.radius <= scene.world.width &&
      !scene.obstacles.some(rect => overlapsCircleRect(nextX, entity.y, entity.radius, rect))) {
    entity.x = nextX;
  }
  const nextY = entity.y + dy;
  if (nextY - entity.radius >= 0 && nextY + entity.radius <= scene.world.height &&
      !scene.obstacles.some(rect => overlapsCircleRect(entity.x, nextY, entity.radius, rect))) {
    entity.y = nextY;
  }
}

export function nearestPoi(player, scene, maxDistance = 100, incomplete = new Set()) {
  let closest = null, best = maxDistance;
  for (const poi of scene.poi) {
    if (incomplete.has(poi.id)) continue;
    const distance = Math.hypot(player.x - poi.x, player.y - poi.y);
    if (distance < best) { closest = poi; best = distance; }
  }
  return closest;
}
