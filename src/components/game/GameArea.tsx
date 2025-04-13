
import React, { useEffect, useRef, useState } from "react";
import { useGameStore, Position } from "@/store/gameStore";
import { UFO } from "./UFO";
import { EnergyOrb } from "./EnergyOrb";
import { Base } from "./Base";
import { Projectile } from "./Projectile";
import { GameBackground } from "./GameBackground";
import { GameControls } from "./GameControls";
import { OnScreenControls } from "./OnScreenControls";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export const GameArea: React.FC = () => {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const orbSpawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [mobileJoystickPos, setMobileJoystickPos] = useState<Position | null>(null);
  const [activeMoveDirection, setActiveMoveDirection] = useState<{
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  
  const {
    players,
    ufos,
    energyOrbs,
    bases,
    projectiles,
    isRunning,
    isMultiplayer,
    winningScore,
    updateUFOPosition,
    updateUFORotation,
    setUFODragging,
    collectEnergyOrb,
    depositEnergy,
    fireProjectile,
    updateProjectiles,
    setGameAreaSize,
    spawnRandomOrb,
    toggleMultiplayer,
    startGame,
    pauseGame,
    resetGame,
    getPlayerById,
  } = useGameStore();

  // Game loop for projectiles and other continuous updates
  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (!lastUpdateTimeRef.current) {
        lastUpdateTimeRef.current = timestamp;
      }
      
      const deltaTime = timestamp - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = timestamp;
      
      if (isRunning) {
        updateProjectiles(deltaTime);
      }
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, updateProjectiles]);

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

  // Handle continuous movement for on-screen controls
  useEffect(() => {
    const moveUFO = () => {
      if (!isRunning || ufos.length === 0) return;
      
      // Get player's first UFO
      const playerUfo = ufos.find(ufo => ufo.playerOwnerId === "player1");
      if (!playerUfo) return;
      
      let dx = 0;
      let dy = 0;
      const SPEED = playerUfo.speed * 5;
      
      if (activeMoveDirection.up) dy -= SPEED;
      if (activeMoveDirection.down) dy += SPEED;
      if (activeMoveDirection.left) dx -= SPEED;
      if (activeMoveDirection.right) dx += SPEED;
      
      if (dx !== 0 || dy !== 0) {
        // Calculate rotation based on direction
        const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
        updateUFORotation(playerUfo.id, rotation);
        
        // Update position
        const newPosition = {
          x: playerUfo.position.x + dx,
          y: playerUfo.position.y + dy,
        };
        handleUFOPositionUpdate(playerUfo.id, newPosition);
      }
    };
    
    // Start movement interval if any direction is active
    const isMoving = Object.values(activeMoveDirection).some(val => val);
    
    if (isMoving && !moveIntervalRef.current) {
      // Start dragging first
      const playerUfo = ufos.find(ufo => ufo.playerOwnerId === "player1");
      if (playerUfo) {
        handleUFODragStart(playerUfo.id);
      }
      
      moveIntervalRef.current = setInterval(moveUFO, 16); // ~60fps
    } else if (!isMoving && moveIntervalRef.current) {
      // End dragging
      const playerUfo = ufos.find(ufo => ufo.playerOwnerId === "player1");
      if (playerUfo) {
        handleUFODragEnd(playerUfo.id);
      }
      
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
    
    return () => {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
      }
    };
  }, [activeMoveDirection, isRunning, ufos]);

  // Handle direction button press from on-screen controls
  const handleDirectionPress = (direction: "up" | "down" | "left" | "right") => {
    setActiveMoveDirection(prev => ({
      ...prev,
      [direction]: true
    }));
  };

  const handleDirectionRelease = () => {
    setActiveMoveDirection({
      up: false,
      down: false,
      left: false,
      right: false
    });
  };

  // Handle UFO dragging
  const handleUFODragStart = (id: string) => {
    setUFODragging(id, true);
  };

  const handleUFODragEnd = (id: string) => {
    setUFODragging(id, false);
    
    // Check if the UFO is near any base to deposit energy
    const ufo = ufos.find((u) => u.id === id);
    if (!ufo || ufo.collectedEnergy <= 0) return;
    
    // Only deposit to your own base
    const playerBase = bases.find(b => b.playerId === ufo.playerOwnerId);
    if (!playerBase) return;
    
    const distance = calculateDistance(ufo.position, playerBase.position);
    
    if (distance < playerBase.size / 2 + ufo.radius / 2) {
      depositEnergy(id);
      toast.success(`Deposited ${ufo.collectedEnergy} energy!`);
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
    
    // Calculate rotation for direction indicator if not being handled by button controls
    if (!Object.values(activeMoveDirection).some(val => val) && 
        (ufo.position.x !== boundedPosition.x || ufo.position.y !== boundedPosition.y)) {
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

  // Handle space key or button for orb collection
  const handleSpaceKeyCollection = () => {
    if (!isRunning || ufos.length === 0) return;
    
    // Find the player's UFOs
    const playerUfos = ufos.filter(ufo => 
      (!isMultiplayer || ufo.playerOwnerId === "player1")
    );
    
    // Try collection for each UFO
    for (const ufo of playerUfos) {
      // Find the closest orb to this UFO
      let closestOrb = null;
      let minDistance = Infinity;
      
      for (const orb of energyOrbs) {
        const distance = calculateDistance(ufo.position, orb.position);
        if (distance < minDistance) {
          minDistance = distance;
          closestOrb = orb;
        }
      }
      
      // Try to collect if close enough
      if (closestOrb && minDistance <= ufo.radius + closestOrb.size / 2) {
        collectEnergyOrb(ufo.id, closestOrb.id);
        toast.success(`Collected ${closestOrb.value} energy!`);
        break; // Only collect one orb at a time
      } else {
        toast.info("Move closer to an orb!");
      }
    }
  };

  // Handle projectile firing
  const handleFireProjectile = () => {
    if (!isRunning || ufos.length === 0) {
      toast.error("Start the game to fire projectiles!");
      return;
    }
    
    // Find player's UFO
    const playerUfo = ufos.find(ufo => ufo.playerOwnerId === "player1");
    if (!playerUfo) return;
    
    fireProjectile(playerUfo.id, playerUfo.rotation || 0);
  };

  const calculateDistance = (pos1: Position, pos2: Position) => {
    return Math.sqrt(
      Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
    );
  };

  // Get winning progress for each player
  const getWinningProgress = (playerId: string) => {
    const player = getPlayerById(playerId);
    if (!player) return 0;
    
    return Math.min(100, (player.storedEnergy / winningScore) * 100);
  };

  return (
    <div 
      className="w-full h-screen relative overflow-hidden touch-none" 
      ref={gameAreaRef}
    >
      <GameBackground width={size.width} height={size.height} />
      
      {/* Welcome message */}
      {!isRunning && ufos.length > 0 && energyOrbs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-black/70 p-6 rounded-lg max-w-md text-center">
            <h1 className="text-3xl font-bold text-game-energy mb-4">Energy Drift</h1>
            <p className="text-white mb-4">
              Control your UFO to collect energy orbs and bring them back to your base.
              Reach {winningScore} energy to win! Shoot enemy UFOs to set them back.
            </p>
            <div className="text-left mb-4 space-y-2">
              <p className="text-sm text-gray-300">
                <span className="text-game-energy">•</span> Use arrow keys or WASD to move the UFO
              </p>
              <p className="text-sm text-gray-300">
                <span className="text-game-energy">•</span> Press SPACE to collect nearby orbs
              </p>
              <p className="text-sm text-gray-300">
                <span className="text-game-energy">•</span> Press F to shoot (uses 20 energy)
              </p>
              <p className="text-sm text-gray-300">
                <span className="text-game-energy">•</span> Return to your base to deposit energy
              </p>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center justify-center space-x-2 text-white">
                <input 
                  type="checkbox" 
                  checked={isMultiplayer}
                  onChange={(e) => toggleMultiplayer(e.target.checked)}
                  className="rounded"
                />
                <span>Enable 2-Player Mode (same device)</span>
              </label>
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
      
      {/* Bases */}
      {bases.map((base) => {
        const player = getPlayerById(base.playerId);
        if (!player) return null;
        return <Base key={base.playerId} base={base} player={player} />;
      })}
      
      {/* Energy Orbs */}
      {energyOrbs.map((orb) => (
        <EnergyOrb key={orb.id} orb={orb} onClick={handleOrbClick} />
      ))}
      
      {/* Projectiles */}
      {projectiles.map((projectile) => (
        <Projectile key={projectile.id} projectile={projectile} />
      ))}
      
      {/* UFOs */}
      {ufos.map((ufo) => (
        <UFO
          key={ufo.id}
          ufo={ufo}
          onDragStart={handleUFODragStart}
          onDragEnd={handleUFODragEnd}
          onPositionUpdate={handleUFOPositionUpdate}
          onOrbCollection={ufo.playerOwnerId === "player1" ? handleSpaceKeyCollection : undefined}
          onFireProjectile={handleFireProjectile}
          isLocalPlayer={!isMultiplayer || ufo.playerOwnerId === "player1"}
        />
      ))}
      
      {/* Game Controls */}
      <GameControls
        onStart={startGame}
        onPause={pauseGame}
        onReset={resetGame}
        onSpawnOrb={spawnRandomOrb}
        isRunning={isRunning}
      />
      
      {/* On-screen controls for mobile */}
      {isMobile && isRunning && (
        <OnScreenControls
          onMove={handleDirectionPress}
          onStopMove={handleDirectionRelease}
          onFire={handleFireProjectile}
          onCollect={handleSpaceKeyCollection}
        />
      )}
      
      {/* Game Stats */}
      <div className="absolute top-4 left-4 bg-black/50 p-2 rounded text-white space-y-1 max-w-xs">
        {players.map(player => (
          <div key={player.id} className="space-y-1">
            <div className="flex justify-between">
              <span>Player {player.id === "player1" ? "1" : "2"}</span>
              <span>{player.storedEnergy} / {winningScore}</span>
            </div>
            <Progress value={getWinningProgress(player.id)} className="h-2" />
          </div>
        ))}
        <div>Orbs: {energyOrbs.length}</div>
      </div>
      
      {/* Controls tips */}
      {isRunning && (
        <div className="absolute top-4 right-4 bg-black/50 p-2 rounded text-white text-sm max-w-xs">
          <p>
            <span className="text-game-energy font-bold">Controls:</span> {" "}
            {isMobile 
              ? "Use on-screen pad to move"
              : "WASD or Arrow Keys to move"
            }
          </p>
        </div>
      )}
    </div>
  );
};
