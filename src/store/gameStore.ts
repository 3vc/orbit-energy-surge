import { create } from "zustand";
import { nanoid } from "nanoid";
import { toast } from "sonner";

export type Position = {
  x: number;
  y: number;
};

export type Player = {
  id: string;
  basePosition: Position;
  color: string;
  storedEnergy: number;
  ufos: string[]; // IDs of UFOs belonging to this player
  isWinner: boolean;
  isLoser: boolean;
};

export type ProjectileType = {
  id: string;
  position: Position;
  direction: number; // angle in degrees
  speed: number;
  playerOwnerId: string;
  timeToLive: number; // milliseconds before disappearing
};

export type UFO = {
  id: string;
  position: Position;
  collectedEnergy: number;
  speed: number;
  radius: number;
  isDragging: boolean;
  rotation?: number;
  playerOwnerId: string;
  cooldown: number; // shooting cooldown in milliseconds
};

export type EnergyOrb = {
  id: string;
  position: Position;
  value: number;
  size: number;
};

export type Base = {
  position: Position;
  playerId: string;
  size: number;
};

type GameState = {
  players: Player[];
  ufos: UFO[];
  energyOrbs: EnergyOrb[];
  bases: Base[];
  projectiles: ProjectileType[];
  gameAreaSize: { width: number; height: number };
  isRunning: boolean;
  isMultiplayer: boolean;
  winningScore: number;
  // Actions
  addUFO: (ufo: Omit<UFO, "id">) => string;
  removeUFO: (id: string) => void;
  updateUFOPosition: (id: string, position: Position) => void;
  updateUFORotation: (id: string, rotation: number) => void;
  setUFODragging: (id: string, isDragging: boolean) => void;
  addEnergyOrb: (position: Position) => void;
  removeEnergyOrb: (id: string) => void;
  collectEnergyOrb: (ufoId: string, orbId: string) => void;
  depositEnergy: (ufoId: string) => void;
  fireProjectile: (ufoId: string, direction: number) => void;
  updateProjectiles: (deltaTime: number) => void;
  setGameAreaSize: (size: { width: number; height: number }) => void;
  spawnRandomOrb: () => void;
  respawnUFO: (playerId: string) => void;
  toggleMultiplayer: (enabled: boolean) => void;
  startGame: () => void;
  pauseGame: () => void;
  resetGame: () => void;
  getPlayerById: (playerId: string) => Player | undefined;
  checkWinLoseConditions: () => void;
};

const DEFAULT_GAME_CONFIG = {
  orbSpawnRate: 2000, // milliseconds
  orbValue: 10,
  orbSize: 30,
  ufoRadius: 40,
  ufoSpeed: 5,
  baseSize: 100,
  shootCost: 20,
  shootCooldown: 500, // milliseconds
  respawnCost: 100,
  winningScore: 500,
  projectileSpeed: 10,
  projectileTTL: 1500, // milliseconds
  minDistanceFromBase: 150, // minimum distance for orb spawning from any base
};

