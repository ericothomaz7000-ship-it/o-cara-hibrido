import React, { useState } from 'react';
import { Dumbbell, X, Info } from 'lucide-react';

interface Props {
  name: string;
  prescription?: string;
}

function getMuscleFocus(exerciseName: string): { group: string; tip: string; zone: 'upper' | 'lower' | 'core' | 'cardio' } {
  const n = exerciseName.toLowerCase();
  if (n.includes('agachamento') || n.includes('leg') || n.includes('perna') || n.includes('flexora') || n.includes('extensora') || n.includes('panturrilha') || n.includes('lunges') || n.includes('wall ball')) {
    return {
      group: 'Membros Inferiores & Glúteos',
      tip: 'Mantenha o abdômen contraído, joelhos alinhados com a ponta dos pés e controle a fase excêntrica.',
      zone: 'lower',
    };
  }
  if (n.includes('corrida') || n.includes('run') || n.includes('ski') || n.includes('remo') || n.includes('bike') || n.includes('esteira')) {
    return {
      group: 'Motor Aeróbio & Hyrox Engine',
      tip: 'Sustente cadência constante, respiração ritmada e postura alta sem tensionar os ombros.',
      zone: 'cardio',
    };
  }
  if (n.includes('prancha') || n.includes('abd') || n.includes('farmer') || n.includes('core')) {
    return {
      group: 'Core & Estabilidade',
      tip: 'Coluna neutra, pelve encaixada e respiração controlada durante toda a sustentação.',
      zone: 'core',
    };
  }
  return {
    group: 'Tronco & Membros Superiores',
    tip: 'Escápulas estabilizadas, amplitude completa de movimento e sem compensar com impulso lombar.',
    zone: 'upper',
  };
}

export function ExerciseThumbnail({ name, prescription }: Props) {
  const [open, setOpen] = useState(false);
  const info = getMuscleFocus(name);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Ver guia de execução"
        className="w-11 h-11 rounded-xl bg-[#141414] border border-[#2A2A2A] hover:border-[#C8FF00] flex items-center justify-center shrink-0 relative overflow-hidden transition"
      >
        <svg viewBox="0 0 40 40" className="w-8 h-8">
          <circle cx="20" cy="7" r="3" fill="#525252" />
          <rect
            x="14"
            y="11"
            width="12"
            height="12"
            rx="3"
            fill={info.zone === 'upper' || info.zone === 'cardio' ? '#C8FF00' : '#404040'}
          />
          <rect
            x="15"
            y="18"
            width="10"
            height="6"
            rx="2"
            fill={info.zone === 'core' ? '#C8FF00' : 'transparent'}
          />
          <rect
            x="14"
            y="24"
            width="5"
            height="12"
            rx="2"
            fill={info.zone === 'lower' || info.zone === 'cardio' ? '#C8FF00' : '#404040'}
          />
          <rect
            x="21"
            y="24"
            width="5"
            height="12"
            rx="2"
            fill={info.zone === 'lower' || info.zone === 'cardio' ? '#C8FF00' : '#404040'}
          />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#C8FF00] block">GUIA TÉCNICO</span>
                <strong className="font-poster text-lg text-white">{name}</strong>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 bg-black rounded-lg text-[#A8A8A8] hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="bg-black border border-[#2A2A2A] rounded-xl p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#C8FF00] font-bold">
                <Dumbbell size={14} /> {info.group}
              </div>
              {prescription && (
                <div className="text-[#A8A8A8]">
                  Prescrição alvo: <strong className="text-white">{prescription}</strong>
                </div>
              )}
              <p className="text-[#D4D4D4] leading-relaxed flex items-start gap-2 pt-1">
                <Info size={14} className="text-[#C8FF00] shrink-0 mt-0.5" />
                <span>{info.tip}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}