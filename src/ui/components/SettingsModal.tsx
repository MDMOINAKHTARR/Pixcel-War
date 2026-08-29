import React from 'react';
import { X, Volume2, Gamepad2, Sparkles, RefreshCw } from 'lucide-react';
import { SoundEngine } from '../../game/systems/SoundEngine';
import { useWeb3 } from '../../web3/Web3Context';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const soundEngine = SoundEngine.getInstance();
  const { claimFaucet, txLoading, lastTxHash, smashBalance } = useWeb3();
  const [masterVol, setMasterVol] = React.useState(soundEngine.masterVolume * 100);
  const [faucetSuccess, setFaucetSuccess] = React.useState(false);

  if (!isOpen) return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setMasterVol(val);
    soundEngine.setVolume(val / 100);
  };

  const handleClaimFaucet = async () => {
    const res = await claimFaucet();
    if (res.success) {
      setFaucetSuccess(true);
      setTimeout(() => setFaucetSuccess(false), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-monad-card border border-monad-border w-full max-w-lg rounded-2xl overflow-hidden shadow-glow-purple flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-monad-border flex items-center justify-between bg-monad-dark/50">
          <div className="flex items-center gap-2.5">
            <Gamepad2 className="w-5 h-5 text-monad-purple" />
            <h2 className="font-display text-lg tracking-wider text-white">GAME SETTINGS & CONTROLS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Audio Controls */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-cyber-cyan flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Audio Configuration
            </h3>
            <div className="bg-monad-dark/60 p-4 rounded-xl border border-monad-border/60 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300 font-sans">Master Volume</span>
                <span className="font-mono text-xs text-cyber-cyan">{masterVol}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={masterVol}
                onChange={handleVolumeChange}
                className="w-full accent-monad-purple bg-monad-card h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Controls Cheatsheet */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-cyber-cyan flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              Keyboard Controls
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-monad-dark/60 p-2.5 rounded-xl border border-monad-border/60 flex items-center justify-between">
                <span className="text-gray-400">Drive Forward</span>
                <span className="bg-monad-purple/30 text-monad-200 px-2 py-0.5 rounded border border-monad-purple/40">W / ↑</span>
              </div>
              <div className="bg-monad-dark/60 p-2.5 rounded-xl border border-monad-border/60 flex items-center justify-between">
                <span className="text-gray-400">Reverse / Brake</span>
                <span className="bg-monad-purple/30 text-monad-200 px-2 py-0.5 rounded border border-monad-purple/40">S / ↓</span>
              </div>
              <div className="bg-monad-dark/60 p-2.5 rounded-xl border border-monad-border/60 flex items-center justify-between">
                <span className="text-gray-400">Steer Left / Right</span>
                <span className="bg-monad-purple/30 text-monad-200 px-2 py-0.5 rounded border border-monad-purple/40">A / D / ← / →</span>
              </div>
              <div className="bg-monad-dark/60 p-2.5 rounded-xl border border-monad-border/60 flex items-center justify-between">
                <span className="text-cyber-cyan font-bold">Drift & Charge</span>
                <span className="bg-cyber-cyan/20 text-cyber-cyan px-2 py-0.5 rounded border border-cyber-cyan/40">SHIFT / SPACE</span>
              </div>
              <div className="bg-monad-dark/60 p-2.5 rounded-xl border border-monad-border/60 flex items-center justify-between col-span-2">
                <span className="text-cyber-pink font-bold">Fire Weapon</span>
                <span className="bg-cyber-pink/20 text-cyber-pink px-2 py-0.5 rounded border border-cyber-pink/40">F / E / ENTER</span>
              </div>
            </div>
          </div>

          {/* Testnet Monad Faucet */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-monad-purple flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Monad Testnet Faucet
            </h3>
            <div className="bg-monad-purple/10 border border-monad-purple/30 p-4 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-display text-sm text-white">Claim 100 $SMASH Tokens</div>
                <div className="text-xs text-gray-400">Free testnet tokens for upgrading karts & unlocking skins.</div>
              </div>
              <button
                onClick={handleClaimFaucet}
                disabled={txLoading}
                className="bg-monad-purple hover:bg-monad-600 text-white font-mono text-xs px-4 py-2 rounded-xl shadow-glow-purple transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {txLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{txLoading ? 'Claiming...' : 'Claim 100'}</span>
              </button>
            </div>
            {faucetSuccess && (
              <div className="text-xs font-mono text-cyber-green text-center animate-bounce">
                ✅ Successfully claimed 100 $SMASH tokens! Current: {smashBalance}
              </div>
            )}
            {lastTxHash && (
              <div className="text-[10px] font-mono text-gray-400 truncate text-center">
                TX Hash: <span className="text-cyber-cyan">{lastTxHash}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-monad-border bg-monad-dark/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 font-mono text-xs uppercase tracking-wider text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
