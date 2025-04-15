import React, { useRef, useEffect, useState } from "react";
import { UFO as UFOType, Position } from "@/store/gameStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface UFOProps {
  ufo: UFOType;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string) => void;
  onPositionUpdate: (id: string, position: Position) => void;
  onOrbCollection?: () => void;
  onFireProjectile?: (id: string, direction: number) => void;
  isLocalPlayer?: boolean;
}

export const UFO: React.FC<UFOProps> = ({
  ufo,
  onDragStart,
  onDragEnd,
  onPositionUpdate,
  onOrbCollection,
  onFireProjectile,
  isLocalPlayer = true,
}) => {
  const ufoRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<Position | null>(null);
  const isMobile = useIsMobile();

  const getCursorAngle = () => {
    if (!cursorPosition) return ufo.rotation || 0;
    
    const deltaX = cursorPosition.x - ufo.position.x;
    const deltaY = cursorPosition.y - ufo.position.y;
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!ufoRef.current || !isLocalPlayer) return;
    
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
    if (!ufo.isDragging || !isLocalPlayer) return;
    
    const touch = e.touches[0];
    const newPosition = {
      x: touch.clientX - dragOffsetRef.current.x,
      y: touch.clientY - dragOffsetRef.current.y,
    };
    
    onPositionUpdate(ufo.id, newPosition);
  };

  const handleTouchEnd = () => {
    if (!isLocalPlayer) return;
    onDragEnd(ufo.id);
    setIsMoving(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!ufoRef.current || !isLocalPlayer) return;
    
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
    if (!ufo.isDragging || !isLocalPlayer) return;
    
    const newPosition = {
      x: e.clientX - dragOffsetRef.current.x,
      y: e.clientY - dragOffsetRef.current.y,
    };
    
    onPositionUpdate(ufo.id, newPosition);
  };

  const handleMouseUp = () => {
    if (!isLocalPlayer) return;
    onDragEnd(ufo.id);
    setIsMoving(false);
    
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    if (!isLocalPlayer) return;
    
    const handleCursorMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };
    
    document.addEventListener("mousemove", handleCursorMove);
    
    return () => {
      document.removeEventListener("mousemove", handleCursorMove);
    };
  }, [isLocalPlayer]);

  useEffect(() => {
    if (!isLocalPlayer) return;
    
    const SPEED = ufo.speed * 8;
    let keyState = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      a: false,
      s: false,
      d: false,
      " ": false,
      f: false,
    };

    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key in keyState) {
        keyState[e.key as keyof typeof keyState] = true;

        const isPlayer1Controls = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key);
        const isPlayer2Controls = ["w", "a", "s", "d"].includes(e.key);
        
        if ((ufo.playerOwnerId === "player1" && isPlayer1Controls) || 
            (ufo.playerOwnerId === "player2" && isPlayer2Controls)) {
          
          if (!isMoving) {
            setIsMoving(true);
            onDragStart(ufo.id);
          }
          
          e.preventDefault();
        }
        
        if (e.key === " " && onOrbCollection) {
          onOrbCollection();
          e.preventDefault();
        }
        
        if (e.key === "f" && onFireProjectile) {
          onFireProjectile(ufo.id, getCursorAngle());
          e.preventDefault();
        }
      }
    };

    const keyUpHandler = (e: KeyboardEvent) => {
      if (e.key in keyState) {
        keyState[e.key as keyof typeof keyState] = false;
        
        let stillMoving = false;
        
        if (ufo.playerOwnerId === "player1") {
          stillMoving = keyState.ArrowUp || keyState.ArrowDown || keyState.ArrowLeft || keyState.ArrowRight;
        } else if (ufo.playerOwnerId === "player2") {
          stillMoving = keyState.w || keyState.a || keyState.s || keyState.d;
        }
        
        if (!stillMoving && isMoving) {
          setIsMoving(false);
          onDragEnd(ufo.id);
        }
      }
    };

    const moveInterval = setInterval(() => {
      if (!ufo) return;
      
      let dx = 0;
      let dy = 0;
      
      if (ufo.playerOwnerId === "player1") {
        if (keyState.ArrowUp) dy -= SPEED;
        if (keyState.ArrowDown) dy += SPEED;
        if (keyState.ArrowLeft) dx -= SPEED;
        if (keyState.ArrowRight) dx += SPEED;
      } else if (ufo.playerOwnerId === "player2") {
        if (keyState.w) dy -= SPEED;
        if (keyState.s) dy += SPEED;
        if (keyState.a) dx -= SPEED;
        if (keyState.d) dx += SPEED;
      }
      
      if (dx !== 0 || dy !== 0) {
        const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
        
        onPositionUpdate(ufo.id, {
          x: ufo.position.x + dx,
          y: ufo.position.y + dy,
        });
      }
    }, 16);

    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);
    
    if (isMobile && ufoRef.current) {
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    }

    const handleMobileShoot = () => {
      if (isMobile && onFireProjectile && isLocalPlayer) {
        onFireProjectile(ufo.id, ufo.rotation || 0);
      }
    };

    if (isMobile && ufoRef.current) {
      ufoRef.current.addEventListener("dblclick", handleMobileShoot);
    }

    return () => {
      clearInterval(moveInterval);
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      
      if (isMobile && ufoRef.current) {
        ufoRef.current.removeEventListener("dblclick", handleMobileShoot);
      }
    };
  }, [ufo, isMoving, isMobile, isLocalPlayer, onDragStart, onDragEnd, onPositionUpdate, onOrbCollection, onFireProjectile]);

  const playerColor = ufo.playerOwnerId === "player1" 
    ? "theme('colors.game.ufo')" 
    : "#E879F9";

  const renderAimCursor = () => {
    if (!isLocalPlayer || !cursorPosition) return null;
    
    const angle = getCursorAngle();
    
    return (
      <div 
        className="absolute pointer-events-none"
        style={{
          width: ufo.radius * 5,
          height: 2,
          background: `linear-gradient(to right, ${ufo.playerOwnerId === "player1" ? "theme('colors.game.ufo')" : "#E879F9"}, transparent)`,
          left: ufo.position.x,
          top: ufo.position.y,
          transformOrigin: "left center",
          transform: `rotate(${angle}deg)`,
          opacity: 0.6,
          zIndex: 10,
        }}
      />
    );
  };

  return (
    <>
      {isLocalPlayer && cursorPosition && (
        <div 
          className="absolute pointer-events-none"
          style={{
            width: ufo.radius * 5,
            height: 2,
            background: `linear-gradient(to right, ${ufo.playerOwnerId === "player1" ? "theme('colors.game.ufo')" : "#E879F9"}, transparent)`,
            left: ufo.position.x,
            top: ufo.position.y,
            transformOrigin: "left center",
            transform: `rotate(${getCursorAngle()}deg)`,
            opacity: 0.6,
            zIndex: 10,
          }}
        />
      )}
      
      <div
        ref={ufoRef}
        className={cn(
          "absolute ufo-glow",
          isLocalPlayer && (isMoving ? "cursor-grabbing" : "cursor-grab")
        )}
        style={{
          left: ufo.position.x - ufo.radius,
          top: ufo.position.y - ufo.radius,
          width: ufo.radius * 2,
          height: ufo.radius * 2,
          borderRadius: "50%",
          backgroundColor: ufo.collectedEnergy > 0 ? "rgba(255, 215, 0, 0.3)" : "transparent",
          zIndex: 20,
          transition: "transform 0.05s ease-out",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="w-full h-full relative">
          <div 
            className="absolute inset-0 animate-pulse-soft"
            style={{ 
              background: `radial-gradient(circle, ${ufo.playerOwnerId === "player1" ? "theme('colors.game.ufo')" : "#E879F9"} 50%, rgba(155, 135, 245, 0.2) 100%)`,
              borderRadius: "50%",
            }}
          />
          
          {ufo.collectedEnergy > 0 && (
            <div className="absolute top-0 left-0 w-full flex justify-center">
              <div className="text-game-energy font-bold text-sm px-2 py-1 rounded-full bg-black/30">
                {ufo.collectedEnergy}
              </div>
            </div>
          )}
          
          <div 
            className="absolute top-1/2 left-1/2 w-2 h-8 bg-white/70 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none" 
            style={{ 
              transform: `translate(-50%, -50%) rotate(${ufo.rotation || 0}deg)`,
              transformOrigin: 'center',
            }} 
          />
          
          {ufo.cooldown > 0 && (
            <div 
              className="absolute bottom-0 left-0 w-full flex justify-center"
            >
              <div className="h-1 bg-black/30 rounded-full overflow-hidden w-3/4">
                <div 
                  className="h-full bg-red-500"
                  style={{ 
                    width: `${(ufo.cooldown / 500) * 100}%`,
                    transition: 'width 0.1s linear'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
