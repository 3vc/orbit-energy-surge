
import React, { useEffect, useRef } from "react";

interface GameBackgroundProps {
  width: number;
  height: number;
}

export const GameBackground: React.FC<GameBackgroundProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate stars
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Draw stars
    const stars = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
      });
    }

    stars.forEach((star) => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.fill();
    });

    // Draw some subtle nebulas
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 150 + 50;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      
      // Random color for the nebula (purples, blues, teals)
      const hue = 200 + Math.random() * 80;
      
      gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.1)`);
      gradient.addColorStop(1, `hsla(${hue}, 70%, 60%, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      style={{ background: "black" }}
    />
  );
};
