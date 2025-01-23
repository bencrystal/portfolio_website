'use client';

import { useEffect, useRef } from 'react';

const Background = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadP5 = async () => {
      const p5 = (await import('p5')).default;
      if (!containerRef.current) return;

      const sketch = (p: any) => {
        let spacing = 27;
        let minWarpRadius = 50;
        let maxWarpRadius = 100;
        let cursorX = 0;
        let cursorY = 0;
        let prevX = 0;
        let prevY = 0;
        let easing = 0.06;
        let warpRadius = minWarpRadius;
        let noiseOffsetX = 0;
        let noiseOffsetY = 10000;

        p.setup = () => {
          const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
          canvas.position(0, 0);
          canvas.style('z-index', '-1');
          p.textSize(8);
          p.noStroke();
        };

        p.draw = () => {
          p.clear();
          
          if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) {
            cursorX = -1000;
            cursorY = -1000;
          } else {
            cursorX += (p.mouseX - cursorX) * easing;
            cursorY += (p.mouseY - cursorY) * easing;
          }

          let speed = p.dist(p.mouseX, p.mouseY, prevX, prevY);
          warpRadius = p.lerp(warpRadius, p.map(speed, 0, 20, minWarpRadius, maxWarpRadius), .02);

          prevX = p.mouseX;
          prevY = p.mouseY;

          noiseOffsetX += 0.008;
          noiseOffsetY += 0.005;

          for (let x = spacing; x < p.width; x += spacing) {
            for (let y = spacing; y < p.height; y += spacing) {
              let d = p.dist(cursorX, cursorY, x, y);

              let dx = 0;
              let dy = 0;
              if (d < warpRadius) {
                let force = p.pow((warpRadius - d) / warpRadius, 1.5);
                dx = (cursorX - x) * force * 0.4;
                dy = (cursorY - y) * force * 0.4;
                let baseSize = 8;
                let minSize = 6;
                let newSize = p.map(force, 0, 1, baseSize, minSize);
                p.textSize(newSize);
              } else {
                p.textSize(8);
              }

              let windX = p.map(p.noise(x * 0.05 + noiseOffsetX, y * 0.05), 0, 1, -2, 2);
              let windY = p.map(p.noise(x * 0.05, y * 0.05 + noiseOffsetY), 0, 1, -1, 1);
              
              p.fill(87, 241, 255, 100);
              p.text("^ ◡ ^", x + dx + windX, y + dy + windY);
            }
          }
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
        };
      };

      new p5(sketch, containerRef.current);
    };

    loadP5();

    return () => {
      const currentContainer = containerRef.current;
      if (currentContainer) {
        while (currentContainer.firstChild) {
          currentContainer.removeChild(currentContainer.firstChild);
        }
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 0,
        background: 'rgb(9, 9, 11)'
      }}
    />
  );
};

export default Background; 