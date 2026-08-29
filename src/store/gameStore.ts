import { useState, useEffect } from 'react';
import {
  KartClassId,
  GameMode,
  BotDifficulty,
  GarageCustomization,
  DailyQuest,
  MatchScore,
} from '../types/game';

export interface UserStats {
  level: number;
  xp: number;
  xpToNext: number;
  coins: number;
  wins: number;
  totalMatches: number;
  totalKills: number;
  totalDamage: number;
}

const DEFAULT_QUESTS: DailyQuest[] = [
  {
    id: 'q1',
    title: 'Precision Railgun',
    description: 'Land 3 hits using the Laser Railgun in battle.',
    progress: 0,
    goal: 3,
    completed: false,
    claimed: false,
    rewardCoins: 150,
    rewardTokens: 25,
    category: 'weapons',
  },
  {
    id: 'q2',
    title: 'Drift Supreme',
    description: 'Charge and release 5 Tier-3 Purple Drift boosts.',
    progress: 0,
    goal: 5,
    completed: false,
    claimed: false,
    rewardCoins: 200,
    rewardTokens: 35,
    category: 'drifts',
  },
  {
    id: 'q3',
    title: 'Arena Dominator',
    description: 'Eliminate 8 enemy karts across any arena.',
    progress: 0,
    goal: 8,
    completed: false,
    claimed: false,
    rewardCoins: 300,
    rewardTokens: 50,
    category: 'kills',
  },
  {
    id: 'q4',
    title: 'Monad Coin Collector',
    description: 'Collect 20 Monad Coins from match pickups.',
    progress: 0,
    goal: 20,
    completed: false,
    claimed: false,
    rewardCoins: 180,
    rewardTokens: 30,
    category: 'coins',
  },
];

const DEFAULT_GARAGE: GarageCustomization = {
  chassis: 'balanced',
  skinId: 'red',
  bodyColor: '#8354fe',
  accentColor: '#00f0ff',
  underglowColor: 'rgba(131, 84, 254, 0.7)',
  wheelTrail: 'neon',
  pilotName: 'Red Lightning',
};

const DEFAULT_STATS: UserStats = {
  level: 1,
  xp: 0,
  xpToNext: 500,
  coins: 500,
  wins: 0,
  totalMatches: 0,
  totalKills: 0,
  totalDamage: 0,
};

export function useGameStore() {
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('smash_stats');
    return saved ? JSON.parse(saved) : DEFAULT_STATS;
  });

  const [garage, setGarage] = useState<GarageCustomization>(() => {
    const saved = localStorage.getItem('smash_garage');
    return saved ? JSON.parse(saved) : DEFAULT_GARAGE;
  });

  const [unlockedKarts, setUnlockedKarts] = useState<KartClassId[]>(() => {
    const saved = localStorage.getItem('smash_unlocked_karts');
    return saved ? JSON.parse(saved) : ['balanced', 'scout', 'drift'];
  });

  const [quests, setQuests] = useState<DailyQuest[]>(() => {
    const saved = localStorage.getItem('smash_quests');
    return saved ? JSON.parse(saved) : DEFAULT_QUESTS;
  });

  const [selectedMap, setSelectedMap] = useState<string>('neon_city');
  const [gameMode, setGameMode] = useState<GameMode>('deathmatch');
  const [botCount, setBotCount] = useState<number>(4);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('veteran');

  // Persistence
  useEffect(() => {
    localStorage.setItem('smash_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('smash_garage', JSON.stringify(garage));
  }, [garage]);

  useEffect(() => {
    localStorage.setItem('smash_unlocked_karts', JSON.stringify(unlockedKarts));
  }, [unlockedKarts]);

  useEffect(() => {
    localStorage.setItem('smash_quests', JSON.stringify(quests));
  }, [quests]);

  const addXP = (amount: number) => {
    setStats((prev) => {
      let newXP = prev.xp + amount;
      let newLevel = prev.level;
      let newXpToNext = prev.xpToNext;

      while (newXP >= newXpToNext) {
        newXP -= newXpToNext;
        newLevel += 1;
        newXpToNext = Math.round(newXpToNext * 1.35);
      }

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        xpToNext: newXpToNext,
      };
    });
  };

  const addCoins = (amount: number) => {
    setStats((prev) => ({
      ...prev,
      coins: prev.coins + amount,
    }));
  };

  const spendCoins = (amount: number): boolean => {
    if (stats.coins < amount) return false;
    setStats((prev) => ({
      ...prev,
      coins: prev.coins - amount,
    }));
    return true;
  };

  const recordMatchResult = (playerScore: MatchScore, isWinner: boolean) => {
    setStats((prev) => ({
      ...prev,
      wins: prev.wins + (isWinner ? 1 : 0),
      totalMatches: prev.totalMatches + 1,
      totalKills: prev.totalKills + playerScore.kills,
      totalDamage: prev.totalDamage + playerScore.damageDealt,
      coins: prev.coins + playerScore.coinsCollected + (isWinner ? 150 : 50),
    }));

    // XP calculation: 100 base + 50 per kill + 200 for win
    const earnedXP = 100 + playerScore.kills * 50 + (isWinner ? 200 : 0);
    addXP(earnedXP);

    // Update quest progress
    updateQuestProgress('kills', playerScore.kills);
    updateQuestProgress('coins', playerScore.coinsCollected);
  };

  const updateQuestProgress = (category: string, amount: number) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.category === category && !q.completed) {
          const newProgress = Math.min(q.goal, q.progress + amount);
          return {
            ...q,
            progress: newProgress,
            completed: newProgress >= q.goal,
          };
        }
        return q;
      })
    );
  };

  const claimQuest = (questId: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId && q.completed && !q.claimed) {
          addCoins(q.rewardCoins);
          return { ...q, claimed: true };
        }
        return q;
      })
    );
  };

  const unlockKart = (kartId: KartClassId) => {
    if (!unlockedKarts.includes(kartId)) {
      setUnlockedKarts((prev) => [...prev, kartId]);
    }
  };

  return {
    stats,
    garage,
    setGarage,
    unlockedKarts,
    unlockKart,
    quests,
    claimQuest,
    selectedMap,
    setSelectedMap,
    gameMode,
    setGameMode,
    botCount,
    setBotCount,
    botDifficulty,
    setBotDifficulty,
    addCoins,
    spendCoins,
    addXP,
    recordMatchResult,
  };
}
