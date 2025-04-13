import React, { useEffect, useRef, useState } from "react";
import { useGameStore, Position } from "@/store/gameStore";
import { UFO } from "./UFO";
import { EnergyOrb } from "./EnergyOrb";
import { Base } from "./Base";
import { GameBackground } from "./GameBackground";
import { GameControls } from "./GameControls";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

export const GameArea: React.FC = () => {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const orbSpawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [mobileJoystickPos, setMobileJoystickPos] = useState<Position | null>(null);
  const isMobile = useIsMobile();
  
  const {
    ufos,
    energyOrbs,
    base,
    isRunning,
    updateUFOPosition,
    updateUFORotation,
    setUFODragging,
    collectEnergyOrb,
    depositEnergy,
    setGameAreaSize,
    spawnRandomOrb,
    startGame,
    pauseGame,
    resetGame,
  } = useGameStore();

  // Handle game area resizing
  useEffect(() => {
    const updateSize = () => {
      if (gameAreaRef.current) {
        const { clientWidth, clientHeight } = gameAreaRef.current;
        setSize({ width: clientWidth, height: clientHeight });
        setGameAreaSize({ width: clientWidth, height: clientHeight });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, [setGameAreaSize]);

  // Initialize the game
  useEffect(() => {
    if (size.width > 0 && size.height > 0) {
      resetGame();
    }
  }, [size, resetGame]);

  // Spawn orbs periodically when game is running
  useEffect(() => {
    if (isRunning) {
      orbSpawnIntervalRef.current = setInterval(() => {
        spawnRandomOrb();
      }, 3000);

      return () => {
        if (orbSpawnIntervalRef.current) {
          clearInterval(orbSpawnIntervalRef.current);
        }
      };
    }
  }, [isRunning, spawnRandomOrb]);

  // Handle UFO dragging
  const handleUFODragStart = (id: string) => {
    setUFODragging(id, true);
  };

  const handleUFODragEnd = (id: string) => {
    setUFODragging(id, false);
    
    // Check if the UFO is near the base to deposit energy
    const ufo = ufos.find((u) => u.id === id);
    if (ufo && ufo.collectedEnergy > 0) {
      const distance = calculateDistance(ufo.position, base.position);
      
      if (distance < base.size / 2 + ufo.radius / 2) {
        depositEnergy(id);
        toast.success(`Deposited ${ufo.collectedEnergy} energy!`);
      }
    }
  };

  const handleUFOPositionUpdate = (id: string, position: Position) => {
    // Keep the UFO within bounds
    const ufo = ufos.find((u) => u.id === id);
    if (!ufo) return;
    
    const boundedPosition = {
      x: Math.max(ufo.radius, Math.min(size.width - ufo.radius, position.x)),
      y: Math.max(ufo.radius, Math.min(size.height - ufo.radius, position.y)),
    };
    
    // Calculate rotation for direction indicator
    if (ufo.position.x !== boundedPosition.x || ufo.position.y !== boundedPosition.y) {
      const deltaX = boundedPosition.x - ufo.position.x;
      const deltaY = boundedPosition.y - ufo.position.y;
      if (deltaX !== 0 || deltaY !== 0) {
        const rotation = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        updateUFORotation(id, rotation);
      }
    }
    
    updateUFOPosition(id, boundedPosition);
  };

  // Handle collecting orbs
  const handleOrbClick = (orbId: string) => {
    if (!isRunning) {
      toast.error("Start the game to collect orbs!");
      return;
    }
    
    const orb = energyOrbs.find((o) => o.id === orbId);
    if (!orb) return;
    
    // Find the closest UFO
    let closestUFO = null;
    let minDistance = Infinity;
    
    for (const ufo of ufos) {
      const distance = calculateDistance(ufo.position, orb.position);
      if (distance < minDistance) {
        minDistance = distance;
        closestUFO = ufo;
      }
    }
    
    // Check if the closest UFO is close enough to collect
    if (closestUFO && minDistance <= closestUFO.radius + orb.size / 2) {
      collectEnergyOrb(closestUFO.id, orbId);
      toast.success(`Collected ${orb.value} energy!`);
    } else {
      toast.error("Move your UFO closer to collect this orb!");
    }
  };

  const calculateDistance = (pos1: Position, pos2: Position) => {
    return Math.sqrt(
      Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
    );
  };

  // Mobile touch joystick handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isRunning || ufos.length === 0) return;
    
    const touch = e.touches[0];
    setMobileJoystickPos({
      x: touch.clientX,
      y: touch.clientY,
    });
    
    // Start moving the UFO
    if (ufos[0]) {
      handleUFODragStart(ufos[0].id);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!mobileJoystickPos || ufos.length === 0) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - mobileJoystickPos.x;
    const deltaY = touch.clientY - mobileJoystickPos.y;
    
    // Move the UFO based on touch movement
    if (ufos[0]) {
      const ufo = ufos[0];
      const newPosition = {
        x: ufo.position.x + deltaX * 0.5, // Reduce sensitivity
        y: ufo.position.y + deltaY * 0.5,
      };
      
      handleUFOPositionUpdate(ufo.id, newPosition);
    }
    
    // Update the joystick position
    setMobileJoystickPos({
      x: touch.clientX,
      y: touch.clientY,
    });
  };

  const handleTouchEnd = () => {
    if (ufos[0]) {
      handleUFODragEnd(ufos[0].id);
    }
    setMobileJoystickPos(null);
  };

  return (
    <div 
      className="w-full h-screen relative overflow-hidden" 
      ref={gameAreaRef}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      <GameBackground width={size.width} height={size.height} />
      
      {/* Welcome message */}
      {!isRunning && ufos.length > 0 && energyOrbs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-black/70 p-6 rounded-lg max-w-md text-center">
            <h1 className="text-3xl font-bold text-game-energy mb-4">Energy Drift</h1>
            <p className="text-white mb-4">
              Control your UFO to collect energy orbs and bring them back to your base.
              Grow your base and advance through the levels!
            </p>
            <div className="text-left mb-4 space-y-2">
              <p className="text-sm text-gray-300">
                <span className="text-game-energy">•</span> Drag the purple UFO to move it
              </p>
              <p className="text-sm text-gray-300">
                <span className="text-game-energy">•</span> Click on yellow energy orbs to collect them
              </p>
              <p className="text-sm text-gray-300">
                <span className="text-game-energy">•</span> Bring the UFO to the green base to deposit energy
              </p>
            </div>
            <button 
              onClick={startGame}
              className="bg-game-energy text-black px-6 py-2 rounded-md font-bold hover:bg-game-energy/80 transition-colors"
            >
              Start Game
            </button>
          </div>
        </div>
      )}
      
      {/* Base */}
      <Base base={base} />
      
      {/* Energy Orbs */}
      {energyOrbs.map((orb) => (
        <EnergyOrb key={orb.id} orb={orb} onClick={handleOrbClick} />
      ))}
      
      {/* UFOs */}
      {ufos.map((ufo) => (
        <UFO
          key={ufo.id}
          ufo={ufo}
          onDragStart={handleUFODragStart}
          onDragEnd={handleUFODragEnd}
          onPositionUpdate={handleUFOPositionUpdate}
        />
      ))}
      
      {/* Mobile touch indicator */}
      {isMobile && mobileJoystickPos && (
        <div 
          className="absolute w-16 h-16 rounded-full bg-white/20 pointer-events-none z-50"
          style={{
            left: mobileJoystickPos.x - 32,
            top: mobileJoystickPos.y - 32,
          }}
        />
      )}
      
      {/* Game Controls */}
      <GameControls
        onStart={startGame}
        onPause={pauseGame}
        onReset={resetGame}
        onSpawnOrb={spawnRandomOrb}
        isRunning={isRunning}
      />
      
      {/* Game Stats */}
      <div className="absolute top-4 left-4 bg-black/50 p-2 rounded text-white">
        <div>Base Level: {base.level}</div>
        <div>Energy: {base.storedEnergy}</div>
        <div>Orbs: {energyOrbs.length}</div>
      </div>
      
      {/* Mobile instructions */}
      {isMobile && !isRunning && ufos.length > 0 && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center">
          <div className="bg-black/70 p-3 rounded-lg text-white text-center text-sm">
            <p>Tap and drag anywhere to move the UFO</p>
            <p>Tap orbs to collect when UFO is nearby</p>
          </div>
        </div>
      )}
    </div>
  );
};
