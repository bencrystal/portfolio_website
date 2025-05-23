'use client';

import { useRef } from 'react';
import { NextReactP5Wrapper } from "@p5-wrapper/next";
import type { P5CanvasInstance, Sketch } from "@p5-wrapper/react";

interface BackgroundProps {
  text?: string;
  fontSize?: number;
  spacing?: number;
}

const Background = ({ text = "^ ◡ ^", fontSize = 10, spacing = 14 }: BackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const sketch: Sketch = (p: P5CanvasInstance) => {
    const ROLL_MULTIPLIER = 0.6;
    const baseSpacing = spacing || 27;
    const gridSpacing = {
      x: baseSpacing * 2.5,
      y: baseSpacing * 1.5
    };
    const gridColor = p.color(87, 241, 255, 255);
    const ringColor = p.color(87, 241, 255);
    const noiseScale = 0.05;
    
    let gridPositions: {
      x: number, 
      y: number, 
      noiseOffsetX: number,
      noiseOffsetY: number
    }[] = [];
    
    const calculateGridPositions = () => {
      gridPositions = [];
      for (let x = 0; x < window.innerWidth; x += gridSpacing.x) {
        for (let y = 0; y < window.innerHeight; y += gridSpacing.y) {
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
    
    let minWarpRadius = 50;
    let maxWarpRadius = 100;
    let warpRadius = minWarpRadius;

    let frameCount = 0;

    p.setup = () => {
      const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
      canvas.position(0, 0);
      canvas.style('z-index', '-1');
      
      // Apply CSS opacity to canvas universally for text transparency
      canvas.style('opacity', '0.15');
      
      p.textSize(fontSize);
      p.noStroke();

      calculateGridPositions();

      // Add touch event listeners
      const canvasElement = canvas.elt as HTMLCanvasElement;
      canvasElement.addEventListener('touchstart', (event: TouchEvent) => {
        isTouching = true;
        touchX = event.touches[0].clientX;
        touchY = event.touches[0].clientY;
        event.preventDefault();
      });

      canvasElement.addEventListener('touchmove', (event: TouchEvent) => {
        touchX = event.touches[0].clientX;
        touchY = event.touches[0].clientY;
        event.preventDefault();
      });

      canvasElement.addEventListener('touchend', () => {
        isTouching = false;
        touchX = -1000;
        touchY = -1000;
      });
    };

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

      if (speed > 0.1) {
        warpRadius = p.lerp(warpRadius, p.map(speed, 0, 20, minWarpRadius, maxWarpRadius), 0.015);
      } else {
        warpRadius = p.lerp(warpRadius, minWarpRadius, 0.015);
      }

      prevX = inputX;
      prevY = inputY;

      frameCount++;
      if (frameCount % 2 === 0) {
        noiseOffsetX += 0.008;
        noiseOffsetY += 0.012;
      }

      // Draw text first (background layer)
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

      // Draw rolling ball on top (foreground layer)
      if (cursorX > -900) {
        const dx = cursorX - prevX;
        const dy = cursorY - prevY;
        const moveSpeed = Math.sqrt(dx * dx + dy * dy);
        
        if (moveSpeed > 0.1) {
          rollAngle = Math.atan2(dy, dx);
          const circumference = Math.PI * warpRadius * 2;
          rollPhase += (moveSpeed / circumference) * ROLL_MULTIPLIER;
        }
        
        p.push();
        p.translate(cursorX, cursorY);
        
        p.noFill();
        // Compensate ring opacity for universal CSS opacity (0.15)
        p.stroke(p.red(ringColor), p.green(ringColor), p.blue(ringColor), 130);
        p.strokeWeight(2);
        p.circle(0, 0, warpRadius * 2);
        
        const w = warpRadius * 2;
        for (let i = 0; i < 2; i++) {
          p.push();
          const phase = rollPhase + (i * Math.PI/2);
          const sinPhase = Math.abs(Math.sin(phase));
          
          // Compensate ellipse opacity for universal CSS opacity (0.15)
          p.stroke(p.red(ringColor), p.green(ringColor), p.blue(ringColor), sinPhase * 200 + 100);
          p.strokeWeight(3);
          p.rotate(rollAngle + Math.PI/2);
          p.ellipse(0, 0, w, w * sinPhase);
          p.pop();
        }
        p.pop();
      }
    };

    p.windowResized = () => {
      p.resizeCanvas(window.innerWidth, window.innerHeight);
      calculateGridPositions();
    };
  };

  return (
    <div ref={containerRef} className="fixed inset-0" style={{ zIndex: 0, background: 'rgb(9, 9, 11)', pointerEvents: 'none' }}>
      <NextReactP5Wrapper sketch={sketch} />
    </div>
  );
};

export default Background; 