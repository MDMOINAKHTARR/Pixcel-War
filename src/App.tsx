import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import { useWeb3 } from './web3/Web3Context';
import { GameEngine } from './game/GameEngine';
import { MatchScore, CombatFeedEvent } from './types/game';

// Components
import { Navbar } from './ui/components/Navbar';
import { SettingsModal } from './ui/components/SettingsModal';

// Screens
import { LandingScreen } from './ui/screens/LandingScreen';
import { MainMenu } from './ui/screens/MainMenu';
import { GarageScreen } from './ui/screens/GarageScreen';
import { MapSelectScreen } from './ui/screens/MapSelectScreen';
import { LobbyScreen } from './ui/screens/LobbyScreen';
import { GameHUD } from './ui/screens/GameHUD';
import { ResultsScreen } from './ui/screens/ResultsScreen';
import { ShopScreen } from './ui/screens/ShopScreen';
import { QuestsScreen } from './ui/screens/QuestsScreen';
import { LeaderboardScreen } from './ui/screens/LeaderboardScreen';

interface GameArenaProps {
  mapId: string;
  gameMode: any;
  botCount: number;
  botDifficulty: any;
  garage: any;
  onMatchEnd: (winner: MatchScore, allScores: MatchScore[]) => void;
  onQuitMatch: () => void;
}

const GameArena: React.FC<GameArenaProps> = ({
  mapId,
  gameMode,
  botCount,
  botDifficulty,
  garage,
  onMatchEnd,
  onQuitMatch,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [matchScores, setMatchScores] = useState<MatchScore[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gameEngine = new GameEngine({
      canvas,
      mapId,
      gameMode,
      botCount,
      botDifficulty,
      playerClass: garage.chassis,
      playerName: garage.pilotName,
      playerColors: {
        body: garage.bodyColor,
        accent: garage.accentColor,
        underglow: garage.underglowColor,
        skinId: garage.skinId || 'red',
      } as any,
      matchDuration: 90,
      onScoreUpdate: (scores) => {
        setMatchScores(scores);
      },
      onTimerTick: (time) => {
        setTimeLeft(time);
      },
      onMatchEnd: (winner, allScores) => {
        onMatchEnd(winner, allScores);
      },
    });

    setEngine(gameEngine);
    gameEngine.start();

    return () => {
      gameEngine.stop();
      setEngine(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePauseToggle = () => {
    if (engine) {
      const paused = engine.togglePause();
      setIsPaused(paused);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-black select-none">
      <canvas ref={canvasRef} className="w-full h-full block focus:outline-none" tabIndex={0} />
      {engine && (
        <GameHUD
          engine={engine}
          scores={matchScores}
          timeLeft={timeLeft}
          isPaused={isPaused}
          onPauseToggle={handlePauseToggle}
          onQuitMatch={onQuitMatch}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  const { stats, garage, selectedMap, gameMode, botCount, botDifficulty, recordMatchResult } = useGameStore();
  const { refreshBalances } = useWeb3();

  const [currentScreen, setCurrentScreen] = useState<string>('landing');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Results State
  const [matchWinner, setMatchWinner] = useState<MatchScore | null>(null);
  const [finalScores, setFinalScores] = useState<MatchScore[]>([]);

  const handleMatchFinish = useCallback((winner: MatchScore, allScores: MatchScore[]) => {
    setMatchWinner(winner);
    setFinalScores(allScores);
    const pScore = allScores.find((s) => s.isPlayer) || allScores[0];
    recordMatchResult(pScore, winner.isPlayer);
    refreshBalances();
    setCurrentScreen('results');
  }, [recordMatchResult, refreshBalances]);

  return (
    <div className="min-h-screen bg-monad-dark text-white font-sans flex flex-col relative overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        coins={stats.coins}
        level={stats.level}
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Screen Views */}
      <main className="flex-1 relative flex flex-col">
        {currentScreen === 'landing' && (
          <LandingScreen
            onStartGame={() => setCurrentScreen('main_menu')}
            onOpenGarage={() => setCurrentScreen('garage')}
            onOpenQuests={() => setCurrentScreen('quests')}
          />
        )}

        {currentScreen === 'main_menu' && (
          <MainMenu
            onNavigate={(screen) => setCurrentScreen(screen)}
            onQuickPlay={() => setCurrentScreen('lobby')}
          />
        )}

        {currentScreen === 'garage' && (
          <GarageScreen
            onBack={() => setCurrentScreen('main_menu')}
            onNavigateShop={() => setCurrentScreen('shop')}
          />
        )}

        {currentScreen === 'map_select' && (
          <MapSelectScreen
            onBack={() => setCurrentScreen('main_menu')}
            onSelectMapAndProceed={() => setCurrentScreen('lobby')}
          />
        )}

        {currentScreen === 'lobby' && (
          <LobbyScreen
            onBack={() => setCurrentScreen('map_select')}
            onLaunchGame={() => setCurrentScreen('game')}
          />
        )}

        {currentScreen === 'game' && (
          <GameArena
            mapId={selectedMap}
            gameMode={gameMode}
            botCount={botCount}
            botDifficulty={botDifficulty}
            garage={garage}
            onMatchEnd={handleMatchFinish}
            onQuitMatch={() => setCurrentScreen('main_menu')}
          />
        )}

        {currentScreen === 'results' && matchWinner && (
          <ResultsScreen
            winner={matchWinner}
            allScores={finalScores}
            onPlayAgain={() => setCurrentScreen('lobby')}
            onReturnHub={() => setCurrentScreen('main_menu')}
          />
        )}

        {currentScreen === 'shop' && (
          <ShopScreen
            onBack={() => setCurrentScreen('main_menu')}
            onOpenGarage={() => setCurrentScreen('garage')}
          />
        )}

        {currentScreen === 'quests' && (
          <QuestsScreen
            onBack={() => setCurrentScreen('main_menu')}
          />
        )}

        {currentScreen === 'leaderboard' && (
          <LeaderboardScreen
            onBack={() => setCurrentScreen('main_menu')}
          />
        )}
      </main>
    </div>
  );
};
export default App;
