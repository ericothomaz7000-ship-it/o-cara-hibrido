import React from 'react';
import { Droplets, Plus, CheckCircle2, RotateCcw } from 'lucide-react';

interface Props {
  weightKg: number;
  currentMl: number;
  onChangeMl: (newMl: number) => void;
}

export function WaterSlider({ weightKg, currentMl, onChangeMl }: Props) {
  const safeWeight = weightKg > 0 ? weightKg : 75;
  const goalMl = Math.round((safeWeight * 35) / 50) * 50;
  const pct = Math.min(100, Math.round((currentMl / goalMl) * 100));
  const completed = currentMl >= goalMl;

  return (
    <div className="bg-black border border-[#2A2A2A] rounded-xl p-3.5 space-y-2.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Droplets size={16} className={completed ? 'text-[#C8FF00]' : 'text-sky-400'} />
          <div>
            <span className="block text-xs font-bold tracking-wider text-white">
              HIDRATAÇÃO ({safeWeight} KG × 35ML)
            </span>
            <span className="text-[10px] text-[#A8A8A8]">
              Arraste a barra de volume ou toque nos atalhos
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className={`font-poster text-lg font-bold ${completed ? 'text-[#C8FF00]' : 'text-sky-400'}`}>
            {currentMl} / {goalMl} ml
          </span>
          <span className="block text-[10px] font-bold text-[#A8A8A8]">{pct}% concluído</span>
        </div>
      </div>

      {/* Barra de volume interativa para arrastar com o dedo */}
      <div className="relative h-10 bg-[#141414] border border-[#2A2A2A] rounded-xl overflow-hidden flex items-center select-none">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-150"
          style={{
            width: `${pct}%`,
            background: completed
              ? 'linear-gradient(90deg, #84cc16, #C8FF00)'
              : 'linear-gradient(90deg, #0284c7, #38bdf8)',
          }}
        />
        <input
          type="range"
          min={0}
          max={Math.round(goalMl * 1.25)}
          step={50}
          value={currentMl}
          onChange={(e) => onChangeMl(Number(e.target.value))}
          aria-label="Barra de volume de água"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="relative z-0 w-full px-3 flex justify-between items-center pointer-events-none text-xs font-bold">
          <span className={pct > 45 ? 'text-black' : 'text-white'}>
            {completed ? 'META BATIDA! (+5 PTS BÔNUS)' : 'Arraste para registrar →'}
          </span>
          {completed && <CheckCircle2 size={16} className="text-black" />}
        </div>
      </div>

      <div className="flex gap-1.5">
        {[250, 500, 750].map((add) => (
          <button
            key={add}
            type="button"
            onClick={() => onChangeMl(currentMl + add)}
            className="flex-1 bg-[#141414] hover:border-sky-400 border border-[#2A2A2A] rounded-lg py-1.5 text-xs font-bold text-sky-400 flex items-center justify-center gap-1 active:scale-95 transition"
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