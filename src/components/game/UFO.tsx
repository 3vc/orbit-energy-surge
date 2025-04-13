
import React, { useRef, useEffect } from "react";
import { UFO as UFOType, Position } from "@/store/gameStore";

interface UFOProps {
  ufo: UFOType;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string) => void;
  onPositionUpdate: (id: string, position: Position) => void;
}

export const UFO: React.FC<UFOProps> = ({
  ufo,
  onDragStart,
  onDragEnd,
  onPositionUpdate,
}) => {
  const ufoRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!ufoRef.current) return;
    
    const rect = ufoRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    onDragStart(ufo.id);
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!ufo.isDragging) return;
    
    const newPosition = {
      x: e.clientX - dragOffsetRef.current.x,
      y: e.clientY - dragOffsetRef.current.y,
    };
    
    onPositionUpdate(ufo.id, newPosition);
  };

  const handleMouseUp = () => {
    onDragEnd(ufo.id);
    
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Clean up event listeners if component unmounts while dragging
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={ufoRef}
      className="absolute cursor-grab ufo-glow"
      style={{
        left: ufo.position.x - ufo.radius,
        top: ufo.position.y - ufo.radius,
        width: ufo.radius * 2,
        height: ufo.radius * 2,
        borderRadius: "50%",
        backgroundColor: ufo.collectedEnergy > 0 ? "rgba(255, 215, 0, 0.3)" : "transparent",
        cursor: ufo.isDragging ? "grabbing" : "grab",
        zIndex: 20,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="w-full h-full relative">
        {/* UFO Body */}
        <div 
          className="absolute inset-0 animate-pulse-soft"
          style={{ 
            background: `radial-gradient(circle, theme('colors.game.ufo') 50%, rgba(155, 135, 245, 0.2) 100%)`,
            borderRadius: "50%",
          }}
        />
        
        {/* Energy indicator */}
        {ufo.collectedEnergy > 0 && (
          <div className="absolute top-0 left-0 w-full flex justify-center">
            <div className="text-game-energy font-bold text-sm px-2 py-1 rounded-full bg-black/30">
              {ufo.collectedEnergy}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
