'use client';

import { useEffect, useRef } from 'react';
import type p5Types from 'p5';
import type { Color } from 'p5';

interface BackgroundProps {
  text?: string;  // Make text configurable
  fontSize?: number;  // Add font size prop
  spacing?: number;  // Add spacing prop
}

const Background = ({ text = "^ ◡ ^", fontSize = 10, spacing = 14 }: BackgroundProps) => {  // Default to original face and 8
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<any>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const loadP5 = async () => {
      try {
        // Import non-minified p5
        const p5Module = await import('p5/lib/p5');
        const p5 = p5Module.default;
        
        if (!containerRef.current) return;

        const sketch = (p: p5Types) => {
          const ROLL_MULTIPLIER = 0.6;
          // Increase base spacing and use it as a multiplier
          const baseSpacing = spacing || 27;
          const gridSpacing = {
            x: baseSpacing * 2.5, // Make horizontal spacing wider for the cat faces
            y: baseSpacing * 1.5  // Adjust vertical spacing
          };
          const gridColor: Color = p.color(87, 241, 255, 40);
          const ringColor: Color = p.color(87, 241, 255);
          const noiseScale = 0.05;
          
          // Pre-calculate grid positions with more data to avoid calculations in draw loop
          let gridPositions: {
            x: number, 
            y: number, 
            noiseOffsetX: number,
            noiseOffsetY: number
          }[] = [];
          
          const calculateGridPositions = () => {
            gridPositions = [];
            // Use separate x and y spacing
            for (let x = gridSpacing.x; x < p.windowWidth; x += gridSpacing.x) {
              for (let y = gridSpacing.y; y < p.windowHeight; y += gridSpacing.y) {
                gridPositions.push({
                  x,
                  y,
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
            const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
            canvas.position(0, 0);
            canvas.style('z-index', '-1');
            p.textSize(fontSize);
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
            
            // Use the ref values instead of p.mouseX/Y
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
              
              // Draw rings with reduced opacity
              p.push();
              p.translate(cursorX, cursorY);
              
              // Reduce faint circle opacity from 40 to 20
              p.noFill();
              p.stroke(p.red(ringColor), p.green(ringColor), p.blue(ringColor), 20);
              p.strokeWeight(2);
              p.circle(0, 0, warpRadius * 2);
              
              // Draw rotating rings with reduced opacity
              const w = warpRadius * 2;
              for (let i = 0; i < 2; i++) {
                p.push();
                const phase = rollPhase + (i * Math.PI/2);
                const sinPhase = Math.abs(Math.sin(phase));
                
                // Reduce ring opacity from (40 + 20) to (20 + 10)
                p.stroke(p.red(ringColor), p.green(ringColor), p.blue(ringColor), sinPhase * 30 + 15);
                p.strokeWeight(3);
                p.rotate(rollAngle + Math.PI/2);
                p.ellipse(0, 0, w, w * sinPhase);
                p.pop();
              }
              p.pop();
            }

            // Optimize grid drawing
            p.textSize(fontSize);
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
                
                p.text(text, pos.x - 2*offsetX + windX, pos.y - 2*offsetY + windY);
              } else {
                const windX = p.map(p.noise(pos.noiseOffsetX + currentNoiseOffsetX, pos.y * noiseScale), 0, 1, -2, 2);
                const windY = p.map(p.noise(pos.x * noiseScale, pos.noiseOffsetY + currentNoiseOffsetY), 0, 1, -1, 1);
                p.text(text, pos.x + windX, pos.y + windY);
              }
            }
          };

          p.windowResized = () => {
            p.resizeCanvas(window.innerWidth, window.innerHeight);
            calculateGridPositions();
          };
        };

        // Create new p5 instance
        p5Instance.current = new p5(sketch, containerRef.current);
        
        cleanup = () => {
          if (p5Instance.current) {
            p5Instance.current.remove();
          }
        };
      } catch (error) {
        console.error('Error loading p5:', error);
      }
    };

    loadP5();

    // Cleanup function
    return () => {
      if (cleanup) cleanup();
    };
  }, [text, fontSize, spacing]); // Add text, fontSize, and spacing to dependency array

  return (
    <div
      ref={containerRef}
      className="fixed inset-0"
      style={{ 
        zIndex: 0,
        background: 'rgb(9, 9, 11)',
        pointerEvents: 'none'  // Allow clicks to pass through to content
      }}
    />
  );
};

export default Background; 