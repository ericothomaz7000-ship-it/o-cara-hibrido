import React from 'react';
import { Activity, Flame, Scale } from 'lucide-react';

type BodyEntry = { date: string; weight: number; waist?: number; body_fat?: number };

export function DynamicAvatar({
  gender,
  age,
  height,
  history,
  totalVolumeKg,
  streak,
}: {
  gender: string;
  age: number;
  height: number;
  history: BodyEntry[];
  totalVolumeKg: number;
  streak: number;
}) {
  const latest = history[history.length - 1] || { date: '', weight: 75 };
  const first = history[0] || latest;
  const weightDiff = Number((latest.weight - first.weight).toFixed(1));
  const hMeters = (height || 175) / 100;
  const imc = Number((latest.weight / (hMeters * hMeters)).toFixed(1));

  const shoulderWidth = Math.min(68, Math.max(46, 48 + Math.min(18, Math.floor(totalVolumeKg / 2500))));
  const waistWidth = latest.waist && latest.waist > 0
    ? Math.min(54, Math.max(30, Math.round(latest.waist * 0.48)))
    : Math.min(52, Math.max(32, Math.round(imc * 1.55)));

  const level = totalVolumeKg >= 50000 ? 'ELITE HÍBRIDA' : totalVolumeKg >= 15000 ? 'ATLETA FORJADO' : 'EM CONSTRUÇÃO';

  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold tracking-widest text-[#C8FF00] flex items-center gap-1.5">
          <Activity size={14} /> AVATAR BIOMÉTRICO DINÂMICO
        </span>
        <span className="text-[10px] font-bold bg-[#C8FF00]/15 text-[#C8FF00] px-2.5 py-1 rounded-full">{level}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 items-center bg-black border border-[#2A2A2A] rounded-xl p-3">
        <div className="flex flex-col items-center justify-center py-2">
          <svg width="120" height="165" viewBox="0 0 120 165" className="overflow-visible">
            <circle cx="60" cy="24" r="14" fill="none" stroke="#C8FF00" strokeWidth="2.5" />
            <path
              d={`M ${60 - shoulderWidth / 2} 46 Q 60 40 ${60 + shoulderWidth / 2} 46 L ${60 + waistWidth / 2} 96 L ${60 - waistWidth / 2} 96 Z`}
              fill="rgba(200, 255, 0, 0.14)"
              stroke="#C8FF00"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <line x1={60 - shoulderWidth / 2} y1="48" x2={60 - shoulderWidth / 2 - 12} y2="92" stroke="#C8FF00" strokeWidth="3" strokeLinecap="round" />
            <line x1={60 + shoulderWidth / 2} y1="48" x2={60 + shoulderWidth / 2 + 12} y2="92" stroke="#C8FF00" strokeWidth="3" strokeLinecap="round" />
            <line x1={60 - waistWidth / 3} y1="96" x2={60 - waistWidth / 3 - 4} y2="152" stroke="#C8FF00" strokeWidth="3.5" strokeLinecap="round" />
            <line x1={60 + waistWidth / 3} y1="96" x2={60 + waistWidth / 3 + 4} y2="152" stroke="#C8FF00" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
          <span className="text-[10px] text-[#A8A8A8] mt-1">{gender === 'F' ? 'Feminino' : 'Masculino'} • {age} anos • {height} cm</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-2">
            <span className="text-[10px] text-[#A8A8A8] flex items-center gap-1"><Scale size={11} /> PESO ATUAL</span>
            <strong className="font-poster text-lg text-white">{latest.weight} kg</strong>
            {history.length > 1 && (
              <span className={`block text-[10px] font-bold ${weightDiff <= 0 ? 'text-[#C8FF00]' : 'text-amber-400'}`}>
                {weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg desde o início
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-2">
              <span className="text-[10px] text-[#A8A8A8] block">IMC</span>
              <strong className="font-bold text-white">{imc}</strong>
            </div>
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-2">
              <span className="text-[10px] text-[#A8A8A8] block">{latest.body_fat ? '% BF' : 'CINTURA'}</span>
              <strong className="font-bold text-[#C8FF00]">
                {latest.body_fat ? `${latest.body_fat}%` : latest.waist ? `${latest.waist}cm` : '--'}
              </strong>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-2 flex items-center justify-between">
            <span className="text-[10px] text-[#A8A8A8] flex items-center gap-1"><Flame size={11} className="text-[#C8FF00]" /> VOLUME TOTAL</span>
            <strong className="font-bold text-[#C8FF00]">{(totalVolumeKg / 1000).toFixed(1)} t</strong>
          </div>
        </div>
      </div>
    </div>
  );
}