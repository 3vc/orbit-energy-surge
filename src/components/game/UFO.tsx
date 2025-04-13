
import React, { useRef, useEffect, useState } from "react";
import { UFO as UFOType, Position } from "@/store/gameStore";
import { useIsMobile } from "@/hooks/use-mobile";

interface UFOProps {
  ufo: UFOType;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string) => void;
  onPositionUpdate: (id: string, position: Position) => void;
  onOrbCollection?: () => void;
}

export const UFO: React.FC<UFOProps> = ({
  ufo,
  onDragStart,
  onDragEnd,
  onPositionUpdate,
  onOrbCollection,
}) => {
  const ufoRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const isMobile = useIsMobile();

  // Handle mobile touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!ufoRef.current) return;
    
    const touch = e.touches[0];
    const rect = ufoRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
    
    onDragStart(ufo.id);
    setIsMoving(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!ufo.isDragging) return;
    
    const touch = e.touches[0];
    const newPosition = {
      x: touch.clientX - dragOffsetRef.current.x,
      y: touch.clientY - dragOffsetRef.current.y,
    };
    
    onPositionUpdate(ufo.id, newPosition);
  };

  const handleTouchEnd = () => {
    onDragEnd(ufo.id);
    setIsMoving(false);
  };

  // Handle mouse events for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!ufoRef.current) return;
    
    const rect = ufoRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    onDragStart(ufo.id);
    setIsMoving(true);
    
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
    setIsMoving(false);
    
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Keyboard controls
  useEffect(() => {
    const SPEED = ufo.speed * 5; // Adjust for keyboard movement
    let keyState = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      a: false,
      s: false,
      d: false,
      " ": false, // Space
    };

    const keyDownHandler = (e: KeyboardEvent) => {
      if (Object.keys(keyState).includes(e.key)) {
        keyState[e.key as keyof typeof keyState] = true;
        if (!isMoving) {
          setIsMoving(true);
          onDragStart(ufo.id);
        }
        
        // Handle space key for collecting orbs
        if (e.key === " " && onOrbCollection) {
          onOrbCollection();
        }
        
        e.preventDefault();
      }
    };

    const keyUpHandler = (e: KeyboardEvent) => {
      if (Object.keys(keyState).includes(e.key)) {
        keyState[e.key as keyof typeof keyState] = false;
        
        // Check if any movement keys are still pressed
        const stillMoving = Object.entries(keyState).some(([key, value]) => key !== " " && value);
        if (!stillMoving && isMoving) {
          setIsMoving(false);
          onDragEnd(ufo.id);
        }
        e.preventDefault();
      }
    };

    const moveInterval = setInterval(() => {
      if (!isMoving) return;
      
      let dx = 0;
      let dy = 0;
      
      // Combine arrow keys and WASD
      if (keyState.ArrowUp || keyState.w) dy -= SPEED;
      if (keyState.ArrowDown || keyState.s) dy += SPEED;
      if (keyState.ArrowLeft || keyState.a) dx -= SPEED;
      if (keyState.ArrowRight || keyState.d) dx += SPEED;
      
      if (dx !== 0 || dy !== 0) {
        onPositionUpdate(ufo.id, {
          x: ufo.position.x + dx,
          y: ufo.position.y + dy,
        });
      }
    }, 16); // ~ 60fps

    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);
    
    // Touch events for mobile
    if (isMobile && ufoRef.current) {
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    }

    // Clean up
    return () => {
      clearInterval(moveInterval);
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [ufo.id, ufo.position, ufo.speed, isMoving, isMobile, onDragStart, onDragEnd, onPositionUpdate, onOrbCollection]);

  return (
    <div
      ref={ufoRef}
      className={`absolute ${isMoving ? "cursor-grabbing" : "cursor-grab"} ufo-glow`}
      style={{
        left: ufo.position.x - ufo.radius,
        top: ufo.position.y - ufo.radius,
        width: ufo.radius * 2,
        height: ufo.radius * 2,
        borderRadius: "50%",
        backgroundColor: ufo.collectedEnergy > 0 ? "rgba(255, 215, 0, 0.3)" : "transparent",
        zIndex: 20,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
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
        
        {/* Direction indicator for mobile */}
        {isMobile && (
          <div className="absolute top-1/2 left-1/2 w-2 h-8 bg-white/70 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none" 
            style={{ 
              transform: `translate(-50%, -50%) rotate(${ufo.rotation || 0}deg)`,
              transformOrigin: 'center',
            }} 
          />
        )}
      </div>
    </div>
  );
};
