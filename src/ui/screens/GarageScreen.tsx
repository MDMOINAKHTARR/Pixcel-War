import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { VEHICLE_SKINS, VehicleSkinId, PixelArtVehicles } from '../../game/graphics/PixelArtVehicles';
import { ArrowLeft, ArrowRight, Check, Lock, Sparkles } from 'lucide-react';

interface GarageScreenProps {
  onBack: () => void;
  onNavigateShop: () => void;
}

// 3x5 Grid of vehicles matching Pixel Wheels
const VEHICLE_GRID: VehicleSkinId[][] = [
  ['red', 'police', 'surf', 'pickup', 'harvester'],
  ['bigfoot', 'locked', 'dark_m', 'santa', 'locked'],
  ['old_f1', 'rocket', 'roadster', 'santa', 'locked'],
];

export const GarageScreen: React.FC<GarageScreenProps> = ({ onBack, onNavigateShop }) => {
  const { garage, setGarage } = useGameStore();
  const [selectedSkin, setSelectedSkin] = useState<VehicleSkinId>(
    (garage.skinId as VehicleSkinId) || 'red'
  );

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Flat list of vehicles for next/prev navigation
  const flatVehicles: VehicleSkinId[] = [
    'red',
    'police',
    'surf',
    'pickup',
    'harvester',
    'bigfoot',
    'dark_m',
    'santa',
    'old_f1',
    'rocket',
    'roadster',
  ];

  const currentDef = VEHICLE_SKINS[selectedSkin] || VEHICLE_SKINS['red'];

  const handleSelect = (skinId: VehicleSkinId) => {
    if (skinId === 'locked') return;
    setSelectedSkin(skinId);
    setGarage({
      ...garage,
      skinId,
      pilotName: VEHICLE_SKINS[skinId]?.name || garage.pilotName,
    });
  };

  const handlePrev = () => {
    const idx = flatVehicles.indexOf(selectedSkin);
    const prevIdx = (idx - 1 + flatVehicles.length) % flatVehicles.length;
    handleSelect(flatVehicles[prevIdx]);
  };

  const handleNext = () => {
    const idx = flatVehicles.indexOf(selectedSkin);
    const nextIdx = (idx + 1) % flatVehicles.length;
    handleSelect(flatVehicles[nextIdx]);
  };

  // Render 360 rotating preview on canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let rotation = 0;

    const render = () => {
      rotation += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
      ctx.rotate(rotation);

      PixelArtVehicles.drawVehicle(ctx, selectedSkin, 2.2);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedSkin]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 md:p-8 bg-[#161224] relative overflow-hidden select-none animate-fadeIn">
      {/* Checkerboard Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#261f3d_1px,transparent_1px),linear-gradient(to_right,#1d1830_24px,#141021_24px),linear-gradient(to_bottom,#1d1830_24px,#141021_24px)] bg-[size:48px_48px] opacity-70 pointer-events-none"></div>

      {/* Top Header matching Pixel Wheels Screenshot */}
      <div className="text-center pt-2 relative z-10">
        <h1 className="font-['Press_Start_2P',sans-serif] text-xl md:text-2xl tracking-widest text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
          SELECT YOUR VEHICLE
        </h1>
      </div>

      {/* Center 3x5 Grid Pedestal Shelf matching Pixel Wheels Screenshot 4 */}
      <div className="max-w-4xl mx-auto w-full my-auto z-10">
        <div className="bg-[#484064] border-4 border-[#2b2542] rounded-3xl p-6 md:p-8 shadow-[0_12px_24px_rgba(0,0,0,0.6)]">
          <div className="grid grid-rows-3 gap-6">
            {VEHICLE_GRID.map((row, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-5 gap-4 md:gap-8 items-center justify-items-center">
                {row.map((skinId, colIdx) => {
                  const isSelected = selectedSkin === skinId && skinId !== 'locked';
                  const isLocked = skinId === 'locked';

                  return (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      onClick={() => handleSelect(skinId)}
                      className={`relative w-16 h-24 md:w-20 md:h-28 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-150 group ${
                        isSelected
                          ? 'border-4 border-[#e11d48] bg-[#e11d48]/15 shadow-[0_0_20px_rgba(225,29,72,0.6)] scale-110'
                          : isLocked
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:scale-105 hover:bg-white/5'
                      }`}
                    >
                      {/* Vehicle Sprite Canvas Thumbnail */}
                      <VehicleThumbnail skinId={skinId} scale={1.2} />

                      {/* Selected Outline Marker */}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-[#e11d48] text-white p-0.5 rounded-full shadow">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Vehicle Name Label (matching Pixel Wheels screenshot) */}
        <div className="text-center pt-4 space-y-1">
          <div className="font-['Press_Start_2P',sans-serif] text-lg md:text-xl text-white tracking-wider drop-shadow-md">
            {currentDef.name}
          </div>
          <div className="font-mono text-xs text-cyber-cyan uppercase">
            Class: {currentDef.category} • Top Speed: {currentDef.speed}% • Armor: {currentDef.armor}%
          </div>
        </div>
      </div>

      {/* Bottom Navigation Arrow Buttons matching Pixel Wheels Screenshot 4 */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 pt-2">
        {/* Left Arrow Button */}
        <button
          onClick={handlePrev}
          className="w-14 h-12 md:w-16 md:h-14 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] active:translate-y-1 text-white border-2 border-[#d965a9] shadow-[0_5px_0_#5c1d43] flex items-center justify-center transition-all group"
          title="Previous Vehicle"
        >
          <ArrowLeft className="w-6 h-6 stroke-[3] group-hover:-translate-x-1 transition-transform" />
        </button>

        {/* Confirm Selection & Return Button */}
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] active:translate-y-1 text-white font-['Press_Start_2P',sans-serif] text-xs tracking-wider border-2 border-[#d965a9] shadow-[0_5px_0_#5c1d43] transition-all"
        >
          CONFIRM VEHICLE
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={handleNext}
          className="w-14 h-12 md:w-16 md:h-14 rounded-2xl bg-[#9d3b76] hover:bg-[#b8488d] active:translate-y-1 text-white border-2 border-[#d965a9] shadow-[0_5px_0_#5c1d43] flex items-center justify-center transition-all group"
          title="Next Vehicle"
        >
          <ArrowRight className="w-6 h-6 stroke-[3] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

// Thumbnail Component for Grid
const VehicleThumbnail: React.FC<{ skinId: VehicleSkinId; scale?: number }> = ({ skinId, scale = 1.0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width * 0.5, canvas.height * 0.5);

    PixelArtVehicles.drawVehicle(ctx, skinId, scale);

    ctx.restore();
  }, [skinId, scale]);

  return <canvas ref={canvasRef} width={64} height={90} className="pointer-events-none" />;
};
