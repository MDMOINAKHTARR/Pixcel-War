export type KartClassId = 'scout' | 'tank' | 'balanced' | 'drift' | 'cyber';

export interface KartClassDef {
  id: KartClassId;
  name: string;
  tagline: string;
  description: string;
  color: string;
  accentColor: string;
  glowColor: string;
  stats: {
    topSpeed: number;        // Max velocity in pixels/sec
    acceleration: number;    // Pixels/sec^2
    handling: number;        // Turn rate in radians/sec
    weight: number;          // Mass & knockback resistance (1.0 is standard)
    maxHealth: number;       // Base HP
    maxShield: number;       // Base Shield
    driftMultiplier: number; // Boost power and charge rate
    cooldownReduction: number; // % weapon cooldown boost
  };
}

export type WeaponType =
  | 'blaster'
  | 'vulcan'
  | 'laser'
  | 'mine'
  | 'shockwave'
  | 'emp'
  | 'cryo'
  | 'rocket';

export interface WeaponDef {
  id: WeaponType;
  name: string;
  icon: string;
  color: string;
  damage: number;
  ammo: number;
  cooldown: number; // In ms
  projectileSpeed?: number;
  range?: number;
  duration?: number; // In ms (for EMP / Cryo freeze / Boost rush)
  description: string;
}

export type PickupType =
  | 'mystery_box'
  | 'nitro'
  | 'shield_pack'
  | 'repair_kit'
  | 'monad_coin';

export interface PickupDef {
  id: PickupType;
  name: string;
  color: string;
  icon: string;
  respawnTime: number; // In seconds
}

export type HazardType =
  | 'boost_pad'
  | 'toxic_sludge'
  | 'ice_surface'
  | 'void_hazard';

export interface MapHazardDef {
  id: string;
  type: HazardType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  boostAngle?: number;
  boostForce?: number;
  damagePerSec?: number;
}

export interface SpawnPoint {
  x: number;
  y: number;
  rotation: number;
}

export interface Waypoint {
  x: number;
  y: number;
  radius: number;
  speedModifier?: number;
}

export interface MapDefinition {
  id: string;
  name: string;
  subtitle: string;
  theme: 'neon' | 'desert' | 'cryo' | 'industrial' | 'monad' | 'volcano';
  width: number;
  height: number;
  bgColor: string;
  gridColor: string;
  roadColor: string;
  borderColor: string;
  obstacles: { x: number; y: number; width: number; height: number; type?: string; color?: string }[];
  hazards: MapHazardDef[];
  pickupSpawns: { x: number; y: number; type: PickupType }[];
  playerSpawns: SpawnPoint[];
  waypoints: Waypoint[];
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme' | 'Expert';
}

export type DriftStage = 0 | 1 | 2 | 3; // 0=none, 1=blue, 2=orange, 3=purple supreme

export interface KartStatusEffects {
  isFrozen: boolean;
  frozenTimer: number;
  isEMPDisabled: boolean;
  empTimer: number;
  isBoosting: boolean;
  boostTimer: number;
  boostMultiplier: number;
  invulnerableTimer: number;
  inSludge: boolean;
  onIce: boolean;
}

export interface CombatFeedEvent {
  id: string;
  killerName: string;
  killerColor: string;
  victimName: string;
  victimColor: string;
  weapon: WeaponType | 'collision' | 'hazard';
  timestamp: number;
}

export interface MatchScore {
  id: string;
  name: string;
  color: string;
  isPlayer: boolean;
  kills: number;
  deaths: number;
  score: number;
  damageDealt: number;
  coinsCollected: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
}

export type GameMode = 'deathmatch' | 'coin_rush' | 'boss_battle';
export type BotDifficulty = 'recruit' | 'veteran' | 'ace' | 'overlord';

export interface GarageCustomization {
  chassis: KartClassId;
  skinId: string;
  bodyColor: string;
  accentColor: string;
  underglowColor: string;
  wheelTrail: 'smoke' | 'sparks' | 'neon' | 'flames';
  pilotName: string;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  completed: boolean;
  claimed: boolean;
  rewardCoins: number;
  rewardTokens: number; // $SMASH tokens
  category: 'kills' | 'drifts' | 'weapons' | 'wins' | 'coins';
}
