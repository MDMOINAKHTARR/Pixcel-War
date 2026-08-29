import React, { useState } from 'react';
import { useWeb3 } from '../../web3/Web3Context';
import { MONAD_TESTNET } from '../../web3/monadChain';
import { Coins, Swords, ShieldAlert, CheckCircle, Clock, ExternalLink, RefreshCw, X, AlertTriangle } from 'lucide-react';

interface WagerLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackName: string;
  onStartWagerRace?: (matchId: string, wagerAmount: string) => void;
}

export const WagerLobbyModal: React.FC<WagerLobbyModalProps> = ({
  isOpen,
  onClose,
  trackId,
  trackName,
  onStartWagerRace,
}) => {
  const { account, monBalance, connectWallet } = useWeb3();
  const [wagerAmount, setWagerAmount] = useState<string>('0.5');
  const [opponentAddresses, setOpponentAddresses] = useState<string[]>([
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  ]);
  const [newOpponent, setNewOpponent] = useState<string>('');
  const [matchState, setMatchState] = useState<'IDLE' | 'OPEN' | 'DEPOSITED' | 'LOCKED' | 'SETTLED'>('IDLE');
  const [matchId, setMatchId] = useState<string>('');
  const [txStatus, setTxStatus] = useState<{ status: 'idle' | 'pending' | 'success' | 'error'; message: string; txHash?: string }>({
    status: 'idle',
    message: '',
  });

  if (!isOpen) return null;

  const handleAddOpponent = () => {
    if (newOpponent && newOpponent.startsWith('0x') && newOpponent.length === 42) {
      if (!opponentAddresses.includes(newOpponent)) {
        setOpponentAddresses([...opponentAddresses, newOpponent]);
        setNewOpponent('');
      }
    }
  };

  const handleRemoveOpponent = (index: number) => {
    setOpponentAddresses(opponentAddresses.filter((_, i) => i !== index));
  };

  const handleCreateMatch = async () => {
    if (!account) {
      await connectWallet();
      return;
    }

    setTxStatus({
      status: 'pending',
      message: 'Creating escrow match on Monad Testnet...',
    });

    // Simulate match creation state and contract call
    setTimeout(() => {
      const generatedId = Math.floor(1000 + Math.random() * 9000).toString();
      setMatchId(generatedId);
      setMatchState('OPEN');
      setTxStatus({
        status: 'success',
        message: `Match #${generatedId} created! Waiting for player deposits.`,
        txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      });
    }, 1500);
  };

  const handleDepositWager = async () => {
    setTxStatus({
      status: 'pending',
      message: `Escrowing ${wagerAmount} MON into Match #${matchId}...`,
    });

    setTimeout(() => {
      setMatchState('DEPOSITED');
      setTxStatus({
        status: 'success',
        message: `Successfully deposited ${wagerAmount} MON into escrow!`,
        txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      });
    }, 1800);
  };

  const handleLockAndStart = () => {
    setMatchState('LOCKED');
    if (onStartWagerRace) {
      onStartWagerRace(matchId, wagerAmount);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-['Press_Start_2P',sans-serif]">
      <div className="relative w-full max-w-2xl bg-[#1d172e] border-4 border-[#8354fe] rounded-3xl p-6 shadow-[0_0_40px_rgba(131,84,254,0.45)] text-white space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#3d3261]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#8354fe]/20 rounded-xl border border-[#a855f7]">
              <Coins className="w-6 h-6 text-[#c084fc]" />
            </div>
            <div>
              <h2 className="text-sm md:text-base text-purple-300">MONAD RACE WAGER</h2>
              <span className="text-[8px] text-gray-400 font-mono">Track: {trackName}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-[#2d2447] hover:bg-[#3d3261] rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Alert Banner */}
        {txStatus.status !== 'idle' && (
          <div
            className={`p-3.5 rounded-2xl text-[9px] flex items-center justify-between border ${
              txStatus.status === 'pending'
                ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
                : txStatus.status === 'success'
                ? 'bg-green-500/15 border-green-500/40 text-green-300'
                : 'bg-red-500/15 border-red-500/40 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {txStatus.status === 'pending' && <RefreshCw className="w-4 h-4 animate-spin text-yellow-400" />}
              {txStatus.status === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
              {txStatus.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
              <span>{txStatus.message}</span>
            </div>

            {txStatus.txHash && (
              <a
                href={`${MONAD_TESTNET.blockExplorers.default.url}/tx/${txStatus.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 underline text-[8px] text-purple-300 hover:text-white ml-2"
              >
                Explorer <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Wager Settings Form */}
        <div className="space-y-4 font-mono text-xs">
          {/* Wager Amount Input */}
          <div className="bg-[#161124] p-4 rounded-2xl border border-[#3d3261] space-y-2">
            <label className="text-[9px] text-purple-300 font-sans tracking-wide">
              💰 WAGER AMOUNT (MON PER RACER)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={wagerAmount}
                disabled={matchState !== 'IDLE'}
                onChange={(e) => setWagerAmount(e.target.value)}
                className="w-full bg-[#241c3b] border-2 border-[#4c3a7a] focus:border-[#a855f7] rounded-xl px-4 py-2.5 text-white outline-none font-bold text-sm"
              />
              <span className="px-4 py-2.5 bg-[#8354fe]/25 border border-[#a855f7] rounded-xl text-xs text-purple-300 font-bold">
                MON
              </span>
            </div>
            <div className="text-[8px] text-gray-400 flex justify-between pt-1">
              <span>Your Balance: {monBalance} MON</span>
              <span>Total Escrow Pool: {(parseFloat(wagerAmount || '0') * (opponentAddresses.length + 1)).toFixed(2)} MON</span>
            </div>
          </div>

          {/* Participant Racers List */}
          <div className="bg-[#161124] p-4 rounded-2xl border border-[#3d3261] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[9px] text-purple-300 font-sans tracking-wide">
                🏎️ RACER WALLETS ({opponentAddresses.length + 1} RACERS)
              </label>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto">
              {/* Player Address */}
              <div className="p-2.5 bg-[#241c3b] border border-[#22c55e]/50 rounded-xl flex items-center justify-between text-[8px]">
                <span className="text-green-400">👑 You ({account ? `${account.slice(0, 8)}...${account.slice(-6)}` : 'Not Connected'})</span>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded font-sans text-[7px]">READY</span>
              </div>

              {/* Opponents */}
              {opponentAddresses.map((addr, idx) => (
                <div key={idx} className="p-2.5 bg-[#241c3b] border border-[#4c3a7a] rounded-xl flex items-center justify-between text-[8px]">
                  <span className="text-gray-300">Racer #{idx + 2}: {addr.slice(0, 8)}...{addr.slice(-6)}</span>
                  {matchState === 'IDLE' && (
                    <button
                      onClick={() => handleRemoveOpponent(idx)}
                      className="text-red-400 hover:text-red-300 px-2 py-0.5 bg-red-500/10 rounded"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Opponent Input */}
            {matchState === 'IDLE' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="0x... (Opponent Monad Address)"
                  value={newOpponent}
                  onChange={(e) => setNewOpponent(e.target.value)}
                  className="flex-1 bg-[#241c3b] border border-[#4c3a7a] focus:border-[#a855f7] rounded-xl px-3 py-2 text-white text-[9px] outline-none"
                />
                <button
                  onClick={handleAddOpponent}
                  className="px-3 py-2 bg-[#8354fe] hover:bg-[#9d6fff] text-white rounded-xl text-[8px] font-sans"
                >
                  + ADD
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Timeout & Refund Protection Notice */}
        <div className="p-3 bg-[#241c3b]/60 border border-[#4c3a7a] rounded-2xl flex items-start gap-2.5 text-[7px] text-gray-400 font-mono">
          <Clock className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <span>
            100% winner-takes-all pool escrowed via <code className="text-purple-300">RaceWager.sol</code>. If race stalls past 15-minute lock timeout, claim full refund anytime.
          </span>
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 flex items-center justify-end gap-3">
          {matchState === 'IDLE' && (
            <button
              onClick={handleCreateMatch}
              className="w-full py-3.5 bg-[#8354fe] hover:bg-[#9d6fff] active:translate-y-0.5 rounded-2xl text-[9px] text-white font-sans border-2 border-[#a855f7] shadow-[0_4px_0_#581c87] transition-all flex items-center justify-center gap-2"
            >
              <Swords className="w-4 h-4" /> CREATE MATCH ESCROW
            </button>
          )}

          {matchState === 'OPEN' && (
            <button
              onClick={handleDepositWager}
              className="w-full py-3.5 bg-[#22c55e] hover:bg-[#16a34a] active:translate-y-0.5 rounded-2xl text-[9px] text-white font-sans border-2 border-[#86efac] shadow-[0_4px_0_#15803d] transition-all flex items-center justify-center gap-2"
            >
              <Coins className="w-4 h-4" /> DEPOSIT {wagerAmount} MON
            </button>
          )}

          {matchState === 'DEPOSITED' && (
            <button
              onClick={handleLockAndStart}
              className="w-full py-3.5 bg-[#f97316] hover:bg-[#ea580c] active:translate-y-0.5 rounded-2xl text-[9px] text-white font-sans border-2 border-[#fdba74] shadow-[0_4px_0_#9a3412] transition-all flex items-center justify-center gap-2"
            >
              <Swords className="w-4 h-4" /> LOCK MATCH & START RACE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
