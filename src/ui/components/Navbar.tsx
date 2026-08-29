import React from 'react';
import { useWeb3 } from '../../web3/Web3Context';
import { Volume2, VolumeX, Settings, Wallet, Zap, Sparkles } from 'lucide-react';
import { SoundEngine } from '../../game/systems/SoundEngine';

interface NavbarProps {
  coins: number;
  level: number;
  onOpenSettings: () => void;
  onNavigate: (screen: string) => void;
  currentScreen: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  coins,
  level,
  onOpenSettings,
  onNavigate,
  currentScreen,
}) => {
  const { account, monBalance, smashBalance, isConnecting, connectWallet, disconnectWallet, isCorrectNetwork, switchToMonad } = useWeb3();
  const [isMuted, setIsMuted] = React.useState(false);

  const toggleMute = () => {
    const sound = SoundEngine.getInstance();
    const newMute = !isMuted;
    sound.setMuted(newMute);
    setIsMuted(newMute);
  };

  return (
    <header className="h-16 px-4 md:px-6 border-b-2 border-[#2b2542] bg-[#161226]/95 backdrop-blur-md flex items-center justify-between z-40 relative font-['Press_Start_2P',sans-serif]">
      {/* Brand & Logo */}
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => onNavigate('main_menu')}
      >
        <div className="w-9 h-9 rounded-xl bg-[#9d3b76] border-2 border-[#d965a9] flex items-center justify-center shadow group-hover:scale-105 transition-transform">
          <span className="text-base">🏎️</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs tracking-wider text-yellow-400">PIXEL</span>
            <span className="text-xs tracking-wider text-[#22c55e]">WHEELS</span>
          </div>
          <div className="text-[8px] font-['Silkscreen',sans-serif] text-cyber-cyan">
            MONAD TESTNET
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      {currentScreen !== 'game' && currentScreen !== 'lobby' && (
        <nav className="hidden lg:flex items-center gap-1.5 bg-[#251e3d] p-1.5 rounded-2xl border border-[#3d3261]">
          {[
            { id: 'main_menu', label: 'HUB' },
            { id: 'garage', label: 'GARAGE' },
            { id: 'map_select', label: 'TRACKS' },
            { id: 'shop', label: 'SHOP' },
            { id: 'quests', label: 'QUESTS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-[9px] transition-all ${
                currentScreen === tab.id
                  ? 'bg-[#9d3b76] text-white border border-[#d965a9] shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}

      {/* Right Controls & Web3 Wallet */}
      <div className="flex items-center gap-2.5">
        {/* Currency Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-[#251e3d] px-3 py-1.5 rounded-xl border border-[#3d3261] text-[9px]">
          <span className="text-yellow-400">🪙 {coins}</span>
          <span className="text-gray-600">|</span>
          <span className="text-cyber-cyan">{smashBalance} $SMASH</span>
        </div>

        {/* Web3 Wallet Button */}
        {!account ? (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="px-3 py-2 rounded-xl bg-[#581c87] hover:bg-[#6b21a8] text-white text-[9px] border border-[#9333ea] shadow transition-all flex items-center gap-1.5"
          >
            <Wallet className="w-3 h-3 text-cyber-cyan" />
            <span>{isConnecting ? '...' : 'WALLET'}</span>
          </button>
        ) : (
          <button
            onClick={disconnectWallet}
            className="px-3 py-1.5 rounded-xl bg-[#1b152d] border border-[#3d3261] text-cyber-cyan text-[9px] hover:border-red-500 hover:text-red-400 transition-all font-mono"
            title="Click to Disconnect"
          >
            {account.substring(0, 6)}...
          </button>
        )}

        {/* Audio Mute Toggle */}
        <button
          onClick={toggleMute}
          className="p-2 rounded-xl bg-[#251e3d] border border-[#3d3261] hover:bg-white/5 text-gray-300 transition-colors"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyber-cyan" />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-[#251e3d] border border-[#3d3261] hover:bg-white/5 text-gray-300 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
