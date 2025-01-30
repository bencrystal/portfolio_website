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
        const ROLL_MULTIPLIER = 0.6;
        const spacing = 27;
        const gridColor = p.color(87, 241, 255, 100);  // Cache color
        const ringColor = p.color(87, 241, 255);  // Base color for rings
        const noiseScale = 0.05;  // Cache noise scale
        
        // Pre-calculate grid positions with more data to avoid calculations in draw loop
        let gridPositions: {
          x: number, 
          y: number, 
          noiseOffsetX: number,
          noiseOffsetY: number
        }[] = [];
        
        const calculateGridPositions = () => {
          gridPositions = [];
          for (let x = spacing; x < p.windowWidth; x += spacing) {
            for (let y = spacing; y < p.windowHeight; y += spacing) {
              gridPositions.push({
                x,
                y,
                // Pre-calculate noise offsets for each position
                noiseOffsetX: x * noiseScale,
                noiseOffsetY: y * noiseScale
              });
            }
          }
        };

        let cursorX = 0;
        let cursorY = 0;
        let prevX = 0;
        let prevY = 0;
        const easing = 0.06;
        let noiseOffsetX = 0;
        let noiseOffsetY = 10000;
        let isTouching = false;
        let touchX = 0;
        let touchY = 0;
        let rollAngle = 0;
        let rollPhase = 0;
        
        // Keep the dynamic warp radius
        let minWarpRadius = 50;
        let maxWarpRadius = 100;
        let warpRadius = minWarpRadius;

        let frameCount = 0;

        p.setup = () => {
          const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
          canvas.position(0, 0);
          canvas.style('z-index', '-1');
          p.textSize(12);
          p.noStroke();

          calculateGridPositions();

          // Add touch event listeners
          canvas.touchStarted((event: TouchEvent) => {
            isTouching = true;
            touchX = event.touches[0].clientX;
            touchY = event.touches[0].clientY;
            return false; // Prevent default
          });

          canvas.touchMoved((event: TouchEvent) => {
            touchX = event.touches[0].clientX;
            touchY = event.touches[0].clientY;
            return false; // Prevent default
          });

          canvas.touchEnded(() => {
            isTouching = false;
            touchX = -1000;
            touchY = -1000;
            return false; // Prevent default
          });
        };

        // Cache distance calculations
        const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
          const dx = x2 - x1;
          const dy = y2 - y1;
          return Math.sqrt(dx * dx + dy * dy);
        };

        p.draw = () => {
          p.clear();
          
          const inputX = isTouching ? touchX : p.mouseX;
          const inputY = isTouching ? touchY : p.mouseY;

          if ((inputX < 0 || inputX > p.width || inputY < 0 || inputY > p.height) && !isTouching) {
            cursorX = -1000;
            cursorY = -1000;
          } else {
            cursorX += (inputX - cursorX) * easing;
            cursorY += (inputY - cursorY) * easing;
          }

          let speed = getDistance(inputX, inputY, prevX, prevY);

          // Update warp radius - allow shrinking even without movement
          if (speed > 0.1) {
            // Expand with movement
            warpRadius = p.lerp(warpRadius, p.map(speed, 0, 20, minWarpRadius, maxWarpRadius), 0.015);
          } else {
            // Shrink when still
            warpRadius = p.lerp(warpRadius, minWarpRadius, 0.015);
          }

          prevX = inputX;
          prevY = inputY;

          frameCount++;
          if (frameCount % 2 === 0) { // Update every other frame
            noiseOffsetX += 0.008;
            noiseOffsetY += 0.012;
          }

          // Draw the marble effect
          if (cursorX > -900) {
            const dx = cursorX - prevX;
            const dy = cursorY - prevY;
            const moveSpeed = Math.sqrt(dx * dx + dy * dy);
            
            if (moveSpeed > 0.1) {
              rollAngle = Math.atan2(dy, dx);
              const circumference = Math.PI * warpRadius * 2;
              rollPhase += (moveSpeed / circumference) * ROLL_MULTIPLIER;
            }
            
            // Draw rings
            p.push();
            p.translate(cursorX, cursorY);
            
            // Draw faint circle
            p.noFill();
            p.stroke(ringColor.levels[0], ringColor.levels[1], ringColor.levels[2], 40);
            p.strokeWeight(2);
            p.circle(0, 0, warpRadius * 2);
            
            // Draw rotating rings
            const w = warpRadius * 2;
            for (let i = 0; i < 2; i++) {
              p.push();
              const phase = rollPhase + (i * Math.PI/2);
              const sinPhase = Math.abs(Math.sin(phase));
              
              p.stroke(ringColor.levels[0], ringColor.levels[1], ringColor.levels[2], sinPhase * 40 + 20);
              p.strokeWeight(3);
              p.rotate(rollAngle + Math.PI/2);
              p.ellipse(0, 0, w, w * sinPhase);
              p.pop();
            }
            p.pop();
          }

          // Optimize grid drawing
          p.textSize(8);  // Set default text size once
          p.fill(gridColor);
          
          const warpRadiusSq = warpRadius * warpRadius;
          const currentNoiseOffsetX = noiseOffsetX;
          const currentNoiseOffsetY = noiseOffsetY;
          
          for (const pos of gridPositions) {
            const dx = cursorX - pos.x;
            const dy = cursorY - pos.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < warpRadiusSq) {
              const dist = Math.sqrt(distSq);
              const force = p.pow((warpRadius - dist) / warpRadius, 1.5);
              const offsetX = dx * force * 0.4;
              const offsetY = dy * force * 0.4;
              
              const windX = p.map(p.noise(pos.noiseOffsetX + currentNoiseOffsetX, pos.y * noiseScale), 0, 1, -2, 2);
              const windY = p.map(p.noise(pos.x * noiseScale, pos.noiseOffsetY + currentNoiseOffsetY), 0, 1, -1, 1);
              
              p.text("^ ◡ ^", pos.x - 2*offsetX + windX, pos.y - 2*offsetY + windY);
            } else {
              const windX = p.map(p.noise(pos.noiseOffsetX + currentNoiseOffsetX, pos.y * noiseScale), 0, 1, -2, 2);
              const windY = p.map(p.noise(pos.x * noiseScale, pos.noiseOffsetY + currentNoiseOffsetY), 0, 1, -1, 1);
              p.text("^ ◡ ^", pos.x + windX, pos.y + windY);
            }
          }
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
          calculateGridPositions();
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