import React, { useState } from 'react';
import { Activity, Flame, TrendingUp } from 'lucide-react';

interface BodyRecord {
  date: string;
  weight: number;
  waist?: number;
  body_fat?: number | null;
}

interface Props {
  gender: string;
  age: number;
  height: number;
  history: BodyRecord[];
  totalVolumeKg: number;
  streak: number;
}

export function DynamicAvatar({ gender, age, height, history, totalVolumeKg, streak }: Props) {
  const safeHistory = history.length > 0 ? history : [{ date: 'Hoje', weight: 75, waist: 82 }];
  const [selectedIdx, setSelectedIdx] = useState(safeHistory.length - 1);
  const currentIdx = Math.min(selectedIdx, safeHistory.length - 1);
  const record = safeHistory[currentIdx];

  const hMeters = (height || 175) / 100;
  const imc = record.weight / (hMeters * hMeters);
  const isFemale = gender === 'F';

  // Fatores biométricos para proporção anatômica
  const muscleFactor = Math.min(1.28, 1 + totalVolumeKg / 85000);
  const fatFactor = record.body_fat
    ? Math.max(0.82, Math.min(1.32, record.body_fat / (isFemale ? 22 : 15)))
    : Math.max(0.84, Math.min(1.3, imc / 23.5));

  const shoulderHalf = (isFemale ? 33 : 40) * muscleFactor;
  const chestHalf = (isFemale ? 27 : 33) * muscleFactor;
  const waistHalf = (isFemale ? 20 : 24) * fatFactor;
  const hipHalf = (isFemale ? 29 : 25) * (isFemale ? 1.04 : fatFactor * 0.96);
  const armWidth = (isFemale ? 8.5 : 11) * muscleFactor;
  const thighWidth = (isFemale ? 14.5 : 15.5) * muscleFactor;
  const showAbs = fatFactor < 1.03 || muscleFactor > 1.08;

  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#C8FF00] block">
            AVATAR BIOMÉTRICO 3.0
          </span>
          <strong className="font-poster text-base text-white">
            {isFemale ? 'Atleta Feminino' : 'Atleta Masculino'} • {age} anos • {height} cm
          </strong>
        </div>
        <div className="flex items-center gap-1.5 bg-black border border-[#2A2A2A] px-2.5 py-1 rounded-full text-xs font-bold text-[#C8FF00]">
          <Flame size={13} /> {streak} treinos
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 items-center bg-black border border-[#2A2A2A] rounded-2xl p-3">
        {/* Silhueta Anatômica Paramétrica */}
        <div className="flex justify-center">
          <svg viewBox="0 0 200 310" className="w-40 h-60 drop-shadow-[0_0_16px_rgba(200,255,0,0.18)]">
            <defs>
              <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C8FF00" stopOpacity="0.95" />
                <stop offset="55%" stopColor="#84cc16" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#3f6212" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Aura de energia */}
            <ellipse cx="100" cy="160" rx={shoulderHalf + 24} ry="132" fill="#C8FF00" fillOpacity="0.05" />

            {/* Cabeça e Pescoço */}
            <circle cx="100" cy="30" r="16" fill="url(#bodyGrad)" />
            <rect x="93" y="45" width="14" height="13" rx="5" fill="url(#bodyGrad)" />

            {/* Trapézio e Tronco Anatômico (Ombros -> Peitoral -> Cintura -> Quadril) */}
            <path
              d={`
                M ${100 - 11} 54
                L ${100 - shoulderHalf} 68
                Q ${100 - chestHalf} 102, ${100 - waistHalf} 136
                Q ${100 - hipHalf} 156, ${100 - hipHalf + 3} 172
                L ${100 + hipHalf - 3} 172
                Q ${100 + hipHalf} 156, ${100 + waistHalf} 136
                Q ${100 + chestHalf} 102, ${100 + shoulderHalf} 68
                L ${100 + 11} 54
                Z
              `}
              fill="url(#bodyGrad)"
            />

            {/* Braço Esquerdo */}
            <path
              d={`
                M ${100 - shoulderHalf + 2} 68
                Q ${100 - shoulderHalf - armWidth - 4} 105, ${100 - shoulderHalf - armWidth + 1} 148
                L ${100 - shoulderHalf + 5} 148
                Q ${100 - shoulderHalf + 4} 110, ${100 - chestHalf + 2} 84
                Z
              `}
              fill="url(#bodyGrad)"
            />

            {/* Braço Direito */}
            <path
              d={`
                M ${100 + shoulderHalf - 2} 68
                Q ${100 + shoulderHalf + armWidth + 4} 105, ${100 + shoulderHalf + armWidth - 1} 148
                L ${100 + shoulderHalf - 5} 148
                Q ${100 + shoulderHalf - 4} 110, ${100 + chestHalf - 2} 84
                Z
              `}
              fill="url(#bodyGrad)"
            />

            {/* Perna Esquerda */}
            <path
              d={`
                M ${100 - hipHalf + 3} 170
                L ${100 - 3} 170
                L ${100 - 6} 288
                L ${100 - 6 - thighWidth * 0.72} 288
                Q ${100 - hipHalf - 2} 225, ${100 - hipHalf + 3} 170
                Z
              `}
              fill="url(#bodyGrad)"
            />

            {/* Perna Direita */}
            <path
              d={`
                M ${100 + 3} 170
                L ${100 + hipHalf - 3} 170
                Q ${100 + hipHalf + 2} 225, ${100 + 6 + thighWidth * 0.72} 288
                L ${100 + 6} 288
                Z
              `}
              fill="url(#bodyGrad)"
            />

            {/* Linhas de Definição Muscular (Peitoral e Abdômen) */}
            <path
              d={`M ${100 - chestHalf + 6} 95 Q 100 103, ${100 + chestHalf - 6} 95`}
              stroke="#0A0A0A"
              strokeWidth="2.2"
              fill="none"
              strokeOpacity="0.65"
            />
            <line x1="100" y1="74" x2="100" y2="146" stroke="#0A0A0A" strokeWidth="1.8" strokeOpacity="0.55" />
            {showAbs && (
              <>
                <line x1="91" y1="112" x2="109" y2="112" stroke="#0A0A0A" strokeWidth="1.6" strokeOpacity="0.5" />
                <line x1="91" y1="125" x2="109" y2="125" stroke="#0A0A0A" strokeWidth="1.6" strokeOpacity="0.5" />
                <line x1="92" y1="138" x2="108" y2="138" stroke="#0A0A0A" strokeWidth="1.6" strokeOpacity="0.5" />
              </>
            )}
          </svg>
        </div>

        {/* Métricas Biométricas */}
        <div className="space-y-2.5 text-xs">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-2.5">
            <span className="text-[10px] text-[#A8A8A8] block">PESO ATUAL / DATA</span>
            <strong className="font-poster text-xl text-[#C8FF00]">{record.weight} kg</strong>
            <span className="text-[10px] text-[#A8A8A8] block">{record.date}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-2">
              <span className="text-[10px] text-[#A8A8A8] block">IMC</span>
              <strong className="text-sm text-white">{imc.toFixed(1)}</strong>
            </div>
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-2">
              <span className="text-[10px] text-[#A8A8A8] block">CINTURA / BF</span>
              <strong className="text-sm text-white">
                {record.waist ? `${record.waist}cm` : '--'}
                {record.body_fat ? ` • ${record.body_fat}%` : ''}
              </strong>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-2.5 flex items-center gap-2">
            <TrendingUp size={15} className="text-[#C8FF00] shrink-0" />
            <div>
              <span className="text-[10px] text-[#A8A8A8] block">CARGA ACUMULADA</span>
              <strong className="text-xs text-white">{totalVolumeKg.toLocaleString('pt-BR')} kg</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Linha do Tempo Interativa (Dia 1 -> Hoje) */}
      {safeHistory.length > 1 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] font-bold text-[#A8A8A8]">
            <span>DIA 1 ({safeHistory[0].weight} KG)</span>
            <span className="text-[#C8FF00]">LINHA DO TEMPO ({currentIdx + 1}/{safeHistory.length})</span>
            <span>HOJE ({safeHistory[safeHistory.length - 1].weight} KG)</span>
          </div>
          <input
            type="range"
            min={0}
            max={safeHistory.length - 1}
            value={currentIdx}
            onChange={(e) => setSelectedIdx(Number(e.target.value))}
            className="w-full accent-[#C8FF00] cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}