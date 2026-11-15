import React, { useState } from 'react';
import { Dumbbell, Flame, Footprints, X } from 'lucide-react';

export function ExerciseThumbnail({ name, prescription }: { name: string; prescription?: string }) {
  const [open, setOpen] = useState(false);
  const lower = name.toLowerCase();

  const isRun = lower.includes('corrida') || lower.includes('tiros') || lower.includes('longão') || lower.includes('fartlek') || lower.includes('tempo run');
  const isHyrox = lower.includes('ski') || lower.includes('remo') || lower.includes('sled') || lower.includes('burpee') || lower.includes('farmer') || lower.includes('sandbag') || lower.includes('wall ball') || lower.includes('bike') || lower.includes('kettlebell') || lower.includes('box');

  const category = isRun ? 'Corrida & Cadência' : isHyrox ? 'Estação Hyrox / Metabólico' : 'Força & Hipertrofia';
  const tip = isRun
    ? 'Mantém a postura alinhada, cadência fluida e controlo respiratório conforme a zona alvo.'
    : isHyrox
    ? 'Foca na transição rápida, respiração ritmada e economia de energia sem quebrar a técnica.'
    : 'Controla a fase excêntrica (descida) em 2 segundos, mantém o core firme e amplitude completa.';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-10 h-10 rounded-xl bg-[#141414] border border-[#2A2A2A] hover:border-[#C8FF00] flex items-center justify-center shrink-0 text-[#C8FF00] transition"
        title="Ver guia técnico"
      >
        {isRun ? <Footprints size={18} /> : isHyrox ? <Flame size={18} /> : <Dumbbell size={18} />}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-[#141414] border border-[#C8FF00] rounded-2xl p-5 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#C8FF00]">{category.toUpperCase()}</span>
                <h3 className="font-poster text-xl font-bold text-white">{name}</h3>
                {prescription && <span className="text-xs text-[#A8A8A8]">Prescrição: {prescription}</span>}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-[#A8A8A8] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="bg-black border border-[#2A2A2A] rounded-xl p-3 text-xs text-[#D4D4D4] leading-relaxed">
              <strong className="text-[#C8FF00] block mb-1">EXECUÇÃO TÉCNICA:</strong>
              {tip}
            </div>
          </div>
        </div>
      )}
    </>
  );
}