export const useGameStore = create<GameState>((set, get) => ({
  players: [],
  ufos: [],
  energyOrbs: [],
  bases: [],
  projectiles: [],
  gameAreaSize: { width: 800, height: 600 },
  isRunning: false,
  isMultiplayer: false,
  winningScore: DEFAULT_GAME_CONFIG.winningScore,

  getPlayerById: (playerId) => {
    return get().players.find(p => p.id === playerId);
  },

  addUFO: (ufo) => {
    const id = nanoid();
    set((state) => ({
      ufos: [...state.ufos, { ...ufo, id, cooldown: 0 }],
      players: state.players.map(player => 
        player.id === ufo.playerOwnerId 
          ? { ...player, ufos: [...player.ufos, id] } 
          : player
      )
    }));
    return id;
  },

  removeUFO: (id) => {
    const ufo = get().ufos.find(u => u.id === id);
    if (!ufo) return;

    set((state) => ({
      ufos: state.ufos.filter((u) => u.id !== id),
      players: state.players.map(player => 
        player.id === ufo.playerOwnerId 
          ? { ...player, ufos: player.ufos.filter(ufoId => ufoId !== id) } 
          : player
      )
    }));
  },

  updateUFOPosition: (id, position) => {
    set((state) => ({
      ufos: state.ufos.map((ufo) =>
        ufo.id === id ? { ...ufo, position } : ufo
      ),
    }));
  },

  updateUFORotation: (id, rotation) => {
    set((state) => ({
      ufos: state.ufos.map((ufo) =>
        ufo.id === id ? { ...ufo, rotation } : ufo
      ),
    }));
  },

  setUFODragging: (id, isDragging) => {
    set((state) => ({
      ufos: state.ufos.map((ufo) =>
        ufo.id === id ? { ...ufo, isDragging } : ufo
      ),
    }));
  },

  addEnergyOrb: (position) => {
    // Don't spawn orbs too close to any base
    const { bases } = get();
    const tooCloseToBase = bases.some(base => {
      const dx = position.x - base.position.x;
      const dy = position.y - base.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < DEFAULT_GAME_CONFIG.minDistanceFromBase;
    });

    if (tooCloseToBase) return; // Skip orb creation if too close to any base

    set((state) => ({
      energyOrbs: [
        ...state.energyOrbs,
        {
          id: nanoid(),
          position,
          value: DEFAULT_GAME_CONFIG.orbValue,
          size: DEFAULT_GAME_CONFIG.orbSize,
        },
      ],
    }));
  },

  removeEnergyOrb: (id) => {
    set((state) => ({
      energyOrbs: state.energyOrbs.filter((orb) => orb.id !== id),
    }));
  },

  collectEnergyOrb: (ufoId, orbId) => {
    const orb = get().energyOrbs.find((o) => o.id === orbId);
    if (!orb) return;

    set((state) => ({
      ufos: state.ufos.map((ufo) =>
        ufo.id === ufoId
          ? { ...ufo, collectedEnergy: ufo.collectedEnergy + orb.value }
          : ufo
      ),
      energyOrbs: state.energyOrbs.filter((o) => o.id !== orbId),
    }));
  },

  depositEnergy: (ufoId) => {
    const ufo = get().ufos.find((u) => u.id === ufoId);
    if (!ufo || ufo.collectedEnergy <= 0) return;

    set((state) => {
      // Find the player who owns this UFO
      const playerIdx = state.players.findIndex(p => p.id === ufo.playerOwnerId);
      if (playerIdx === -1) return state;

      const newPlayers = [...state.players];
      newPlayers[playerIdx] = {
        ...newPlayers[playerIdx],
        storedEnergy: newPlayers[playerIdx].storedEnergy + ufo.collectedEnergy
      };

      return {
        players: newPlayers,
        ufos: state.ufos.map((u) =>
          u.id === ufoId ? { ...u, collectedEnergy: 0 } : u
        ),
      };
    });

    // Check win/lose conditions after deposit
    get().checkWinLoseConditions();
  },

  fireProjectile: (ufoId, direction) => {
    const ufo = get().ufos.find((u) => u.id === ufoId);
    if (!ufo) return;

    // Check if UFO has enough energy to shoot and cooldown is ready
    if (ufo.collectedEnergy < DEFAULT_GAME_CONFIG.shootCost) {
      toast.error("Not enough energy to shoot!");
      return;
    }

    if (ufo.cooldown > 0) {
      return; // Silently fail if on cooldown
    }

    // Create projectile
    const projectileId = nanoid();
    set((state) => ({
      projectiles: [...state.projectiles, {
        id: projectileId,
        position: { ...ufo.position },
        direction,
        speed: DEFAULT_GAME_CONFIG.projectileSpeed,
        playerOwnerId: ufo.playerOwnerId,
        timeToLive: DEFAULT_GAME_CONFIG.projectileTTL
      }],
      ufos: state.ufos.map((u) =>
        u.id === ufoId ? { 
          ...u, 
          collectedEnergy: u.collectedEnergy - DEFAULT_GAME_CONFIG.shootCost,
          cooldown: DEFAULT_GAME_CONFIG.shootCooldown
        } : u
      )
    }));
  },

  updateProjectiles: (deltaTime) => {
    const { projectiles, ufos } = get();
    const updatedProjectiles = [];
    
    for (const projectile of projectiles) {
      // Update position based on direction and speed
      const radians = projectile.direction * Math.PI / 180;
      const dx = Math.cos(radians) * projectile.speed * (deltaTime / 16);
      const dy = Math.sin(radians) * projectile.speed * (deltaTime / 16);
      
      const newPosition = {
        x: projectile.position.x + dx,
        y: projectile.position.y + dy
      };
      
      // Check if projectile is out of bounds
      const { width, height } = get().gameAreaSize;
      if (
        newPosition.x < 0 || 
        newPosition.x > width || 
        newPosition.y < 0 || 
        newPosition.y > height
      ) {
        continue; // Skip this projectile (don't add to updated array)
      }
      
      // Reduce time to live
      const newTimeToLive = projectile.timeToLive - deltaTime;
      if (newTimeToLive <= 0) {
        continue; // Skip expired projectiles
      }
      
      // Check for collision with enemy UFOs
      let hitUFO = false;
      for (const ufo of ufos) {
        // Don't collide with own UFOs
        if (ufo.playerOwnerId === projectile.playerOwnerId) continue;
        
        // Check for collision
        const dx = newPosition.x - ufo.position.x;
        const dy = newPosition.y - ufo.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < ufo.radius) {
          hitUFO = true;
          
          // Handle UFO destruction
          get().removeUFO(ufo.id);
          
          // Spawn energy orbs from destroyed UFO
          for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 30 + 20;
            const orbPosition = {
              x: ufo.position.x + Math.cos(angle) * distance,
              y: ufo.position.y + Math.sin(angle) * distance
            };
            get().addEnergyOrb(orbPosition);
          }
          
          // Trigger respawn with cost
          setTimeout(() => {
            get().respawnUFO(ufo.playerOwnerId);
          }, 1500);
          
          break;
        }
      }
      
      if (hitUFO) continue; // Don't add projectile if it hit a UFO
      
      // Add updated projectile
      updatedProjectiles.push({
        ...projectile,
        position: newPosition,
        timeToLive: newTimeToLive
      });
    }
    
    // Update UFO cooldowns
    set((state) => ({
      projectiles: updatedProjectiles,
      ufos: state.ufos.map(ufo => ({
        ...ufo,
        cooldown: Math.max(0, ufo.cooldown - deltaTime)
      }))
    }));
  },

  respawnUFO: (playerId) => {
    const player = get().getPlayerById(playerId);
    if (!player) return;
    
    // Check if player has enough energy to respawn
    if (player.storedEnergy < DEFAULT_GAME_CONFIG.respawnCost) {
      // Can't respawn, mark as loser if no UFOs left
      if (player.ufos.length === 0) {
        set((state) => ({
          players: state.players.map(p => 
            p.id === playerId ? { ...p, isLoser: true } : p
          )
        }));
        toast.error(`Player ${playerId === "player1" ? "1" : "2"} has lost!`);
      }
      return;
    }
    
    // Deduct respawn cost
    set((state) => ({
      players: state.players.map(p => 
        p.id === playerId ? { 
          ...p, 
          storedEnergy: p.storedEnergy - DEFAULT_GAME_CONFIG.respawnCost 
        } : p
      )
    }));
    
    // Find player's base
    const base = get().bases.find(b => b.playerId === playerId);
    if (!base) return;
    
    // Spawn new UFO at base
    const spawnOffset = Math.random() * 60 - 30;
    get().addUFO({
      position: {
        x: base.position.x + spawnOffset,
        y: base.position.y + spawnOffset
      },
      collectedEnergy: 0,
      speed: DEFAULT_GAME_CONFIG.ufoSpeed,
      radius: DEFAULT_GAME_CONFIG.ufoRadius,
      isDragging: false,
      rotation: 0,
      playerOwnerId: playerId,
      cooldown: 0
    });
    
    // Check win/lose conditions after respawn
    get().checkWinLoseConditions();
  },

  checkWinLoseConditions: () => {
    const { players, winningScore } = get();

    set((state) => ({
      players: state.players.map(player => {
        // Check for winner (reached winning score)
        const isWinner = player.storedEnergy >= winningScore;
        
        // Check for loser (no energy to respawn and no UFOs left)
        const isLoser = player.storedEnergy < DEFAULT_GAME_CONFIG.respawnCost && 
                     player.ufos.length === 0;
        
        return { 
          ...player, 
          isWinner: isWinner ? true : player.isWinner,
          isLoser: isLoser ? true : player.isLoser
        };
      })
    }));
    
    // Show notifications for winners and losers
    const updatedPlayers = get().players;
    updatedPlayers.forEach(player => {
      if (player.isWinner && !player.isLoser) {
        toast.success(`Player ${player.id === "player1" ? "1" : "2"} has won!`);
        get().pauseGame();
      } else if (player.isLoser && !player.isWinner) {
        toast.error(`Player ${player.id === "player1" ? "1" : "2"} has lost!`);
      }
    });
  },

  toggleMultiplayer: (enabled) => {
    set({ isMultiplayer: enabled });
  },

  setGameAreaSize: (size) => {
    set({ gameAreaSize: size });
  },

  spawnRandomOrb: () => {
    const { width, height } = get().gameAreaSize;
    const padding = 50; // Avoid spawning too close to edges
    
    // Try to place an orb a few times before giving up
    for (let attempts = 0; attempts < 5; attempts++) {
      const randomPosition = {
        x: Math.random() * (width - 2 * padding) + padding,
        y: Math.random() * (height - 2 * padding) + padding,
      };
      
      // Add energy orb will check for minimum distance from bases
      get().addEnergyOrb(randomPosition);
      
      // Check if the orb was actually added
      const orbsCount = get().energyOrbs.length;
      const prevOrbsCount = get().energyOrbs.length - 1;
      
      if (orbsCount > prevOrbsCount) {
        break; // Successfully added an orb
      }
    }
  },

  startGame: () => {
    set({ isRunning: true });
  },

  pauseGame: () => {
    set({ isRunning: false });
  },

  resetGame: () => {
    const { width, height } = get().gameAreaSize;
    const { isMultiplayer } = get();
    
    // Calculate base positions in opposite corners
    const basePositions = [
      { x: width * 0.1, y: height * 0.1 }, // Top-left for player 1
      { x: width * 0.9, y: height * 0.9 }  // Bottom-right for player 2
    ];
    
    // Create players
    const player1 = {
      id: "player1",
      basePosition: basePositions[0],
      color: "theme('colors.game.ufo')",
      storedEnergy: 200, // Starting energy
      ufos: [],
      isWinner: false,
      isLoser: false
    };
    
    const player2 = {
      id: "player2",
      basePosition: basePositions[1],
      color: "#E879F9", // Purple color for player 2
      storedEnergy: 200, // Starting energy
      ufos: [],
      isWinner: false,
      isLoser: false
    };
    
    // Set initial state
    set({
      ufos: [],
      energyOrbs: [],
      projectiles: [],
      players: isMultiplayer ? [player1, player2] : [player1],
      bases: isMultiplayer 
        ? [
            { position: basePositions[0], playerId: "player1", size: DEFAULT_GAME_CONFIG.baseSize },
            { position: basePositions[1], playerId: "player2", size: DEFAULT_GAME_CONFIG.baseSize }
          ]
        : [
            { position: basePositions[0], playerId: "player1", size: DEFAULT_GAME_CONFIG.baseSize }
          ],
      isRunning: false,
    });
    
    // Add a default UFO for each player
    const player1UfoId = get().addUFO({
      position: { 
        x: basePositions[0].x + 50, 
        y: basePositions[0].y + 50 
      },
      collectedEnergy: 0,
      speed: DEFAULT_GAME_CONFIG.ufoSpeed,
      radius: DEFAULT_GAME_CONFIG.ufoRadius,
      isDragging: false,
      rotation: 0,
      playerOwnerId: "player1",
      cooldown: 0
    });
    
    if (isMultiplayer) {
      get().addUFO({
        position: { 
          x: basePositions[1].x - 50, 
          y: basePositions[1].y - 50 
        },
        collectedEnergy: 0,
        speed: DEFAULT_GAME_CONFIG.ufoSpeed,
        radius: DEFAULT_GAME_CONFIG.ufoRadius,
        isDragging: false,
        rotation: 0,
        playerOwnerId: "player2",
        cooldown: 0
      });
    }
  },
}));
