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
        // ROLL_MULTIPLIER controls how fast the rings appear to revolve
        const ROLL_MULTIPLIER = 0.5;
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
        let isTouching = false;
        let touchX = 0;
        let touchY = 0;
        let angle = 0;
        let prevAngle = 0;
        let rollAngle = 0;
        let rollPhase = 0;
        let tiltX = 0;
        let tiltY = 0;
        let rollX = 0;
        let rollY = 0;

        p.setup = () => {
          const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
          canvas.position(0, 0);
          canvas.style('z-index', '-1');
          p.textSize(12);
          p.noStroke();

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

        p.draw = () => {
          p.clear();
          
          // Handle both mouse and touch input
          const inputX = isTouching ? touchX : p.mouseX;
          const inputY = isTouching ? touchY : p.mouseY;

          if ((inputX < 0 || inputX > p.width || inputY < 0 || inputY > p.height) && !isTouching) {
            cursorX = -1000;
            cursorY = -1000;
          } else {
            cursorX += (inputX - cursorX) * easing;
            cursorY += (inputY - cursorY) * easing;
          }

          let speed = p.dist(inputX, inputY, prevX, prevY);
          warpRadius = p.lerp(warpRadius, p.map(speed, 0, 20, minWarpRadius, maxWarpRadius), .02);

          prevX = inputX;
          prevY = inputY;

          noiseOffsetX += 0.008;
          noiseOffsetY += 0.012;

          // Draw the marble effect
          if (cursorX > -900) {
            let dx = cursorX - prevX;
            let dy = cursorY - prevY;
            let speed = Math.sqrt(dx * dx + dy * dy);
            
            if (speed > 0.1) {
              // Calculate the direction of roll
              let moveAngle = Math.atan2(dy, dx);
              
              // Update roll phase based on distance traveled
              let circumference = Math.PI * warpRadius * 2;
              // Add a factor of 0.5 to make it roll half as fast
              rollPhase += (speed / circumference) * ROLL_MULTIPLIER;
              
              // Smoothly update roll angle
              rollAngle = moveAngle;
            }
            
            p.noFill();
            
            // Draw main circle (faint)
            p.stroke(87, 241, 255, 10);
            p.strokeWeight(2);
            p.circle(cursorX, cursorY, warpRadius * 2);
            
            // Draw the rings
            p.push();
            p.translate(cursorX, cursorY);
            
            // Draw two perpendicular rings
            for (let i = 0; i < 2; i++) {
              p.push();
              
              // Calculate how visible each ring should be based on its current rotation
              let phase = rollPhase + (i * Math.PI/2);
              let visibility = Math.abs(Math.sin(phase)) * 40 + 20;
              
              // Calculate ring shape based on its current rotation
              let w = warpRadius * 2;
              let h = w * Math.abs(Math.sin(phase));
              
              p.stroke(87, 241, 255, visibility);
              p.strokeWeight(3);
              p.rotate(rollAngle + Math.PI/2);
              p.ellipse(0, 0, w, h);
              p.pop();
            }
            
            p.pop();
            
            // Inner glow
            p.stroke(87, 241, 255, 15);
            p.strokeWeight(2);
            p.circle(cursorX, cursorY, warpRadius * 1.7);
            p.circle(cursorX, cursorY, warpRadius * 1.4);
          }

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
              
              // p.noStroke();
              p.fill(87, 241, 255, 100);
              p.text("^ ◡ ^", x - 2*dx + windX, y - 2*dy + windY);
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