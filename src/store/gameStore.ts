import { create } from "zustand";
import { nanoid } from "nanoid";

export type Position = {
  x: number;
  y: number;
};

export type UFO = {
  id: string;
  position: Position;
  collectedEnergy: number;
  speed: number;
  radius: number;
  isDragging: boolean;
  rotation?: number;
};

export type EnergyOrb = {
  id: string;
  position: Position;
  value: number;
  size: number;
};

export type Base = {
  position: Position;
  storedEnergy: number;
  level: number;
  size: number;
};

type GameState = {
  ufos: UFO[];
  energyOrbs: EnergyOrb[];
  base: Base;
  gameAreaSize: { width: number; height: number };
  isRunning: boolean;
  // Actions
  addUFO: (ufo: Omit<UFO, "id">) => void;
  removeUFO: (id: string) => void;
  updateUFOPosition: (id: string, position: Position) => void;
  updateUFORotation: (id: string, rotation: number) => void;
  setUFODragging: (id: string, isDragging: boolean) => void;
  addEnergyOrb: (position: Position) => void;
  removeEnergyOrb: (id: string) => void;
  collectEnergyOrb: (ufoId: string, orbId: string) => void;
  depositEnergy: (ufoId: string) => void;
  setGameAreaSize: (size: { width: number; height: number }) => void;
  spawnRandomOrb: () => void;
  startGame: () => void;
  pauseGame: () => void;
  resetGame: () => void;
};

const DEFAULT_GAME_CONFIG = {
  orbSpawnRate: 2000, // milliseconds
  orbValue: 10,
  orbSize: 30,
  ufoRadius: 40,
  ufoSpeed: 5,
  baseSize: 100,
  levelThreshold: 100, // energy required for next level
};

export const useGameStore = create<GameState>((set, get) => ({
  ufos: [],
  energyOrbs: [],
  base: {
    position: { x: 0, y: 0 }, // Will be set to center when game starts
    storedEnergy: 0,
    level: 1,
    size: DEFAULT_GAME_CONFIG.baseSize,
  },
  gameAreaSize: { width: 800, height: 600 },
  isRunning: false,

  addUFO: (ufo) => {
    set((state) => ({
      ufos: [...state.ufos, { ...ufo, id: nanoid() }],
    }));
  },

  removeUFO: (id) => {
    set((state) => ({
      ufos: state.ufos.filter((ufo) => ufo.id !== id),
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
    if (!ufo) return;

    set((state) => {
      const newStoredEnergy = state.base.storedEnergy + ufo.collectedEnergy;
      const currentLevel = state.base.level;
      const energyForNextLevel = currentLevel * DEFAULT_GAME_CONFIG.levelThreshold;
      
      // Check if we should level up
      const newLevel = newStoredEnergy >= energyForNextLevel 
        ? currentLevel + 1 
        : currentLevel;
      
      // Base grows with level
      const newSize = DEFAULT_GAME_CONFIG.baseSize + (newLevel - 1) * 20;

      return {
        ufos: state.ufos.map((u) =>
          u.id === ufoId ? { ...u, collectedEnergy: 0 } : u
        ),
        base: {
          ...state.base,
          storedEnergy: newStoredEnergy,
          level: newLevel,
          size: newSize,
        },
      };
    });
  },

  setGameAreaSize: (size) => {
    set({ gameAreaSize: size });
    
    // Center the base when game area is resized
    set((state) => ({
      base: {
        ...state.base,
        position: {
          x: size.width / 2,
          y: size.height / 2,
        },
      },
    }));
  },

  spawnRandomOrb: () => {
    const { width, height } = get().gameAreaSize;
    const padding = 50; // Avoid spawning too close to edges
    
    const randomPosition = {
      x: Math.random() * (width - 2 * padding) + padding,
      y: Math.random() * (height - 2 * padding) + padding,
    };
    
    get().addEnergyOrb(randomPosition);
  },

  startGame: () => {
    set({ isRunning: true });
  },

  pauseGame: () => {
    set({ isRunning: false });
  },

  resetGame: () => {
    const { width, height } = get().gameAreaSize;
    set({
      ufos: [],
      energyOrbs: [],
      base: {
        position: { x: width / 2, y: height / 2 },
        storedEnergy: 0,
        level: 1,
        size: DEFAULT_GAME_CONFIG.baseSize,
      },
      isRunning: false,
    });
    
    // Add a default UFO
    get().addUFO({
      position: { x: width / 2 - 150, y: height / 2 },
      collectedEnergy: 0,
      speed: DEFAULT_GAME_CONFIG.ufoSpeed,
      radius: DEFAULT_GAME_CONFIG.ufoRadius,
      isDragging: false,
      rotation: 0,
    });
  },
}));
