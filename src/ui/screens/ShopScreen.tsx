import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useWeb3 } from '../../web3/Web3Context';
import { KART_CLASSES } from '../../game/config/kartClasses';
import { KartClassId } from '../../types/game';
import { VEHICLE_SKINS } from '../../game/graphics/PixelArtVehicles';
import { ArrowLeft, ShoppingBag, Sparkles, Check, Lock, Shield, Cpu, RefreshCw } from 'lucide-react';

interface ShopScreenProps {
  onBack: () => void;
  onOpenGarage: () => void;
}

const KART_COSTS: Record<KartClassId, { coins: number; tokens: number }> = {
  balanced: { coins: 0, tokens: 0 },
  scout: { coins: 300, tokens: 20 },
  drift: { coins: 450, tokens: 30 },
  tank: { coins: 600, tokens: 40 },
  cyber: { coins: 1000, tokens: 75 },
};

export const ShopScreen: React.FC<ShopScreenProps> = ({ onBack, onOpenGarage }) => {
  const { stats, spendCoins, unlockedKarts, unlockKart, garage } = useGameStore();
  const { account, smashBalance, mintProfileNFT, hasProfileNFT, burnTokensForUpgrade, txLoading } = useWeb3();
  const [activeTab, setActiveTab] = useState<'karts' | 'nft'>('karts');
  const [nftMintSuccess, setNftMintSuccess] = useState(false);

  const handleBuyKartWithCoins = (classId: KartClassId, price: number) => {
    if (spendCoins(price)) {
      unlockKart(classId);
    }
  };

  const handleBuyKartWithTokens = async (classId: KartClassId, tokenPrice: number) => {
    const success = await burnTokensForUpgrade(tokenPrice, `kart_${classId}`);
    if (success) {
      unlockKart(classId);
    }
  };

  const handleMintLicense = async () => {
    const res = await mintProfileNFT(garage.pilotName, garage.chassis);
    if (res.success) {
      setNftMintSuccess(true);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 space-y-6 bg-[#161226] relative overflow-hidden select-none font-['Press_Start_2P',sans-serif]">
      {/* Checkerboard Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#261f3d_1px,transparent_1px),linear-gradient(to_right,#1d1830_24px,#141021_24px),linear-gradient(to_bottom,#1d1830_24px,#141021_24px)] bg-[size:48px_48px] opacity-70 pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between z-10 relative">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] active:translate-y-1 text-white border-2 border-[#d965a9] shadow-[0_4px_0_#5c1d43] flex items-center justify-center transition-all"
        >
          <ArrowLeft className="w-5 h-5 stroke-[3]" />
        </button>
        <div className="text-center">
          <h1 className="text-base md:text-xl text-white tracking-wide drop-shadow">BLACK MARKET</h1>
          <p className="text-[10px] text-cyber-cyan mt-1 font-['Silkscreen',sans-serif]">
            🪙 {stats.coins} COINS • {smashBalance} $SMASH
          </p>
        </div>
        <div className="w-12"></div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 justify-center z-10 relative">
        <button
          onClick={() => setActiveTab('karts')}
          className={`px-5 py-2.5 rounded-2xl text-xs transition-all ${
            activeTab === 'karts'
              ? 'bg-[#9d3b76] text-white border-2 border-[#d965a9] shadow-[0_4px_0_#5c1d43]'
              : 'bg-[#251e3d] text-gray-400 border border-[#3d3261]'
          }`}
        >
          VEHICLES
        </button>
        <button
          onClick={() => setActiveTab('nft')}
          className={`px-5 py-2.5 rounded-2xl text-xs transition-all ${
            activeTab === 'nft'
              ? 'bg-[#9d3b76] text-white border-2 border-[#d965a9] shadow-[0_4px_0_#5c1d43]'
              : 'bg-[#251e3d] text-gray-400 border border-[#3d3261]'
          }`}
        >
          ON-CHAIN NFT LICENSE
        </button>
      </div>

      {/* Kart Chassis Grid */}
      {activeTab === 'karts' && (
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 z-10 relative">
          {Object.values(KART_CLASSES).map((k) => {
            const isOwned = unlockedKarts.includes(k.id);
            const cost = KART_COSTS[k.id] || { coins: 300, tokens: 20 };

            return (
              <div
                key={k.id}
                className={`bg-[#251e3d] border-2 rounded-3xl p-6 space-y-4 shadow-xl ${
                  isOwned ? 'border-[#22c55e]' : 'border-[#3d3261]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs text-white">{k.name}</h3>
                    <span className="text-[8px] text-cyber-cyan uppercase">{k.tagline}</span>
                  </div>
                  {isOwned ? (
                    <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full text-[8px]">
                      OWNED
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-[8px]">
                      🪙 {cost.coins}
                    </span>
                  )}
                </div>

                <p className="text-[9px] text-gray-300 font-sans leading-relaxed">{k.description}</p>

                {/* Buy / Equip Button */}
                {isOwned ? (
                  <button
                    onClick={onOpenGarage}
                    className="w-full py-2.5 rounded-2xl bg-[#1b152d] hover:bg-[#2b2147] text-white text-[9px] border border-[#3d3261] transition-all"
                  >
                    EQUIP IN GARAGE
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleBuyKartWithCoins(k.id, cost.coins)}
                      disabled={stats.coins < cost.coins}
                      className="py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white text-[8px] transition-all"
                    >
                      BUY ({cost.coins} 🪙)
                    </button>
                    <button
                      onClick={() => handleBuyKartWithTokens(k.id, cost.tokens)}
                      disabled={!account || Number(smashBalance) < cost.tokens || txLoading}
                      className="py-2.5 rounded-xl bg-[#581c87] hover:bg-[#6b21a8] disabled:opacity-40 text-white text-[8px] transition-all"
                    >
                      {cost.tokens} $SMASH
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* On-chain NFT License Tab */}
      {activeTab === 'nft' && (
        <div className="max-w-2xl mx-auto w-full bg-[#251e3d] border-2 border-[#3d3261] rounded-3xl p-8 text-center space-y-6 shadow-2xl z-10 relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-purple-600 p-1 mx-auto flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-[#161226] rounded-full flex items-center justify-center text-3xl">
              🎖️
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm md:text-base text-white">MONAD RACER SOULBOUND LICENSE</h2>
            <p className="text-[10px] text-gray-300 font-sans leading-relaxed">
              Mint an immutable ERC-721 Pilot Profile NFT on Monad Testnet to verify tournament status, record career kills, and access ranked matchmaking.
            </p>
          </div>
          <button
            onClick={handleMintLicense}
            disabled={!account || hasProfileNFT || txLoading}
            className="px-8 py-4 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] disabled:opacity-50 text-white text-xs border-2 border-[#d965a9] shadow-[0_5px_0_#5c1d43] transition-all"
          >
            {hasProfileNFT ? 'LICENSE VERIFIED ON-CHAIN' : txLoading ? 'MINTING NFT...' : 'MINT RACING LICENSE (FREE)'}
          </button>
        </div>
      )}
    </div>
  );
};
