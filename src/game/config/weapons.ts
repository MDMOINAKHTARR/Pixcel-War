import { WeaponDef, WeaponType } from '../../types/game';

export type WeaponRarity = 'common' | 'rare' | 'epic';

export interface ExtendedWeaponDef extends WeaponDef {
  rarity: WeaponRarity;
  tier: number;
}

export const WEAPONS: Record<WeaponType, ExtendedWeaponDef> = {
  blaster: {
    id: 'blaster',
    name: 'Twin Blaster',
    icon: 'Zap',
    color: '#00f0ff',
    rarity: 'common',
    tier: 1,
    damage: 22,
    ammo: 6,
    cooldown: 280,
    projectileSpeed: 680,
    range: 650,
    description: 'Fires fast twin plasma bolts with rapid velocity.',
  },
  vulcan: {
    id: 'vulcan',
    name: 'Gatling Vulcan',
    icon: 'Flame',
    color: '#f97316',
    rarity: 'common',
    tier: 1,
    damage: 12,
    ammo: 14,
    cooldown: 90,
    projectileSpeed: 750,
    range: 580,
    description: 'High-rate-of-fire bullet stream that peppers opponents.',
  },
  mine: {
    id: 'mine',
    name: 'Proximity Mine',
    icon: 'Bomb',
    color: '#ef4444',
    rarity: 'common',
    tier: 1,
    damage: 50,
    ammo: 3,
    cooldown: 500,
    range: 120,
    description: 'Drops an explosive armed mine behind you with a pulsing warning radius.',
  },
  shockwave: {
    id: 'shockwave',
    name: 'EMP Shockwave',
    icon: 'Activity',
    color: '#38bdf8',
    rarity: 'rare',
    tier: 2,
    damage: 30,
    ammo: 2,
    cooldown: 650,
    range: 200,
    description: 'Unleashes a 360° sonic pulse that repels nearby karts and destroys incoming shots.',
  },
  emp: {
    id: 'emp',
    name: 'EMP Disruptor',
    icon: 'WifiOff',
    color: '#eab308',
    rarity: 'rare',
    tier: 2,
    damage: 18,
    ammo: 2,
    cooldown: 700,
    projectileSpeed: 520,
    range: 600,
    duration: 1800,
    description: 'Fires an electric orb that temporarily paralyzes steering and disables boost.',
  },
  rocket: {
    id: 'rocket',
    name: 'Rocket Boost Rush',
    icon: 'Rocket',
    color: '#ff007a',
    rarity: 'rare',
    tier: 2,
    damage: 40,
    ammo: 2,
    cooldown: 900,
    duration: 1600,
    description: 'Ignites supercharged rocket thrusters, granting high-speed ramming momentum.',
  },
  cryo: {
    id: 'cryo',
    name: 'Homing Cruise Missile',
    icon: 'Snowflake',
    color: '#67e8f9',
    rarity: 'epic',
    tier: 3,
    damage: 35,
    ammo: 2,
    cooldown: 750,
    projectileSpeed: 620,
    range: 750,
    duration: 1200,
    description: 'Launches a high-tech homing cruise missile with target lock-on reticle.',
  },
  laser: {
    id: 'laser',
    name: 'Railgun Laser',
    icon: 'Radio',
    color: '#a855f7',
    rarity: 'epic',
    tier: 3,
    damage: 45,
    ammo: 2,
    cooldown: 800,
    projectileSpeed: 1400,
    range: 900,
    description: 'Instant penetrating beam that rips through shields and armor in a straight line.',
  },
};

/**
 * Position-Based Weapon Distribution (Dynamic Catch-Up & Rubber-Banding)
 * - Leaders (1st): Defensive/common items (Blasters, Mines, Vulcan) with low odds of missiles
 * - Mid-Pack (2nd-3rd): Balanced distribution of tactical items (EMP, Shockwave, Vulcan)
 * - Trailing (4th+): High probability of powerful catch-up weapons (Homing Missile, Rocket Rush, Laser)
 */
export function getPositionWeightedWeapon(racePosition: number = 1, totalRacers: number = 6): WeaponType {
  const normalizedRank = racePosition / Math.max(1, totalRacers);
  const rand = Math.random();

  if (racePosition === 1 || normalizedRank <= 0.25) {
    // 1st Place / Leader Pool: 50% Common, 35% Rare, 15% Epic
    if (rand < 0.50) {
      const pool: WeaponType[] = ['blaster', 'mine'];
      return pool[Math.floor(Math.random() * pool.length)];
    } else if (rand < 0.85) {
      const pool: WeaponType[] = ['vulcan', 'shockwave', 'emp'];
      return pool[Math.floor(Math.random() * pool.length)];
    } else {
      const pool: WeaponType[] = ['cryo', 'laser'];
      return pool[Math.floor(Math.random() * pool.length)];
    }
  } else if (racePosition <= 3 || normalizedRank <= 0.55) {
    // Mid-Pack (2nd - 3rd Place): 35% Common, 40% Rare, 25% Epic
    if (rand < 0.35) {
      const pool: WeaponType[] = ['blaster', 'vulcan', 'mine'];
      return pool[Math.floor(Math.random() * pool.length)];
    } else if (rand < 0.75) {
      const pool: WeaponType[] = ['emp', 'shockwave', 'rocket'];
      return pool[Math.floor(Math.random() * pool.length)];
    } else {
      const pool: WeaponType[] = ['cryo', 'laser'];
      return pool[Math.floor(Math.random() * pool.length)];
    }
  } else {
    // Trailing Pack (4th - 6th Place): 15% Common, 35% Rare, 50% Epic / Catch-up
    if (rand < 0.15) {
      return 'vulcan';
    } else if (rand < 0.50) {
      const pool: WeaponType[] = ['rocket', 'emp', 'shockwave'];
      return pool[Math.floor(Math.random() * pool.length)];
    } else {
      const pool: WeaponType[] = ['cryo', 'rocket', 'laser'];
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }
}
