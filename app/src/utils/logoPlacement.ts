
export type LogoPoint = {
    team: string;
    x: number;
    y: number;
  };
  
  export type PlacedLogo = LogoPoint & {
    displayX: number;
    displayY: number;
    displaced: boolean;
  };
  
  export function placeLogos(
    points: LogoPoint[],
    width: number,
    height: number,
    logoSize = 44,
    padding = 7
  ): PlacedLogo[] {
    const placed: PlacedLogo[] = [];
  
    const half = logoSize / 2;
    const separation = logoSize + padding + 6;
  
    const minX = 85 + half + padding;
    const maxX = width - 55 - half - padding;

    const minY = 55 + half + padding;
    const maxY = height - 75 - half - padding;
  
    const sorted = [...points].sort(
      (a, b) => a.y - b.y || a.x - b.x
    );
  
    for (const point of sorted) {
      let found = false;
      let bestX = point.x;
      let bestY = point.y;
  
      for (let radius = 0; radius <= 350; radius += 6) {
        const steps = radius === 0 ? 1 : 48;
  
        for (let i = 0; i < steps; i++) {
          const angle = (2 * Math.PI * i) / steps;
  
          const candidateX =
            point.x + radius * Math.cos(angle);
  
          const candidateY =
            point.y + radius * Math.sin(angle);
  
          if (
            candidateX < minX ||
            candidateX > maxX ||
            candidateY < minY ||
            candidateY > maxY
          ) {
            continue;
          }
  
          const overlap = placed.some((other) => {
            return (
              Math.abs(candidateX - other.displayX) < separation &&
              Math.abs(candidateY - other.displayY) < separation
            );
          });
  
          if (!overlap) {
            bestX = candidateX;
            bestY = candidateY;
            found = true;
            break;
          }
        }
  
        if (found) break;
      }
  
      if (!found) {
        console.warn(
          `No collision-free placement found for ${point.team}`
        );
      }
  
      placed.push({
        ...point,
        displayX: bestX,
        displayY: bestY,
        displaced:
          Math.hypot(bestX - point.x, bestY - point.y) > 1,
      });
    }
  
    return placed;
  }
  