import React from 'react';
import { Droplets, Plus, RotateCcw } from 'lucide-react';

export function WaterSlider({
  weightKg,
  currentMl,
  onChangeMl,
}: {
  weightKg: number;
  currentMl: number;
  onChangeMl: (newMl: number) => void;
}) {
  const goalMl = Math.round(((weightKg || 75) * 35) / 50) * 50;
  const pct = Math.min(100, Math.round((currentMl / goalMl) * 100));

  return (
    <div className="bg-black border border-[#2A2A2A] rounded-xl p-3 space-y-2.5">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-sky-400 flex items-center gap-1.5">
          <Droplets size={14} /> HIDRATAÇÃO ({weightKg}kg × 35ml)
        </span>
        <span className="font-bold text-white">
          {currentMl} / <span className="text-sky-400">{goalMl} ml</span> ({pct}%)
        </span>
      </div>

      <div className="w-full h-2.5 bg-[#141414] rounded-full overflow-hidden border border-[#2A2A2A]">
        <div
          className="h-full bg-sky-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex gap-1.5">
        {[250, 500, 750].map((add) => (
          <button
            key={add}
            type="button"
            onClick={() => onChangeMl(currentMl + add)}
            className="flex-1 bg-[#141414] hover:border-sky-400 border border-[#2A2A2A] rounded-lg py-1.5 text-xs font-bold text-sky-400 flex items-center justify-center gap-1"
          >
            <Plus size={12} /> {add}ml
          </button>
        ))}
        {currentMl > 0 && (
          <button
            type="button"
            onClick={() => onChangeMl(0)}
            className="px-2.5 bg-[#141414] border border-[#2A2A2A] rounded-lg text-[#A8A8A8] hover:text-white"
            title="Zerar água de hoje"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>
    </div>
  );
}