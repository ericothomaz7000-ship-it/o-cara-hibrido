import React, { useEffect, useMemo, useState } from 'react';
import {
  Trophy, Users, Plus, Lock, LogOut, Dumbbell, Footprints,
  Flame, Target, Moon, Activity, ChevronLeft, ChevronRight, X, Pencil,
  Trash2, Save, Gauge, Upload, Search, Sparkles, Check
} from 'lucide-react';
import { supabase } from './supabase';

// ================= TIPOS =================
type User = { id: string; name: string; nickname: string; objective: string; plan: string; password: string };
type WorkoutSet = { kg: string; reps: string; rir: string };
type WorkoutEx = { name: string; prescription: string; category?: string; sets: WorkoutSet[]; done: boolean };
type Workout = {
  id: string; userId: string; date: string; plan: string; dayLabel: string;
  title: string; exercises: WorkoutEx[]; volume: number; notes: string; prs: string[]; points: number;
};
type Run = {
  id: string; userId: string; date: string; type: string; distance: number;
  duration: number; pace: number; hr: string; rpe: number; notes: string;
};
type Checkin = {
  id: string; userId: string; date: string; sleep: number; mood: number;
  soreness: number; readiness: number; note: string;
};
type Goal = {
  id: string; userId: string; type: string; title: string; current: number;
  target: number; deadline: string; exercise: string;
};
type Body = { id: string; userId: string; date: string; weight: number; waist: number };
type CustomPlan = {
  id: string; userId: string; title: string; category: string;
  exercises: { name: string; prescription: string; category: string }[];
};

// ================= CATÁLOGO UNIVERSAL (MUSCULAÇÃO, HYROX E CORRIDA) =================
const CATALOG: Record<string, string[]> = {
  Musculação: [
    'Supino reto com barra', 'Supino inclinado com halteres', 'Supino declinado', 'Supino máquina articulada',
    'Crucifixo na máquina (Peck Deck)', 'Crossover na polia alta', 'Flexão de braços',
    'Puxada alta pela frente', 'Puxada frontal pegada neutra', 'Remada curvada com barra',
    'Remada na máquina articulada', 'Remada unilateral com halter (Serrote)', 'Remada baixa no triângulo',
    'Pulldown com braços estendidos', 'Barra fixa (Pull-up)', 'Face pull na polia',
    'Agachamento livre com barra', 'Agachamento no Smith', 'Agachamento frontal', 'Agachamento búlgaro',
    'Leg press 45°', 'Leg press horizontal', 'Hack squat (Agachamento Hack)', 'Cadeira extensora',
    'Cadeira extensora unilateral', 'Avanço / Passada com halteres',
    'Mesa flexora', 'Cadeira flexora', 'Flexora em pé unilateral', 'Stiff com barra', 'Stiff com halteres',
    'Levantamento terra convencional', 'Levantamento terra sumô', 'Elevação pélvica (Hip Thrust)',
    'Elevação pélvica na máquina', 'Cadeira abdutora', 'Cadeira adutora', 'Coice na polia',
    'Panturrilha em pé na máquina', 'Panturrilha sentada', 'Panturrilha no leg press',
    'Desenvolvimento com halteres', 'Desenvolvimento com barra (Militar)', 'Desenvolvimento na máquina',
    'Elevação lateral com halteres', 'Elevação lateral na polia', 'Elevação frontal', 'Crucifixo inverso na máquina',
    'Rosca direta com barra W', 'Rosca direta com barra reta', 'Rosca alternada com halteres',
    'Rosca martelo', 'Rosca Scott na máquina', 'Rosca concentrada',
    'Tríceps na polia com corda', 'Tríceps na polia com barra reta', 'Tríceps francês na polia',
    'Tríceps testa com barra W', 'Tríceps mergulho nas paralelas', 'Tríceps máquina',
    'Prancha abdominal', 'Abdominal infra na paralela', 'Abdominal crunch na polia', 'Dead bug', 'Roda abdominal'
  ],
  Hyrox: [
    'SkiErg (1000m / Intervalos)', 'Remo / RowErg (1000m / Intervalos)', 'Sled Push (Empurrar trenó)',
    'Sled Pull (Puxar trenó)', 'Burpee Broad Jumps', 'Farmers Carry (Caminhada do fazendeiro)',
    'Sandbag Lunges (Passada com saco)', 'Wall Balls (Arremesso na bola)', 'Assault Bike / Echo Bike',
    'Kettlebell Swings', 'Box Jumps (Salto na caixa)', 'Thrusters com halteres/barra',
    'Devil Press com halteres', 'Bear Crawl (Caminhada do urso)', 'Battle Rope (Corda naval)'
  ],
  Corrida: [
    'Corrida Leve / Rodagem Z2', 'Corrida Regenerativa', 'Corrida Intervalada (Tiros 400m/800m/1km)',
    'Tempo Run (Ritmo de limiar)', 'Fartlek (Variação de ritmo)', 'Longão de Fim de Semana',
    'Corrida na Esteira Inclinada', 'Simulado Compromised Running (Pós-força)'
  ]
};

// ================= 6 PLANOS PRONTOS =================
const PLANS: Record<string, { label: string; days: { day: string; title: string; note: string; exercises: { name: string; prescription: string; category?: string }[] }[] }> = {
  'Plano ABCDE 5 dias': {
    label: '1. ABCDE (5 DIAS)',
    days: [
      { day: 'Segunda', title: 'A. Peito e Costas', note: 'Treino principal de superiores.', exercises: [{ name: 'Supino reto com barra', prescription: '3 x 6 a 8' }, { name: 'Puxada alta pela frente', prescription: '3 x 8 a 12' }, { name: 'Supino inclinado com halteres', prescription: '3 x 8 a 12' }, { name: 'Remada na máquina articulada', prescription: '3 x 8 a 12' }, { name: 'Crucifixo na máquina (Peck Deck)', prescription: '2 x 12 a 15' }, { name: 'Remada unilateral com halter (Serrote)', prescription: '2 x 10 a 12' }] },
      { day: 'Terça', title: 'B. Quadríceps', note: 'Base de pernas com foco em quadríceps.', exercises: [{ name: 'Agachamento livre com barra', prescription: '3 x 6 a 10' }, { name: 'Leg press 45°', prescription: '3 x 10 a 12' }, { name: 'Avanço / Passada com halteres', prescription: '2 x 10 a 12 por perna' }, { name: 'Cadeira extensora', prescription: '2 x 12 a 15' }] },
      { day: 'Quarta', title: 'C. Ombros e Braços', note: 'Volume controlado para ombros e braços.', exercises: [{ name: 'Desenvolvimento com halteres', prescription: '3 x 8 a 10' }, { name: 'Elevação lateral com halteres', prescription: '3 x 12 a 15' }, { name: 'Crucifixo inverso na máquina', prescription: '2 x 12 a 15' }, { name: 'Rosca direta com barra W', prescription: '3 x 8 a 12' }, { name: 'Rosca martelo', prescription: '2 x 10 a 12' }, { name: 'Tríceps na polia com corda', prescription: '3 x 10 a 12' }, { name: 'Tríceps francês na polia', prescription: '2 x 10 a 12' }] },
      { day: 'Quinta', title: 'Corrida', note: 'Corrida conforme planejamento.', exercises: [] },
      { day: 'Sexta', title: 'D. Posterior, Glúteos e Panturrilhas', note: 'Posterior completo e panturrilhas.', exercises: [{ name: 'Mesa flexora', prescription: '3 x 10 a 12' }, { name: 'Stiff com halteres', prescription: '3 x 8 a 10' }, { name: 'Cadeira flexora', prescription: '2 x 12 a 15' }, { name: 'Elevação pélvica (Hip Thrust)', prescription: '3 x 8 a 12' }, { name: 'Cadeira abdutora', prescription: '2 x 12 a 15' }, { name: 'Panturrilha em pé na máquina', prescription: '3 x 10 a 15' }, { name: 'Panturrilha sentada', prescription: '2 x 12 a 20' }] },
      { day: 'Sábado', title: 'E. Superiores Completo', note: 'Sessão compacta de superiores.', exercises: [{ name: 'Supino máquina articulada', prescription: '2 x 10 a 12' }, { name: 'Puxada frontal pegada neutra', prescription: '2 x 10 a 12' }, { name: 'Elevação lateral na polia', prescription: '2 x 12 a 15' }, { name: 'Face pull na polia', prescription: '2 x 12 a 15' }, { name: 'Rosca alternada com halteres', prescription: '2 x 10 a 12' }, { name: 'Tríceps na polia com corda', prescription: '2 x 10 a 12' }] },
      { day: 'Domingo', title: 'Corrida', note: 'Corrida conforme planejamento.', exercises: [] },
    ],
  },
  'Plano Híbrido 4 dias': {
    label: '2. HÍBRIDO (4 DIAS)',
    days: [
      { day: 'Segunda', title: 'A. Peito, Ombros e Tríceps', note: 'Empurrar com volume distribuído.', exercises: [{ name: 'Supino inclinado com halteres', prescription: '3 x 10 a 12' }, { name: 'Tríceps na polia com corda', prescription: '3 x 12' }, { name: 'Crucifixo na máquina (Peck Deck)', prescription: '3 x 12' }, { name: 'Elevação lateral com halteres', prescription: '3 x 12 a 15' }, { name: 'Supino máquina articulada', prescription: '3 x 10 a 12' }, { name: 'Tríceps francês na polia', prescription: '3 x 12' }] },
      { day: 'Terça', title: 'B. Quadríceps, Glúteos e Panturrilhas', note: 'Pernas com ênfase em base e glúteos.', exercises: [{ name: 'Cadeira extensora', prescription: '3 x 12 a 15' }, { name: 'Panturrilha sentada', prescription: '3 x 15 a 20' }, { name: 'Leg press 45°', prescription: '3 x 12' }, { name: 'Cadeira flexora', prescription: '3 x 12' }, { name: 'Elevação pélvica na máquina', prescription: '3 x 12' }, { name: 'Coice na polia', prescription: '2 x 12 cada perna' }] },
      { day: 'Quarta', title: 'Recuperação ou atividade leve', note: 'Dia leve. Priorize sono e movimento fácil.', exercises: [] },
      { day: 'Quinta', title: 'C. Costas, Bíceps e Abdômen', note: 'Puxar com controle e abdômen no fim.', exercises: [{ name: 'Puxada frontal pegada neutra', prescription: '3 x 10 a 12' }, { name: 'Rosca direta com barra W', prescription: '3 x 10 a 12' }, { name: 'Remada na máquina articulada', prescription: '3 x 10 a 12' }, { name: 'Rosca martelo', prescription: '3 x 12' }, { name: 'Pulldown com braços estendidos', prescription: '3 x 12' }, { name: 'Dead bug', prescription: '2 x 10 cada lado' }, { name: 'Prancha abdominal', prescription: '2 x 30s' }] },
      { day: 'Sexta', title: 'D. Posteriores, Glúteos e Braços', note: 'Posterior, braços e panturrilha.', exercises: [{ name: 'Mesa flexora', prescription: '3 x 12' }, { name: 'Rosca alternada com halteres', prescription: '3 x 12' }, { name: 'Cadeira extensora', prescription: '3 x 12' }, { name: 'Tríceps na polia com barra reta', prescription: '3 x 12' }, { name: 'Panturrilha sentada', prescription: '3 x 15' }] },
      { day: 'Sábado', title: 'Corrida Longa / Condicionamento', note: 'Fôlego e resistência aeróbica.', exercises: [] },
      { day: 'Domingo', title: 'Recuperação ativa', note: 'Mobilidade e descanso.', exercises: [] },
    ],
  },
  'Plano Upper / Lower 4 dias': {
    label: '3. UPPER / LOWER (4 DIAS)',
    days: [
      { day: 'Segunda', title: 'Upper A (Força Superiores)', note: 'Cargas principais para tronco.', exercises: [{ name: 'Supino reto com barra', prescription: '4 x 6 a 8' }, { name: 'Remada curvada com barra', prescription: '4 x 6 a 8' }, { name: 'Desenvolvimento com halteres', prescription: '3 x 8 a 10' }, { name: 'Puxada alta pela frente', prescription: '3 x 8 a 10' }, { name: 'Tríceps na polia com corda', prescription: '3 x 10 a 12' }, { name: 'Rosca direta com barra W', prescription: '3 x 10 a 12' }] },
      { day: 'Terça', title: 'Lower A (Força Inferiores)', note: 'Base de força para corrida e estabilidade.', exercises: [{ name: 'Agachamento livre com barra', prescription: '4 x 6 a 8' }, { name: 'Stiff com barra', prescription: '3 x 8 a 10' }, { name: 'Leg press 45°', prescription: '3 x 10 a 12' }, { name: 'Mesa flexora', prescription: '3 x 10 a 12' }, { name: 'Panturrilha em pé na máquina', prescription: '4 x 12 a 15' }] },
      { day: 'Quarta', title: 'Corrida Intervalada / Tiros', note: 'Sessão de velocidade e VO2.', exercises: [] },
      { day: 'Quinta', title: 'Upper B (Hipertrofia e Postura)', note: 'Volume controlado sem fadiga excessiva.', exercises: [{ name: 'Supino inclinado com halteres', prescription: '3 x 8 a 12' }, { name: 'Remada na máquina articulada', prescription: '3 x 8 a 12' }, { name: 'Elevação lateral com halteres', prescription: '4 x 12 a 15' }, { name: 'Face pull na polia', prescription: '3 x 12 a 15' }, { name: 'Rosca martelo', prescription: '3 x 10 a 12' }, { name: 'Tríceps francês na polia', prescription: '3 x 10 a 12' }] },
      { day: 'Sexta', title: 'Lower B (Unilateral e Potência)', note: 'Prevenção de lesões para corredores.', exercises: [{ name: 'Levantamento terra convencional', prescription: '3 x 5 a 6' }, { name: 'Agachamento búlgaro', prescription: '3 x 8 a 10 cada' }, { name: 'Cadeira extensora', prescription: '3 x 12 a 15' }, { name: 'Cadeira flexora', prescription: '3 x 12 a 15' }, { name: 'Prancha abdominal', prescription: '3 x 40s' }] },
      { day: 'Sábado', title: 'Corrida Longão Z2', note: 'Rodagem contínua em zona aeróbica.', exercises: [] },
      { day: 'Domingo', title: 'Descanso Total', note: 'Recuperação estrutural.', exercises: [] },
    ],
  },
  'Plano Full Body 3 dias': {
    label: '4. FULL BODY (3 DIAS)',
    days: [
      { day: 'Segunda', title: 'Full Body A (Força Base)', note: 'Ideal para quem prioriza corrida na semana.', exercises: [{ name: 'Agachamento livre com barra', prescription: '3 x 6 a 8' }, { name: 'Supino reto com barra', prescription: '3 x 6 a 8' }, { name: 'Puxada alta pela frente', prescription: '3 x 8 a 10' }, { name: 'Mesa flexora', prescription: '3 x 10 a 12' }, { name: 'Elevação lateral com halteres', prescription: '3 x 12 a 15' }] },
      { day: 'Terça', title: 'Corrida Intervalada / Tempo Run', note: 'Treino chave de corrida.', exercises: [] },
      { day: 'Quarta', title: 'Full Body B (Posterior e Empurrar)', note: 'Equilíbrio de cadeia posterior.', exercises: [{ name: 'Levantamento terra convencional', prescription: '3 x 5' }, { name: 'Desenvolvimento com halteres', prescription: '3 x 8 a 10' }, { name: 'Remada na máquina articulada', prescription: '3 x 10 a 12' }, { name: 'Leg press 45°', prescription: '3 x 10 a 12' }, { name: 'Prancha abdominal', prescription: '3 x 45s' }] },
      { day: 'Quinta', title: 'Corrida Leve Z2', note: 'Rodagem regenerativa.', exercises: [] },
      { day: 'Sexta', title: 'Full Body C (Unilateral e Braços)', note: 'Estabilidade e acabamento.', exercises: [{ name: 'Agachamento búlgaro', prescription: '3 x 8 a 10' }, { name: 'Supino inclinado com halteres', prescription: '3 x 8 a 12' }, { name: 'Remada unilateral com halter (Serrote)', prescription: '3 x 10 a 12' }, { name: 'Rosca direta com barra W', prescription: '3 x 10 a 12' }, { name: 'Tríceps na polia com corda', prescription: '3 x 10 a 12' }] },
      { day: 'Sábado', title: 'Longão de Corrida', note: 'Volume aeróbico da semana.', exercises: [] },
      { day: 'Domingo', title: 'Descanso', note: 'Sono e recuperação.', exercises: [] },
    ],
  },
  'Plano Push / Pull / Legs': {
    label: '5. PUSH / PULL / LEGS',
    days: [
      { day: 'Segunda', title: 'Push (Peito, Ombros e Tríceps)', note: 'Foco em empurrar com carga.', exercises: [{ name: 'Supino reto com barra', prescription: '4 x 6 a 8' }, { name: 'Supino inclinado com halteres', prescription: '3 x 8 a 12' }, { name: 'Desenvolvimento com halteres', prescription: '3 x 8 a 10' }, { name: 'Elevação lateral com halteres', prescription: '4 x 12 a 15' }, { name: 'Tríceps na polia com corda', prescription: '3 x 10 a 12' }] },
      { day: 'Terça', title: 'Pull (Costas, Posterior Ombro e Bíceps)', note: 'Foco em puxar e densidade.', exercises: [{ name: 'Puxada alta pela frente', prescription: '4 x 8 a 10' }, { name: 'Remada curvada com barra', prescription: '3 x 8 a 10' }, { name: 'Remada baixa no triângulo', prescription: '3 x 10 a 12' }, { name: 'Face pull na polia', prescription: '3 x 12 a 15' }, { name: 'Rosca direta com barra W', prescription: '3 x 10 a 12' }, { name: 'Rosca martelo', prescription: '2 x 12' }] },
      { day: 'Quarta', title: 'Legs (Pernas Completo)', note: 'Força e resistência de membros inferiores.', exercises: [{ name: 'Agachamento livre com barra', prescription: '4 x 6 a 8' }, { name: 'Leg press 45°', prescription: '3 x 10 a 12' }, { name: 'Stiff com halteres', prescription: '3 x 8 a 10' }, { name: 'Mesa flexora', prescription: '3 x 10 a 12' }, { name: 'Panturrilha em pé na máquina', prescription: '4 x 12 a 15' }] },
      { day: 'Quinta', title: 'Corrida Ritmo / Tempo Run', note: 'Sustentação de ritmo.', exercises: [] },
      { day: 'Sexta', title: 'Upper Híbrido (Superiores Completo)', note: 'Sessão de manutenção superior.', exercises: [{ name: 'Supino máquina articulada', prescription: '3 x 10 a 12' }, { name: 'Puxada frontal pegada neutra', prescription: '3 x 10 a 12' }, { name: 'Elevação lateral na polia', prescription: '3 x 12 a 15' }, { name: 'Rosca alternada com halteres', prescription: '3 x 10 a 12' }, { name: 'Tríceps francês na polia', prescription: '3 x 10 a 12' }] },
      { day: 'Sábado', title: 'Corrida Longão', note: 'Construção de base aeróbica.', exercises: [] },
      { day: 'Domingo', title: 'Descanso', note: 'Recuperação.', exercises: [] },
    ],
  },
  'Plano Híbrido & Hyrox': {
    label: '6. HÍBRIDO & HYROX',
    days: [
      { day: 'Segunda', title: 'Força Estrutural + Ergômetros', note: 'Força pesada combinada com motor aeróbico.', exercises: [{ name: 'Agachamento livre com barra', prescription: '4 x 6' }, { name: 'Supino reto com barra', prescription: '4 x 6' }, { name: 'SkiErg (1000m / Intervalos)', prescription: '4 x 500m', category: 'Hyrox' }, { name: 'Farmers Carry (Caminhada do fazendeiro)', prescription: '4 x 40m', category: 'Hyrox' }] },
      { day: 'Terça', title: 'Corrida Intervalada (VO2)', note: 'Tiros na pista ou esteira.', exercises: [] },
      { day: 'Quarta', title: 'Motor Hyrox & Core', note: 'Estações oficiais de competição híbrida.', exercises: [{ name: 'Sled Push (Empurrar trenó)', prescription: '4 x 25m', category: 'Hyrox' }, { name: 'Sled Pull (Puxar trenó)', prescription: '4 x 25m', category: 'Hyrox' }, { name: 'Remo / RowErg (1000m / Intervalos)', prescription: '3 x 500m', category: 'Hyrox' }, { name: 'Wall Balls (Arremesso na bola)', prescription: '4 x 20 reps', category: 'Hyrox' }, { name: 'Prancha abdominal', prescription: '3 x 45s' }] },
      { day: 'Quinta', title: 'Corrida Regenerativa Z2', note: 'Baixa frequência cardíaca.', exercises: [] },
      { day: 'Sexta', title: 'Superiores & Resistência Muscular', note: 'Puxar, empurrar e resistência sob fadiga.', exercises: [{ name: 'Puxada alta pela frente', prescription: '3 x 10' }, { name: 'Desenvolvimento com halteres', prescription: '3 x 10' }, { name: 'Burpee Broad Jumps', prescription: '4 x 15m', category: 'Hyrox' }, { name: 'Sandbag Lunges (Passada com saco)', prescription: '4 x 20m', category: 'Hyrox' }] },
      { day: 'Sábado', title: 'Simulado Compromised Run', note: 'Corrida longa ou corrida intercalada com estação.', exercises: [] },
      { day: 'Domingo', title: 'Descanso Total', note: 'Recuperação plena.', exercises: [] },
    ],
  },
};

const RUN_TYPES = ['Rua', 'Esteira', 'Intervalado', 'Longão', 'Regenerativo', 'Leve'];

// ================= FUNÇÕES AUXILIARES =================
const parseNum = (v: any): number => {
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (!v) return 0;
  const cleaned = String(v).replace(',', '.').replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

const fmtDate = (d: string) => {
  if (!d || !d.includes('-')) return d || '';
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const addDays = (d: string, n: number) => {
  const x = new Date(d + 'T12:00:00');
  x.setDate(x.getDate() + n);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

const mondayOf = (d: string) => {
  const x = new Date(d + 'T12:00:00');
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

const parseSets = (p: string) => {
  const n = parseInt(p.split('x')[0]) || 3;
  return Math.max(1, Math.min(5, n));
};

// Parser de GPX / TCX (Relógios e Strava)
function parseGpxOrTcx(xmlText: string): { distanceKm: number; durationMin: number; date: string; avgHr: string } | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const times: number[] = [];
    doc.querySelectorAll('time, Time').forEach((el) => {
      const t = Date.parse(el.textContent || '');
      if (!isNaN(t)) times.push(t);
    });
    const date = times.length > 0 ? new Date(times[0]).toISOString().slice(0, 10) : todayStr();
    const durationMin = times.length >= 2 ? Math.max(1, Math.round((times[times.length - 1] - times[0]) / 60000)) : 0;

    // Tenta distância direta no TCX
    let distMeters = 0;
    doc.querySelectorAll('DistanceMeters').forEach((el) => {
      const val = parseFloat(el.textContent || '0');
      if (val > distMeters) distMeters = val;
    });

    // Se não achou DistanceMeters, calcula via coordenadas GPS (Haversine) no GPX
    if (distMeters === 0) {
      const pts = Array.from(doc.querySelectorAll('trkpt'));
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      for (let i = 1; i < pts.length; i++) {
        const lat1 = parseFloat(pts[i - 1].getAttribute('lat') || '0');
        const lon1 = parseFloat(pts[i - 1].getAttribute('lon') || '0');
        const lat2 = parseFloat(pts[i].getAttribute('lat') || '0');
        const lon2 = parseFloat(pts[i].getAttribute('lon') || '0');
        const R = 6371000;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        distMeters += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }
    }

    // Frequência cardíaca média
    const hrs: number[] = [];
    doc.querySelectorAll('hr, Value').forEach((el) => {
      const h = parseInt(el.textContent || '0');
      if (h > 40 && h < 230) hrs.push(h);
    });
    const avgHr = hrs.length ? String(Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length)) : '';

    if (distMeters === 0 && durationMin === 0) return null;
    return {
      distanceKm: Number((distMeters / 1000).toFixed(2)),
      durationMin: durationMin || 30,
      date,
      avgHr,
    };
  } catch {
    return null;
  }
}

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bodies, setBodies] = useState<Body[]>([]);
  const [customPlans, setCustomPlans] = useState<CustomPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [currentId, setCurrentId] = useState<string | null>(() => localStorage.getItem('ch_session_id'));
  const [tab, setTab] = useState('HOJE');

  // Modais e estados de usuário
  const [publicUser, setPublicUser] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loginFor, setLoginFor] = useState<User | null>(null);
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editPass, setEditPass] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deletePass, setDeletePass] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  // Calendário e Treino
  const [calMonth, setCalMonth] = useState(() => todayStr().slice(0, 7));
  const [selectedDay, setSelectedDay] = useState(todayStr());
  const [workoutDraft, setWorkoutDraft] = useState<{
    dayLabel: string; title: string; exercises: WorkoutEx[]; date: string; notes: string;
  } | null>(null);
  const [workoutResult, setWorkoutResult] = useState<{ volume: number; prs: string[]; points: number } | null>(null);

  // Criador de Treinos Personalizados
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderCat, setBuilderCat] = useState<'Musculação' | 'Hyrox' | 'Corrida'>('Musculação');
  const [builderSearch, setBuilderSearch] = useState('');
  const [customExName, setCustomExName] = useState('');
  const [customExPresc, setCustomExPresc] = useState('3 x 10 a 12');
  const [builderItems, setBuilderItems] = useState<{ name: string; prescription: string; category: string }[]>([]);

  // Formulários
  const [runForm, setRunForm] = useState({ date: todayStr(), type: 'Rua', distance: '5', duration: '30', hr: '', rpe: '6', notes: '' });
  const [editingRun, setEditingRun] = useState<Run | null>(null);
  const [checkinForm, setCheckinForm] = useState({ sleep: '7.5', mood: '8', soreness: '3', readiness: '8', note: '' });
  const [goalForm, setGoalForm] = useState({ type: 'Corrida distância', title: '', current: '0', target: '10', deadline: todayStr(), exercise: '' });
  const [bodyForm, setBodyForm] = useState({ weight: '', waist: '', date: todayStr() });
  const [selectedExercise, setSelectedExercise] = useState('Supino reto com barra');
  const [planFilter, setPlanFilter] = useState('Plano ABCDE 5 dias');
  const [form, setForm] = useState({ name: '', nickname: '', objective: 'Hipertrofia', plan: 'Plano ABCDE 5 dias', password: '', confirm: '' });

  // ================= CARREGAMENTO SUPABASE =================
  async function reloadRecords() {
    const [u, w, r, c, g, b, cp] = await Promise.all([
      supabase.from('ch_users').select('*').order('created_at', { ascending: true }),
      supabase.from('ch_workouts').select('*').order('date', { ascending: false }),
      supabase.from('ch_runs').select('*').order('date', { ascending: false }),
      supabase.from('ch_checkins').select('*').order('date', { ascending: false }),
      supabase.from('ch_goals').select('*').order('created_at', { ascending: false }),
      supabase.from('ch_body').select('*').order('date', { ascending: true }),
      supabase.from('ch_custom_plans').select('*').order('created_at', { ascending: false }),
    ]);

    if (u.error) throw new Error(u.error.message);

    setUsers(u.data || []);
    setWorkouts((w.data || []).map((x: any) => ({
      id: x.id, userId: x.user_id, date: x.date, plan: x.plan, dayLabel: x.day_label,
      title: x.title, exercises: x.exercises || [], volume: Number(x.volume || 0),
      notes: x.notes || '', prs: x.prs || [], points: Number(x.points || 100),
    })));
    setRuns((r.data || []).map((x: any) => ({
      id: x.id, userId: x.user_id, date: x.date, type: x.type,
      distance: Number(x.distance), duration: Number(x.duration), pace: Number(x.pace),
      hr: x.hr || '', rpe: Number(x.rpe || 6), notes: x.notes || '',
    })));
    setCheckins((c.data || []).map((x: any) => ({
      id: x.id, userId: x.user_id, date: x.date, sleep: Number(x.sleep),
      mood: Number(x.mood), soreness: Number(x.soreness), readiness: Number(x.readiness), note: x.note || '',
    })));
    setGoals((g.data || []).map((x: any) => ({
      id: x.id, userId: x.user_id, type: x.type, title: x.title,
      current: Number(x.current), target: Number(x.target), deadline: x.deadline, exercise: x.exercise || '',
    })));
    setBodies((b.data || []).map((x: any) => ({
      id: x.id, userId: x.user_id, date: x.date, weight: Number(x.weight), waist: Number(x.waist || 0),
    })));
    setCustomPlans((cp.data || []).map((x: any) => ({
      id: x.id, userId: x.user_id, title: x.title, category: x.category, exercises: x.exercises || [],
    })));
  }

  useEffect(() => {
    reloadRecords()
      .then(() => setLoading(false))
      .catch((e) => {
        setLoadError(e.message || 'Erro ao conectar com o banco na nuvem.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (currentId) localStorage.setItem('ch_session_id', currentId);
    else localStorage.removeItem('ch_session_id');
  }, [currentId]);

  const current = users.find((u) => u.id === currentId) || null;
  const myWorkouts = useMemo(() => workouts.filter((w) => w.userId === currentId), [workouts, currentId]);
  const myRuns = useMemo(() => runs.filter((r) => r.userId === currentId), [runs, currentId]);
  const myCheckins = useMemo(() => checkins.filter((c) => c.userId === currentId), [checkins, currentId]);
  const myGoals = useMemo(() => goals.filter((g) => g.userId === currentId), [goals, currentId]);
  const myBodies = useMemo(() => bodies.filter((b) => b.userId === currentId), [bodies, currentId]);
  const myCustomPlans = useMemo(() => customPlans.filter((p) => p.userId === currentId), [customPlans, currentId]);

  // Volume calculado AO VIVO durante a digitação do treino
  const liveVolume = useMemo(() => {
    if (!workoutDraft) return 0;
    return workoutDraft.exercises.reduce((sum, ex) => {
      return sum + ex.sets.reduce((sSum, s) => sSum + parseNum(s.kg) * parseNum(s.reps), 0);
    }, 0);
  }, [workoutDraft]);

  // ================= PONTUAÇÃO & RANKING =================
  function streakFor(userId: string) {
    const dates = new Set([
      ...workouts.filter((w) => w.userId === userId).map((x) => x.date),
      ...runs.filter((r) => r.userId === userId).map((x) => x.date),
    ]);
    let s = 0;
    let d = todayStr();
    if (!dates.has(d)) d = addDays(d, -1);
    while (dates.has(d)) {
      s++;
      d = addDays(d, -1);
    }
    return s;
  }

  function pointsFor(userId: string) {
    const ws = workouts.filter((w) => w.userId === userId);
    const rs = runs.filter((r) => r.userId === userId);
    const cs = checkins.filter((c) => c.userId === userId);
    const gs = goals.filter((g) => g.userId === userId);

    const musc = ws.reduce((s, w) => s + w.points, 0);
    let runPts = rs.reduce(
      (s, r) => s + (100 + Math.round(r.distance * 10) + (r.type === 'Longão' && r.distance > 10 ? 50 : 0)),
      0
    );

    const sortedRuns = [...rs].sort((a, b) => a.date.localeCompare(b.date));
    sortedRuns.forEach((r, i) => {
      if (i > 0 && r.distance > Math.max(...sortedRuns.slice(0, i).map((x) => x.distance))) runPts += 30;
      if (i >= 3) {
        const avgPrev3 = sortedRuns.slice(i - 3, i).reduce((sum, x) => sum + x.pace, 0) / 3;
        if (r.pace > 0 && r.pace < avgPrev3) runPts += 30;
      }
    });

    const completedGoals = gs.filter((g) => goalProgressForUser(g, userId) >= 100).length;
    const prog = cs.length * 10 + completedGoals * 200;

    const byWeek: Record<string, number> = {};
    [...ws, ...rs].forEach((x) => {
      const k = mondayOf(x.date);
      byWeek[k] = (byWeek[k] || 0) + 1;
    });
    const weekly = Object.values(byWeek).filter((n) => n >= 3).length * 100;
    const streak = streakFor(userId);
    const streakBonus = streak >= 7 ? 100 : 0;

    return { total: musc + runPts + prog + weekly + streakBonus, musc, run: runPts, prog, trainings: ws.length + rs.length, weekly, streak };
  }

  function goalProgressForUser(g: Goal, uid: string) {
    if (g.type === 'Força carga em exercício' && g.exercise) {
      const max = Math.max(
        0,
        ...workouts.filter((w) => w.userId === uid).flatMap((w) =>
          w.exercises.filter((e) => e.name.toLowerCase() === g.exercise.toLowerCase()).flatMap((e) => e.sets.map((s) => parseNum(s.kg)))
        )
      );
      const val = Math.max(max, g.current);
      return Math.min(100, g.target ? (val / g.target) * 100 : 0);
    }
    if (g.type === 'Corrida distância') {
      const total = runs.filter((r) => r.userId === uid).reduce((s, r) => s + r.distance, 0);
      const val = Math.max(total, g.current);
      return Math.min(100, g.target ? (val / g.target) * 100 : 0);
    }
    if (g.type === 'Peso corporal') {
      const userBodies = bodies.filter((b) => b.userId === uid);
      const latest = userBodies.length ? userBodies[userBodies.length - 1].weight : g.current;
      const start = g.current || latest;
      if (start === g.target) return 100;
      const progress = ((start - latest) / (start - g.target)) * 100;
      return Math.max(0, Math.min(100, progress));
    }
    return Math.min(100, g.target ? (g.current / g.target) * 100 : 0);
  }

  const ranking = useMemo(
    () => users.map((u) => ({ ...u, ...pointsFor(u.id) })).sort((a, b) => b.total - a.total || a.nickname.localeCompare(b.nickname)),
    [users, workouts, runs, checkins, goals, bodies]
  );
  const myRank = ranking.findIndex((u) => u.id === currentId) + 1;
  const myPoints = currentId ? pointsFor(currentId) : null;

  const todayPlan = useMemo(() => {
    if (!current) return null;
    const dow = new Date().getDay();
    const map = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const basePlan = PLANS[current.plan] ? current.plan : 'Plano ABCDE 5 dias';
    return PLANS[basePlan]?.days.find((d) => d.day === map[dow]) || null;
  }, [current]);

  // ================= AÇÕES CRUD (SUPABASE) =================
  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 4) return setToast('A senha precisa de no mínimo 4 caracteres.');
    if (form.password !== form.confirm) return setToast('As senhas precisam ser iguais.');
    if (!form.name.trim() || !form.nickname.trim()) return setToast('Preencha nome e apelido.');
    setBusy(true);
    const { error } = await supabase.from('ch_users').insert({
      name: form.name.trim(),
      nickname: form.nickname.trim(),
      objective: form.objective,
      plan: form.plan,
      password: form.password,
    });
    if (error) {
      setBusy(false);
      return setToast('Erro ao criar usuário: ' + error.message);
    }
    await reloadRecords();
    setBusy(false);
    setToast('Atleta cadastrado na nuvem! Toque para entrar.');
    setShowCreate(false);
    setForm({ name: '', nickname: '', objective: 'Hipertrofia', plan: 'Plano ABCDE 5 dias', password: '', confirm: '' });
  }

  function tryLogin() {
    if (!loginFor) return;
    if (loginPass === loginFor.password) {
      setCurrentId(loginFor.id);
      setLoginFor(null);
      setLoginPass('');
      setLoginError('');
      setTab('HOJE');
      setToast(`Bem-vindo de volta, ${loginFor.nickname}!`);
    } else {
      setLoginError('Senha incorreta.');
    }
  }

  async function saveEdit() {
    if (!editUser) return;
    if (editPass !== editUser.password) return setToast('Senha atual incorreta.');
    setBusy(true);
    const { error } = await supabase
      .from('ch_users')
      .update({
        name: form.name.trim(),
        nickname: form.nickname.trim(),
        objective: form.objective,
        plan: form.plan,
        password: form.password || editUser.password,
      })
      .eq('id', editUser.id);
    if (error) {
      setBusy(false);
      return setToast(error.message);
    }
    await reloadRecords();
    setEditUser(null);
    setEditPass('');
    setBusy(false);
    setToast('Perfil atualizado.');
  }

  async function doDelete() {
    if (!deleteTarget) return;
    if (deletePass !== deleteTarget.password) return setToast('Senha incorreta.');
    setBusy(true);
    const { error } = await supabase.from('ch_users').delete().eq('id', deleteTarget.id);
    if (error) {
      setBusy(false);
      return setToast(error.message);
    }
    if (currentId === deleteTarget.id) setCurrentId(null);
    await reloadRecords();
    setDeleteTarget(null);
    setDeletePass('');
    setBusy(false);
    setToast('Usuário excluído.');
  }

  function startWorkout(day: { day: string; title: string; exercises: { name: string; prescription: string; category?: string }[] }) {
    if (!day || day.exercises.length === 0) return;
    setWorkoutDraft({
      dayLabel: day.day,
      title: day.title,
      date: todayStr(),
      notes: '',
      exercises: day.exercises.map((ex) => ({
        name: ex.name,
        prescription: ex.prescription,
        category: ex.category || 'Musculação',
        done: false,
        sets: Array.from({ length: parseSets(ex.prescription) }, () => ({ kg: '', reps: '', rir: '2' })),
      })),
    });
    setWorkoutResult(null);
    setTab('HOJE');
  }

  function getPrevMaxKg(exName: string) {
    return Math.max(
      0,
      ...myWorkouts.flatMap((w) =>
        w.exercises.filter((e) => e.name === exName).flatMap((e) => e.sets.map((s) => parseNum(s.kg)))
      )
    );
  }

  async function finishWorkout() {
    if (!workoutDraft || !current) return;
    let volume = 0;
    const prs: string[] = [];
    let points = 100;

    workoutDraft.exercises.forEach((ex) => {
      const valid = ex.sets.filter((s) => parseNum(s.kg) > 0 || parseNum(s.reps) > 0);
      valid.forEach((s) => {
        volume += parseNum(s.kg) * parseNum(s.reps);
      });
      const maxKg = Math.max(0, ...valid.map((s) => parseNum(s.kg)));
      const prevMax = getPrevMaxKg(ex.name);
      if (maxKg > 0 && maxKg > prevMax) {
        prs.push(ex.name);
        points += 50;
      }
      const prevReps = Math.max(
        0,
        ...myWorkouts.flatMap((w) =>
          w.exercises.filter((e) => e.name === ex.name).flatMap((e) => e.sets.map((s) => parseNum(s.reps)))
        )
      );
      const maxReps = Math.max(0, ...valid.map((s) => parseNum(s.reps)));
      if (maxKg > 0 && maxKg === prevMax && maxReps > prevReps) points += 15;
    });

    points += Math.floor(volume / 1000) * 10;
    setBusy(true);
    const { error } = await supabase.from('ch_workouts').insert({
      user_id: current.id,
      date: workoutDraft.date,
      plan: current.plan,
      day_label: workoutDraft.dayLabel,
      title: workoutDraft.title,
      exercises: workoutDraft.exercises,
      volume,
      notes: workoutDraft.notes,
      prs,
      points,
    });
    if (error) {
      setBusy(false);
      return setToast('Erro ao salvar treino: ' + error.message);
    }
    await reloadRecords();
    setWorkoutResult({ volume, prs, points });
    setBusy(false);
    setToast('Treino salvo na nuvem! + ' + points + ' pts');
  }

  async function deleteWorkout(id: string) {
    setBusy(true);
    await supabase.from('ch_workouts').delete().eq('id', id);
    await reloadRecords();
    setBusy(false);
    setToast('Treino removido.');
  }

  async function saveCheckin() {
    if (!current) return;
    if (myCheckins.some((c) => c.date === todayStr())) {
      return setToast('Check-in de hoje já registrado.');
    }
    const sleep = parseNum(checkinForm.sleep);
    const mood = parseNum(checkinForm.mood);
    const soreness = parseNum(checkinForm.soreness);
    const readiness = parseNum(checkinForm.readiness);

    if (sleep <= 0 || mood < 1 || mood > 10 || soreness < 1 || soreness > 10 || readiness < 1 || readiness > 10) {
      return setToast('Informe sono válido e notas de 1 a 10.');
    }
    setBusy(true);
    const { error } = await supabase.from('ch_checkins').insert({
      user_id: current.id,
      date: todayStr(),
      sleep,
      mood,
      soreness,
      readiness,
      note: checkinForm.note,
    });
    if (error) {
      setBusy(false);
      return setToast(error.message);
    }
    await reloadRecords();
    setBusy(false);
    setToast('Check-in registrado! +10 pts');
  }

  async function saveRun() {
    if (!current) return;
    const dist = parseNum(runForm.distance);
    const dur = parseNum(runForm.duration);
    if (!dist || !dur || !runForm.date) return setToast('Preencha data, distância e duração.');
    const pace = dur / dist;
    setBusy(true);
    if (editingRun) {
      const { error } = await supabase
        .from('ch_runs')
        .update({
          date: runForm.date,
          type: runForm.type,
          distance: dist,
          duration: dur,
          pace,
          hr: runForm.hr || '',
          rpe: parseNum(runForm.rpe) || 6,
          notes: runForm.notes || '',
        })
        .eq('id', editingRun.id);
      if (error) {
        setBusy(false);
        return setToast(error.message);
      }
    } else {
      const { error } = await supabase.from('ch_runs').insert({
        user_id: current.id,
        date: runForm.date,
        type: runForm.type,
        distance: dist,
        duration: dur,
        pace,
        hr: runForm.hr || '',
        rpe: parseNum(runForm.rpe) || 6,
        notes: runForm.notes || '',
      });
      if (error) {
        setBusy(false);
        return setToast(error.message);
      }
    }
    await reloadRecords();
    setEditingRun(null);
    setRunForm({ date: todayStr(), type: 'Rua', distance: '5', duration: '30', hr: '', rpe: '6', notes: '' });
    setBusy(false);
    setToast('Corrida salva na nuvem!');
  }

  async function deleteRun(id: string) {
    setBusy(true);
    await supabase.from('ch_runs').delete().eq('id', id);
    await reloadRecords();
    setBusy(false);
    setToast('Corrida excluída.');
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseGpxOrTcx(String(reader.result || ''));
      if (!parsed) {
        setToast('Não foi possível ler o arquivo. Envie um .GPX ou .TCX válido do Strava/relógio.');
        return;
      }
      setRunForm({
        ...runForm,
        date: parsed.date,
        distance: String(parsed.distanceKm),
        duration: String(parsed.durationMin),
        hr: parsed.avgHr || runForm.hr,
        notes: `Importado de ${file.name}`,
      });
      setToast(`Dados importados: ${parsed.distanceKm} km em ${parsed.durationMin} min! Confira e salve.`);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function saveGoal() {
    if (!current) return;
    if (!goalForm.title.trim()) return setToast('Dê um título para a meta.');
    setBusy(true);
    const { error } = await supabase.from('ch_goals').insert({
      user_id: current.id,
      type: goalForm.type,
      title: goalForm.title.trim(),
      current: parseNum(goalForm.current),
      target: parseNum(goalForm.target),
      deadline: goalForm.deadline,
      exercise: goalForm.exercise,
    });
    if (error) {
      setBusy(false);
      return setToast(error.message);
    }
    await reloadRecords();
    setGoalForm({ type: 'Corrida distância', title: '', current: '0', target: '10', deadline: todayStr(), exercise: '' });
    setBusy(false);
    setToast('Meta criada!');
  }

  async function updateGoalCurrent(g: Goal, delta: number) {
    setBusy(true);
    await supabase.from('ch_goals').update({ current: Math.max(0, g.current + delta) }).eq('id', g.id);
    await reloadRecords();
    setBusy(false);
  }

  async function deleteGoal(id: string) {
    setBusy(true);
    await supabase.from('ch_goals').delete().eq('id', id);
    await reloadRecords();
    setBusy(false);
    setToast('Meta removida.');
  }

  async function saveBody() {
    if (!current) return;
    const w = parseNum(bodyForm.weight);
    if (!w) return setToast('Informe o peso corporal.');
    setBusy(true);
    const { error } = await supabase.from('ch_body').insert({
      user_id: current.id,
      date: bodyForm.date,
      weight: w,
      waist: parseNum(bodyForm.waist),
    });
    if (error) {
      setBusy(false);
      return setToast(error.message);
    }
    await reloadRecords();
    setBodyForm({ weight: '', waist: '', date: todayStr() });
    setBusy(false);
    setToast('Peso registrado!');
  }

  async function saveCustomPlan() {
    if (!current) return;
    if (!builderTitle.trim()) return setToast('Dê um nome para o seu treino personalizado.');
    if (builderItems.length === 0) return setToast('Adicione pelo menos 1 exercício, estação Hyrox ou corrida.');
    setBusy(true);
    const { error } = await supabase.from('ch_custom_plans').insert({
      user_id: current.id,
      title: builderTitle.trim(),
      category: builderCat,
      exercises: builderItems,
    });
    if (error) {
      setBusy(false);
      return setToast(error.message);
    }
    await reloadRecords();
    setBuilderTitle('');
    setBuilderItems([]);
    setShowBuilder(false);
    setBusy(false);
    setToast('Treino personalizado criado!');
  }

  async function deleteCustomPlan(id: string) {
    setBusy(true);
    await supabase.from('ch_custom_plans').delete().eq('id', id);
    await reloadRecords();
    setBusy(false);
    setToast('Ficha personalizada removida.');
  }

  // Estatísticas auxiliares
  const prList = useMemo(() => {
    const map: Record<string, { max: number; date: string; reps: number }> = {};
    myWorkouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        ex.sets.forEach((s) => {
          const kg = parseNum(s.kg);
          if (kg > (map[ex.name]?.max || 0)) map[ex.name] = { max: kg, date: w.date, reps: parseNum(s.reps) };
        });
      });
    });
    return Object.entries(map).sort((a, b) => b[1].max - a[1].max);
  }, [myWorkouts]);

  const weekKm = (offset = 0) => {
    const mon = addDays(mondayOf(todayStr()), -7 * offset);
    const sun = addDays(mon, 6);
    return myRuns.filter((r) => r.date >= mon && r.date <= sun).reduce((s, r) => s + r.distance, 0);
  };
  const thisWeekKm = weekKm(0);
  const prevWeekKm = weekKm(1);
  const kmVar = prevWeekKm ? ((thisWeekKm - prevWeekKm) / prevWeekKm) * 100 : thisWeekKm ? 100 : 0;
  const weekTrainings =
    myWorkouts.filter((w) => w.date >= mondayOf(todayStr())).length +
    myRuns.filter((r) => r.date >= mondayOf(todayStr())).length;
  const lastRun = myRuns[0];
  const lastBody = myBodies[myBodies.length - 1];
  const lastCheckin = myCheckins[0];

  function calendarCells() {
    const [y, m] = calMonth.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const startDow = (first.getDay() + 6) % 7;
    const daysIn = new Date(y, m, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysIn; d++) cells.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    return cells;
  }

  const selectedWorkouts = myWorkouts.filter((w) => w.date === selectedDay);
  const selectedRuns = myRuns.filter((r) => r.date === selectedDay);
  const selectedCheckin = myCheckins.find((c) => c.date === selectedDay);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: '#fff' }}>
      {loading && (
        <div className="max-w-[980px] mx-auto px-4 py-16 text-center">
          <p className="font-poster text-2xl tracking-wide text-[#C8FF00]">CONECTANDO À NUVEM O CARA HÍBRIDO…</p>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-[#2A2A2A]">
        <div className="max-w-[980px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={() => { setCurrentId(null); setTab('HOJE'); }} className="flex items-center gap-3 text-left">
            <span className="w-11 h-11 shrink-0 bg-[#C8FF00] text-black font-poster font-bold text-xl flex items-center justify-center rounded-md">
              CH
            </span>
            <span>
              <span className="block font-poster font-bold text-[19px] leading-none tracking-wide">O CARA HÍBRIDO 2.0</span>
              <span className="block text-[12px] text-[#A8A8A8] mt-1">@ocarahibrido • NUVEM ATIVA</span>
            </span>
          </button>
          {current && (
            <button onClick={() => setCurrentId(null)} className="flex items-center gap-2 text-xs font-bold border border-[#2A2A2A] rounded-full px-3 py-2 hover:border-[#C8FF00]">
              <LogOut size={15} /> SAIR
            </button>
          )}
        </div>
        <div className="max-w-[980px] mx-auto px-4 pb-3 flex flex-wrap gap-2">
          <span className="chip bg-[#C8FF00] text-black border-[#C8FF00]">DISCIPLINA SEM ATALHOS</span>
          <span className="chip text-[#A8A8A8]">UM CORPO. VÁRIAS MISSÕES.</span>
        </div>
      </header>

      {/* TOAST */}
      {toast && (
        <div className="max-w-[980px] mx-auto px-4 pt-3 sticky top-24 z-40">
          <div className="bg-[#C8FF00] text-black font-bold text-sm px-4 py-3 rounded-xl flex justify-between items-center gap-3 shadow-lg">
            <span>{toast}</span>
            <button onClick={() => setToast('')} aria-label="Fechar aviso"><X size={18} /></button>
          </div>
        </div>
      )}

      {!current ? (
        <main className="max-w-[980px] mx-auto px-4 pb-16">
          {/* HERO */}
          <section className="pt-6">
            <div className="relative overflow-hidden rounded-2xl bg-[#141414] border border-[#2A2A2A] p-5 sm:p-7">
              <p className="text-[#C8FF00] font-poster tracking-[.2em] text-xs font-bold">MUSCULAÇÃO = FORÇA. CORRIDA = FÔLEGO.</p>
              <h1 className="font-poster font-bold leading-[.92] mt-3 text-[clamp(38px,10vw,72px)]">
                TREINE.<br />CORRA.<br /><span className="text-[#C8FF00]">REPITA.</span>
              </h1>
              <p className="text-[#A8A8A8] mt-4 max-w-[560px]">
                Um ranking, dois motores. Sincronizado em tempo real para você e sua equipe registrarem força, corrida, Hyrox e recuperação.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                <button onClick={() => setShowCreate(true)} className="bg-[#C8FF00] text-black font-poster font-bold tracking-wide px-5 py-3 rounded-lg">
                  CRIAR NOVO USUÁRIO
                </button>
                <button onClick={() => document.getElementById('quem')?.scrollIntoView({ behavior: 'smooth' })} className="border border-white/25 px-5 py-3 rounded-lg font-bold">
                  VER QUEM ESTÁ TREINANDO
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-6 text-center">
                <div className="bg-[#0A0A0A] rounded-xl p-3">
                  <div className="font-poster text-2xl text-[#C8FF00]">{users.length}</div>
                  <div className="text-[11px] text-[#A8A8A8]">ATLETAS</div>
                </div>
                <div className="bg-[#0A0A0A] rounded-xl p-3">
                  <div className="font-poster text-2xl text-[#C8FF00]">{workouts.length + runs.length}</div>
                  <div className="text-[11px] text-[#A8A8A8]">TREINOS</div>
                </div>
                <div className="bg-[#0A0A0A] rounded-xl p-3">
                  <div className="font-poster text-2xl text-[#C8FF00]">{Math.round(runs.reduce((s, r) => s + r.distance, 0))} KM</div>
                  <div className="text-[11px] text-[#A8A8A8]">CORRIDOS</div>
                </div>
              </div>
            </div>
          </section>

          {/* RANKING */}
          <section className="pt-8">
            <div className="flex items-end justify-between">
              <h2 className="font-poster text-2xl sm:text-3xl font-bold flex gap-2 items-center">
                <Trophy className="text-[#FFD400]" /> RANKING CARA HÍBRIDO
              </h2>
              <span className="text-xs text-[#A8A8A8]">AO VIVO NA NUVEM</span>
            </div>
            {loadError && <p className="text-sm text-[#FFD400] mt-3">{loadError}</p>}
            {ranking.length === 0 ? (
              <div className="mt-4 border border-dashed border-[#2A2A2A] rounded-xl p-6 text-center text-[#A8A8A8]">
                Nenhum atleta ainda. Crie o primeiro usuário e comece a somar pontos.
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {ranking.map((u, i) => (
                  <button key={u.id} onClick={() => setPublicUser(u)} className="w-full text-left bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 flex items-center gap-3 hover:border-[#C8FF00]">
                    <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-poster font-bold ${i === 0 ? 'bg-[#FFD400] text-black' : i === 1 ? 'bg-white text-black' : i === 2 ? 'bg-[#C8A15A] text-black' : 'bg-[#1D1D1D] text-[#C8FF00]'}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-poster font-bold text-lg truncate">{u.nickname}</span>
                      <span className="block text-xs text-[#A8A8A8] truncate">{u.name} • {u.objective} • {u.plan}</span>
                      <span className="block text-[11px] text-[#A8A8A8] mt-1">MUSC. {u.musc} • CORRIDA {u.run} • PROG. {u.prog}</span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="block font-poster font-bold text-2xl text-[#C8FF00]">{u.total}</span>
                      <span className="block text-[11px] text-[#A8A8A8]">PTS • {u.trainings} TREINOS</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* USUÁRIOS */}
          <section id="quem" className="pt-9">
            <h2 className="font-poster text-2xl sm:text-3xl font-bold flex gap-2 items-center">
              <Users className="text-[#C8FF00]" /> QUEM ESTÁ TREINANDO
            </h2>
            <p className="text-sm text-[#A8A8A8] mt-1">Toque em um usuário para entrar no seu painel individual.</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              {users.map((u) => (
                <article key={u.id} className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4">
                  <div className="flex justify-between gap-2">
                    <div>
                      <h3 className="font-poster font-bold text-xl">{u.nickname}</h3>
                      <p className="text-sm text-[#A8A8A8]">{u.name}</p>
                      <p className="text-xs text-[#C8FF00] mt-1">{u.objective} • {u.plan}</p>
                    </div>
                    <div className="flex gap-1">
                      <button aria-label="Editar usuário" onClick={() => { setEditUser(u); setForm({ name: u.name, nickname: u.nickname, objective: u.objective, plan: u.plan, password: '', confirm: '' }); }} className="p-2 border border-[#2A2A2A] rounded-lg">
                        <Pencil size={16} />
                      </button>
                      <button aria-label="Excluir usuário" onClick={() => setDeleteTarget(u)} className="p-2 border border-[#2A2A2A] rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <button onClick={() => { setLoginFor(u); setLoginPass(''); setLoginError(''); }} className="mt-4 w-full bg-white text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                    <Lock size={16} /> ENTRAR COMO {u.nickname.toUpperCase()}
                  </button>
                </article>
              ))}
              <button onClick={() => setShowCreate(true)} className="border-2 border-dashed border-[#2A2A2A] rounded-xl p-5 min-h-[150px] flex flex-col items-center justify-center gap-2 text-[#A8A8A8] hover:border-[#C8FF00]">
                <Plus className="text-[#C8FF00]" />
                <span className="font-poster font-bold">CRIAR NOVO USUÁRIO</span>
                <span className="text-xs">Nome, apelido, objetivo, plano e senha.</span>
              </button>
            </div>
          </section>
        </main>
      ) : (
        <main className="max-w-[980px] mx-auto px-4 pb-24">
          {/* CABEÇALHO DO ATLETA */}
          <div className="pt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#A8A8A8] tracking-widest">ATLETA LOGADO</p>
              <h1 className="font-poster text-3xl font-bold">{current?.nickname.toUpperCase()}</h1>
            </div>
            <div className="text-right">
              <p className="font-poster text-3xl text-[#C8FF00] font-bold">{myPoints?.total} PTS</p>
              <p className="text-xs text-[#A8A8A8]">{myRank}º LUGAR NO RANKING</p>
            </div>
          </div>

          {/* ABAS */}
          <nav className="sticky top-[104px] z-20 mt-4 -mx-4 px-4 py-2 bg-[#0A0A0A]/95 overflow-x-auto no-scrollbar flex gap-2 border-b border-[#2A2A2A]">
            {['HOJE', 'CALENDÁRIO', 'PLANOS', 'CORRIDA', 'PROGRESSO'].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap px-4 py-2 rounded-full font-poster font-bold text-sm ${tab === t ? 'bg-[#C8FF00] text-black' : 'bg-[#1D1D1D] text-white border border-[#2A2A2A]'}`}>
                {t}
              </button>
            ))}
          </nav>

          {/* ================= ABA HOJE ================= */}
          {tab === 'HOJE' && (
            <div className="pt-4 space-y-4">
              <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5">
                <p className="text-xs text-[#A8A8A8]">HOJE • {fmtDate(todayStr())}</p>
                <h2 className="font-poster text-3xl font-bold mt-1">{todayPlan?.day.toUpperCase()} • {todayPlan?.title.toUpperCase()}</h2>
                <p className="text-sm text-[#A8A8A8] mt-1">{todayPlan?.note}</p>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-black rounded-xl p-3">
                    <Flame className="mx-auto text-[#FFD400]" />
                    <p className="font-poster text-xl mt-1">{streakFor(current!.id)} DIAS</p>
                    <p className="text-[11px] text-[#A8A8A8]">SEQUÊNCIA</p>
                  </div>
                  <div className="bg-black rounded-xl p-3">
                    <Dumbbell className="mx-auto text-[#C8FF00]" />
                    <p className="font-poster text-xl mt-1">{weekTrainings}</p>
                    <p className="text-[11px] text-[#A8A8A8]">TREINOS SEMANA</p>
                  </div>
                  <div className="bg-black rounded-xl p-3">
                    <Target className="mx-auto text-[#C8FF00]" />
                    <p className="font-poster text-xl mt-1">{myPoints?.total}</p>
                    <p className="text-[11px] text-[#A8A8A8]">MEUS PONTOS</p>
                  </div>
                </div>

                {todayPlan && todayPlan.exercises.length > 0 ? (
                  <button onClick={() => startWorkout(todayPlan)} className="mt-4 w-full bg-[#C8FF00] text-black font-poster font-bold text-lg py-4 rounded-xl">
                    REGISTRAR TREINO DE HOJE
                  </button>
                ) : (
                  <button onClick={() => setTab('CORRIDA')} className="mt-4 w-full bg-[#C8FF00] text-black font-poster font-bold text-lg py-4 rounded-xl">
                    REGISTRAR CORRIDA DE HOJE
                  </button>
                )}
                <button onClick={() => { setPlanFilter(PLANS[current!.plan] ? current!.plan : 'Plano ABCDE 5 dias'); setTab('PLANOS'); }} className="mt-2 w-full border border-white/20 py-3 rounded-xl font-bold text-sm">
                  VER FICHAS E CRIAR TREINO PERSONALIZADO
                </button>
              </section>

              {/* REGISTRO DE MUSCULAÇÃO / HYROX ATIVO COM VOLUME AO VIVO */}
              {workoutDraft && (
                <section className="bg-[#C8FF00] text-black rounded-2xl p-5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h2 className="font-poster text-2xl font-bold">REGISTRO DE TREINO ATIVO</h2>
                      <p className="text-sm font-semibold">{workoutDraft.dayLabel} • {workoutDraft.title}</p>
                    </div>
                    <button onClick={() => setWorkoutDraft(null)} aria-label="Fechar treino"><X /></button>
                  </div>

                  {/* BARRA DE VOLUME AO VIVO */}
                  <div className="mt-3 bg-black text-white rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs text-[#A8A8A8] font-bold">VOLUME DA SESSÃO AO VIVO</span>
                    <span className="font-poster text-2xl text-[#C8FF00] font-bold">{liveVolume.toLocaleString('pt-BR')} KG</span>
                  </div>

                  <div className="mt-4 space-y-4">
                    {workoutDraft.exercises.map((ex, ei) => {
                      const prevMax = getPrevMaxKg(ex.name);
                      return (
                        <div key={ei} className="bg-black text-white rounded-xl p-4">
                          <div className="flex justify-between gap-2">
                            <div>
                              <h3 className="font-poster font-bold">{ex.name.toUpperCase()}</h3>
                              <p className="text-xs text-[#A8A8A8]">
                                {ex.prescription} {prevMax > 0 && <span className="text-[#C8FF00] font-bold">• RECORDE ANTERIOR: {prevMax} KG</span>}
                              </p>
                            </div>
                            <label className="flex items-center gap-2 text-xs font-bold shrink-0">
                              <input
                                type="checkbox"
                                checked={ex.done}
                                onChange={(e) => {
                                  const d = { ...workoutDraft };
                                  d.exercises[ei].done = e.target.checked;
                                  setWorkoutDraft(d);
                                }}
                                className="w-5 h-5 accent-[#C8FF00]"
                              />
                              FEITO
                            </label>
                          </div>
                          {ex.sets.map((s, si) => (
                            <div key={si} className="grid grid-cols-3 gap-2 mt-3">
                              <label className="text-xs text-[#A8A8A8]">
                                SÉRIE {si + 1} • KG/DIST
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={s.kg}
                                  onChange={(e) => {
                                    const d = { ...workoutDraft };
                                    d.exercises[ei].sets[si].kg = e.target.value;
                                    setWorkoutDraft(d);
                                  }}
                                  placeholder="0"
                                />
                              </label>
                              <label className="text-xs text-[#A8A8A8]">
                                REPS / TEMPO
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={s.reps}
                                  onChange={(e) => {
                                    const d = { ...workoutDraft };
                                    d.exercises[ei].sets[si].reps = e.target.value;
                                    setWorkoutDraft(d);
                                  }}
                                  placeholder="0"
                                />
                              </label>
                              <label className="text-xs text-[#A8A8A8]">
                                RIR
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={s.rir}
                                  onChange={(e) => {
                                    const d = { ...workoutDraft };
                                    d.exercises[ei].sets[si].rir = e.target.value;
                                    setWorkoutDraft(d);
                                  }}
                                  placeholder="2"
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  <label className="block text-sm font-bold mt-4">
                    OBSERVAÇÕES
                    <textarea
                      value={workoutDraft.notes}
                      onChange={(e) => setWorkoutDraft({ ...workoutDraft, notes: e.target.value })}
                      placeholder="Como foi o treino?"
                      className="bg-white text-black border-white mt-1"
                    />
                  </label>
                  <button disabled={busy} onClick={finishWorkout} className="mt-4 w-full bg-black text-[#C8FF00] font-poster font-bold text-lg py-4 rounded-xl">
                    CONCLUIR E SALVAR TREINO
                  </button>

                  {workoutResult && (
                    <div className="mt-3 bg-black text-white rounded-xl p-4">
                      <p className="font-poster font-bold text-xl">
                        TREINO SALVO • VOLUME {workoutResult.volume.toLocaleString('pt-BR')} KG • +{workoutResult.points} PTS
                      </p>
                      {workoutResult.prs.length > 0 && (
                        <p className="mt-2">
                          <span className="bg-[#FFD400] text-black px-2 py-1 rounded font-bold text-xs">NOVO PR</span>{' '}
                          <span className="text-sm">{workoutResult.prs.join(', ')}</span>
                        </p>
                      )}
                      <button onClick={() => setWorkoutDraft(null)} className="mt-3 text-sm underline text-[#C8FF00]">
                        FECHAR REGISTRO
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* CHECK-IN E RESUMOS */}
              <section className="grid sm:grid-cols-2 gap-3">
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5">
                  <h3 className="font-poster font-bold text-xl flex gap-2 items-center">
                    <Moon className="text-[#C8FF00]" /> CHECK-IN DO DIA
                  </h3>
                  <p className="text-xs text-[#A8A8A8] mt-1">
                    {myCheckins.some((c) => c.date === todayStr()) ? 'Check-in de hoje já registrado.' : 'Aceita decimais com vírgula ou ponto (ex: 7,5).'}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {([
                      ['Horas de sono', 'sleep'],
                      ['Disposição (1-10)', 'mood'],
                      ['Dor muscular (1-10)', 'soreness'],
                      ['Prontidão (1-10)', 'readiness'],
                    ] as const).map(([label, key]) => (
                      <label key={key} className="text-xs text-[#A8A8A8]">
                        {label}
                        <input
                          type="text"
                          inputMode="decimal"
                          value={(checkinForm as any)[key]}
                          onChange={(e) => setCheckinForm({ ...checkinForm, [key]: e.target.value })}
                        />
                      </label>
                    ))}
                  </div>
                  <label className="block text-xs text-[#A8A8A8] mt-3">
                    Observação curta
                    <textarea value={checkinForm.note} onChange={(e) => setCheckinForm({ ...checkinForm, note: e.target.value })} placeholder="Sono, rotina, sensação geral." />
                  </label>
                  {parseNum(checkinForm.readiness) <= 4 && (
                    <p className="mt-3 bg-[#FFD400]/15 border border-[#FFD400]/40 text-[#FFD400] text-sm rounded-lg p-3">
                      Prontidão baixa. Reduza carga ou priorize rodagem regenerativa hoje.
                    </p>
                  )}
                  <button disabled={busy} onClick={saveCheckin} className="mt-3 w-full bg-white text-black font-bold py-3 rounded-lg">
                    SALVAR CHECK-IN • +10 PTS
                  </button>
                  {lastCheckin && (
                    <p className="text-xs text-[#A8A8A8] mt-2">
                      Último: {fmtDate(lastCheckin.date)} • sono {lastCheckin.sleep}h • prontidão {lastCheckin.readiness}/10
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5">
                    <h3 className="font-poster font-bold text-xl flex gap-2"><Footprints className="text-[#C8FF00]" /> ÚLTIMA CORRIDA</h3>
                    {lastRun ? (
                      <>
                        <p className="mt-2 font-poster text-2xl">{lastRun.distance} KM • {lastRun.type.toUpperCase()}</p>
                        <p className="text-sm text-[#A8A8A8]">{fmtDate(lastRun.date)} • pace {lastRun.pace.toFixed(2)} min/km</p>
                      </>
                    ) : (
                      <p className="text-sm text-[#A8A8A8] mt-2">Nenhuma corrida registrada ainda.</p>
                    )}
                    <button onClick={() => setTab('CORRIDA')} className="mt-3 border border-white/20 w-full py-2.5 rounded-lg font-bold">ABRIR CORRIDA</button>
                  </div>

                  <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5">
                    <h3 className="font-poster font-bold text-xl flex gap-2"><Activity className="text-[#C8FF00]" /> ÚLTIMO PESO</h3>
                    {lastBody ? (
                      <>
                        <p className="mt-2 font-poster text-2xl">{lastBody.weight} KG</p>
                        <p className="text-sm text-[#A8A8A8]">{fmtDate(lastBody.date)} {lastBody.waist ? `• cintura ${lastBody.waist} cm` : ''}</p>
                      </>
                    ) : (
                      <p className="text-sm text-[#A8A8A8] mt-2">Nenhum peso registrado ainda.</p>
                    )}
                    <button onClick={() => setTab('PROGRESSO')} className="mt-3 border border-white/20 w-full py-2.5 rounded-lg font-bold">REGISTRAR PESO</button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ================= ABA CALENDÁRIO ================= */}
          {tab === 'CALENDÁRIO' && (
            <div className="pt-4 space-y-4">
              <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <button aria-label="Mês anterior" onClick={() => { const [y, m] = calMonth.split('-').map(Number); const d = new Date(y, m - 2, 1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }} className="p-2 border border-[#2A2A2A] rounded-lg">
                    <ChevronLeft />
                  </button>
                  <h2 className="font-poster text-2xl font-bold">CALENDÁRIO • {calMonth}</h2>
                  <button aria-label="Próximo mês" onClick={() => { const [y, m] = calMonth.split('-').map(Number); const d = new Date(y, m, 1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }} className="p-2 border border-[#2A2A2A] rounded-lg">
                    <ChevronRight />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[#A8A8A8] mt-4">
                  {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((d) => <span key={d}>{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1 mt-2">
                  {calendarCells().map((d, i) => {
                    if (!d) return <span key={i} />;
                    const hasW = myWorkouts.some((w) => w.date === d);
                    const hasR = myRuns.some((r) => r.date === d);
                    const hasC = myCheckins.some((c) => c.date === d);
                    return (
                      <button key={d} onClick={() => setSelectedDay(d)} className={`min-h-[48px] rounded-lg border text-sm ${selectedDay === d ? 'border-[#C8FF00] bg-[#C8FF00] text-black font-bold' : 'border-[#2A2A2A] bg-black'}`}>
                        <span>{Number(d.slice(-2))}</span>
                        <span className="flex justify-center gap-1 mt-1">
                          {hasW && <i className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] block" />}
                          {hasR && <i className="w-1.5 h-1.5 rounded-full bg-[#FFD400] block" />}
                          {hasC && <i className="w-1.5 h-1.5 rounded-full bg-white block" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-[#A8A8A8] mt-3">Verde: musculação/Hyrox. Amarelo: corrida. Branco: check-in.</p>
              </section>

              <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5">
                <h3 className="font-poster text-xl font-bold">REGISTROS DE {fmtDate(selectedDay)}</h3>
                {selectedWorkouts.map((w) => (
                  <div key={w.id} className="mt-3 border border-[#2A2A2A] rounded-xl p-3 flex justify-between items-center gap-2">
                    <div>
                      <p className="font-bold">{w.title} • {w.volume.toLocaleString('pt-BR')} kg • +{w.points} pts</p>
                      <p className="text-xs text-[#A8A8A8]">{w.exercises.filter((e) => e.done).length}/{w.exercises.length} exercícios concluídos</p>
                    </div>
                    <button onClick={() => deleteWorkout(w.id)} className="p-2 text-red-400 border border-[#2A2A2A] rounded-lg" title="Excluir treino">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {selectedRuns.map((r) => (
                  <div key={r.id} className="mt-3 border border-[#2A2A2A] rounded-xl p-3 flex justify-between items-center gap-2">
                    <div>
                      <p className="font-bold">Corrida {r.type} • {r.distance} km</p>
                      <p className="text-xs text-[#A8A8A8]">{r.duration} min • pace {r.pace.toFixed(2)} min/km</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingRun(r); setRunForm({ date: r.date, type: r.type, distance: String(r.distance), duration: String(r.duration), hr: r.hr, rpe: String(r.rpe), notes: r.notes }); setTab('CORRIDA'); }} className="text-xs font-bold border border-[#2A2A2A] rounded-lg px-3 py-2">
                        EDITAR
                      </button>
                      <button onClick={() => deleteRun(r.id)} className="p-2 text-red-400 border border-[#2A2A2A] rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {selectedCheckin && <p className="mt-3 text-sm">Check-in: sono {selectedCheckin.sleep}h, prontidão {selectedCheckin.readiness}/10.</p>}
                {selectedWorkouts.length === 0 && selectedRuns.length === 0 && !selectedCheckin && (
                  <p className="text-sm text-[#A8A8A8] mt-3">Nenhum registro neste dia.</p>
                )}
              </section>
            </div>
          )}

          {/* ================= ABA PLANOS + CRIADOR UNIVERSAL ================= */}
          {tab === 'PLANOS' && (
            <div className="pt-4 space-y-4">
              {/* BOTÃO CRIADOR UNIVERSAL */}
              <div className="bg-[#141414] border border-[#C8FF00]/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-poster text-xl font-bold flex items-center gap-2">
                    <Sparkles className="text-[#C8FF00]" size={20} /> CRIADOR UNIVERSAL DE TREINOS
                  </h2>
                  <p className="text-xs text-[#A8A8A8]">Monte fichas personalizadas com Musculação, Máquinas, Hyrox e Corrida.</p>
                </div>
                <button onClick={() => setShowBuilder(!showBuilder)} className="bg-[#C8FF00] text-black font-poster font-bold px-4 py-2.5 rounded-xl">
                  {showBuilder ? 'FECHAR CRIADOR' : '+ CRIAR MEU TREINO'}
                </button>
              </div>

              {/* PAINEL DO CRIADOR DE TREINOS */}
              {showBuilder && (
                <section className="bg-[#141414] border-2 border-[#C8FF00] rounded-2xl p-5 space-y-4">
                  <h3 className="font-poster text-2xl font-bold text-[#C8FF00]">MONTAR TREINO PERSONALIZADO</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="text-xs text-[#A8A8A8]">
                      NOME DA FICHA
                      <input value={builderTitle} onChange={(e) => setBuilderTitle(e.target.value)} placeholder="Ex.: Treino Híbrido + Hyrox Sábado" />
                    </label>
                    <div>
                      <span className="block text-xs text-[#A8A8A8] mb-1">MODALIDADE DO CATÁLOGO</span>
                      <div className="flex gap-2">
                        {(['Musculação', 'Hyrox', 'Corrida'] as const).map((cat) => (
                          <button key={cat} type="button" onClick={() => setBuilderCat(cat)} className={`flex-1 py-2.5 rounded-lg font-bold text-xs ${builderCat === cat ? 'bg-[#C8FF00] text-black' : 'bg-[#1D1D1D] border border-[#2A2A2A]'}`}>
                            {cat.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* BUSCA NO CATÁLOGO */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3.5 text-[#A8A8A8]" />
                    <input
                      value={builderSearch}
                      onChange={(e) => setBuilderSearch(e.target.value)}
                      placeholder={`Buscar em ${builderCat} (ex.: Supino, SkiErg, Sled, Intervalado...)`}
                      className="pl-9"
                    />
                  </div>

                  {/* LISTA DE EXERCÍCIOS DO CATÁLOGO */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-[#2A2A2A] rounded-xl p-2 bg-black">
                    {CATALOG[builderCat]
                      .filter((item) => item.toLowerCase().includes(builderSearch.toLowerCase()))
                      .map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setBuilderItems([...builderItems, { name: item, prescription: builderCat === 'Corrida' ? '1 x 5 km' : '3 x 10 a 12', category: builderCat }])}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#1D1D1D] flex justify-between items-center text-sm"
                        >
                          <span>{item}</span>
                          <span className="text-xs text-[#C8FF00] font-bold">+ ADICIONAR</span>
                        </button>
                      ))}
                  </div>

                  {/* ADICIONAR EXERCÍCIO / MÁQUINA CUSTOMIZADA */}
                  <div className="border-t border-[#2A2A2A] pt-3">
                    <p className="text-xs text-[#A8A8A8] mb-2">Não encontrou a máquina ou variação? Adicione manualmente:</p>
                    <div className="grid sm:grid-cols-3 gap-2">
                      <input value={customExName} onChange={(e) => setCustomExName(e.target.value)} placeholder="Nome da máquina/exercício" />
                      <input value={customExPresc} onChange={(e) => setCustomExPresc(e.target.value)} placeholder="Ex.: 4 x 12 ou 1000m" />
                      <button
                        type="button"
                        onClick={() => {
                          if (!customExName.trim()) return;
                          setBuilderItems([...builderItems, { name: customExName.trim(), prescription: customExPresc || '3 x 10', category: builderCat }]);
                          setCustomExName('');
                        }}
                        className="bg-white text-black font-bold rounded-lg py-2.5 text-xs"
                      >
                        + INCLUIR ITEM LIVRE
                      </button>
                    </div>
                  </div>

                  {/* ITENS SELECIONADOS */}
                  {builderItems.length > 0 && (
                    <div className="bg-black rounded-xl p-3 space-y-2">
                      <p className="text-xs font-bold text-[#C8FF00]">EXERCÍCIOS NA FICHA ({builderItems.length}):</p>
                      {builderItems.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-sm border-b border-[#2A2A2A] pb-2">
                          <div>
                            <span className="font-bold">{it.name}</span>
                            <span className="block text-xs text-[#A8A8A8]">{it.category} • {it.prescription}</span>
                          </div>
                          <button type="button" onClick={() => setBuilderItems(builderItems.filter((_, i) => i !== idx))} className="text-red-400 p-1">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button disabled={busy} onClick={saveCustomPlan} className="mt-2 w-full bg-[#C8FF00] text-black font-poster font-bold py-3 rounded-xl">
                        SALVAR TREINO PERSONALIZADO
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* MEUS TREINOS PERSONALIZADOS SALVOS */}
              {myCustomPlans.length > 0 && (
                <section className="space-y-3">
                  <h3 className="font-poster text-xl font-bold text-[#C8FF00]">MEUS TREINOS PERSONALIZADOS</h3>
                  {myCustomPlans.map((cp) => (
                    <div key={cp.id} className="bg-[#141414] border border-[#C8FF00]/50 rounded-2xl p-5">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-poster text-2xl font-bold">{cp.title.toUpperCase()}</h4>
                          <p className="text-xs text-[#A8A8A8]">{cp.exercises.length} estações/exercícios</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startWorkout({ day: 'Personalizado', title: cp.title, exercises: cp.exercises })} className="bg-[#C8FF00] text-black font-bold px-4 py-2 rounded-lg text-sm">
                            TREINAR AGORA
                          </button>
                          <button onClick={() => deleteCustomPlan(cp.id)} className="p-2 border border-[#2A2A2A] rounded-lg text-red-400">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        {cp.exercises.map((ex, idx) => (
                          <div key={idx} className="flex justify-between text-sm border-b border-[#2A2A2A] pb-1.5">
                            <span>{ex.name} <span className="text-[11px] text-[#A8A8A8]">({ex.category})</span></span>
                            <span className="text-[#C8FF00]">{ex.prescription}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* SELETOR DOS 6 PLANOS PRONTOS */}
              <div className="flex flex-wrap gap-2">
                {Object.keys(PLANS).map((p) => (
                  <button key={p} onClick={() => setPlanFilter(p)} className={`px-3.5 py-2 rounded-full font-bold text-xs ${planFilter === p ? 'bg-[#C8FF00] text-black' : 'bg-[#1D1D1D] border border-[#2A2A2A]'}`}>
                    {PLANS[p].label}
                  </button>
                ))}
              </div>

              {PLANS[planFilter]?.days.map((d) => (
                <section key={d.day} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5">
                  <div className="flex justify-between gap-3">
                    <div>
                      <h3 className="font-poster text-2xl font-bold">{d.day.toUpperCase()} • {d.title.toUpperCase()}</h3>
                      <p className="text-sm text-[#A8A8A8]">{d.note}</p>
                    </div>
                    {d.exercises.length > 0 && (
                      <button onClick={() => startWorkout(d)} className="shrink-0 bg-[#C8FF00] text-black font-bold px-4 py-2 rounded-lg h-fit">
                        COMEÇAR
                      </button>
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    {d.exercises.map((ex) => (
                      <div key={ex.name} className="flex justify-between gap-3 border-b border-[#2A2A2A] pb-2">
                        <span className="text-sm font-semibold">{ex.name}</span>
                        <span className="text-sm text-[#C8FF00] whitespace-nowrap">{ex.prescription}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* ================= ABA CORRIDA (BOTÕES PÍLULA + IMPORTAÇÃO GPX/TCX) ================= */}
          {tab === 'CORRIDA' && (
            <div className="pt-4 space-y-4">
              <section className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4">
                  <p className="font-poster text-2xl text-[#C8FF00]">{thisWeekKm.toFixed(1)} KM</p>
                  <p className="text-[11px] text-[#A8A8A8]">SEMANA ATUAL</p>
                </div>
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4">
                  <p className="font-poster text-2xl">{prevWeekKm.toFixed(1)} KM</p>
                  <p className="text-[11px] text-[#A8A8A8]">SEMANA ANTERIOR</p>
                </div>
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4">
                  <p className="font-poster text-2xl text-[#FFD400]">{kmVar >= 0 ? '+' : ''}{kmVar.toFixed(0)}%</p>
                  <p className="text-[11px] text-[#A8A8A8]">VARIAÇÃO</p>
                </div>
              </section>

              <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <h2 className="font-poster text-2xl font-bold">{editingRun ? 'EDITAR CORRIDA' : 'REGISTRAR CORRIDA'}</h2>
                    <p className="text-xs text-[#A8A8A8]">Escolha a modalidade abaixo ou importe do Strava/Relógio.</p>
                  </div>
                  <label className="bg-[#1D1D1D] border border-[#C8FF00] text-[#C8FF00] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
                    <Upload size={15} /> IMPORTAR .GPX / .TCX
                    <input type="file" accept=".gpx,.tcx,.xml" onChange={handleImportFile} className="hidden" />
                  </label>
                </div>

                {/* SELETOR EM BOTÕES PÍLULA (NUNCA TRAVA NO CELULAR) */}
                <div className="mt-4">
                  <span className="block text-xs text-[#A8A8A8] mb-2">MODALIDADE DE CORRIDA</span>
                  <div className="flex flex-wrap gap-2">
                    {RUN_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setRunForm({ ...runForm, type: t })}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                          runForm.type === t ? 'bg-[#C8FF00] text-black' : 'bg-[#1D1D1D] text-white border border-[#2A2A2A]'
                        }`}
                      >
                        {runForm.type === t && <Check size={14} />}
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  <label className="text-xs text-[#A8A8A8]">
                    DATA
                    <input type="date" value={runForm.date} onChange={(e) => setRunForm({ ...runForm, date: e.target.value })} />
                  </label>
                  <label className="text-xs text-[#A8A8A8]">
                    DISTÂNCIA (KM)
                    <input type="text" inputMode="decimal" value={runForm.distance} onChange={(e) => setRunForm({ ...runForm, distance: e.target.value })} />
                  </label>
                  <label className="text-xs text-[#A8A8A8]">
                    DURAÇÃO (MINUTOS)
                    <input type="text" inputMode="decimal" value={runForm.duration} onChange={(e) => setRunForm({ ...runForm, duration: e.target.value })} />
                  </label>
                  <label className="text-xs text-[#A8A8A8]">
                    FC MÉDIA (OPCIONAL)
                    <input inputMode="numeric" value={runForm.hr} onChange={(e) => setRunForm({ ...runForm, hr: e.target.value })} placeholder="Ex.: 148" />
                  </label>
                </div>

                <div className="mt-3 bg-black rounded-xl p-3 flex items-center gap-2">
                  <Gauge className="text-[#C8FF00]" />
                  <span className="font-poster font-bold">
                    RITMO CALCULADO:{' '}
                    {parseNum(runForm.distance) > 0 && parseNum(runForm.duration) > 0
                      ? (parseNum(runForm.duration) / parseNum(runForm.distance)).toFixed(2)
                      : '0.00'}{' '}
                    MIN/KM
                  </span>
                </div>

                <label className="block text-xs text-[#A8A8A8] mt-3">
                  OBSERVAÇÕES
                  <textarea value={runForm.notes} onChange={(e) => setRunForm({ ...runForm, notes: e.target.value })} placeholder="Percurso, sensação, clima." />
                </label>

                <div className="flex gap-2 mt-4">
                  <button disabled={busy} onClick={saveRun} className="flex-1 bg-[#C8FF00] text-black font-poster font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                    <Save /> SALVAR CORRIDA
                  </button>
                  {editingRun && (
                    <button onClick={() => { setEditingRun(null); setRunForm({ date: todayStr(), type: 'Rua', distance: '5', duration: '30', hr: '', rpe: '6', notes: '' }); }} className="border border-[#2A2A2A] px-4 rounded-xl font-bold">
                      CANCELAR
                    </button>
                  )}
                </div>
              </section>

              <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5">
                <h3 className="font-poster text-xl font-bold">HISTÓRICO DE CORRIDAS</h3>
                <div className="mt-3 space-y-2">
                  {myRuns.map((r) => (
                    <div key={r.id} className="border border-[#2A2A2A] rounded-xl p-3 flex justify-between items-center gap-3">
                      <div>
                        <p className="font-bold">{fmtDate(r.date)} • {r.type} • {r.distance} km</p>
                        <p className="text-xs text-[#A8A8A8]">{r.duration} min • pace {r.pace.toFixed(2)} min/km {r.hr ? `• FC ${r.hr} bpm` : ''}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingRun(r); setRunForm({ date: r.date, type: r.type, distance: String(r.distance), duration: String(r.duration), hr: r.hr, rpe: String(r.rpe), notes: r.notes }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs font-bold">
                          EDITAR
                        </button>
                        <button onClick={() => deleteRun(r.id)} className="p-2 border border-[#2A2A2A] rounded-lg text-red-400">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {myRuns.length === 0 && <p className="text-sm text-[#A8A8A8]">Nenhuma corrida ainda.</p>}
                </div>
              </section>
            </div>
          )}

          {/* ================= ABA PROGRESSO & METAS ================= */}
          {tab === 'PROGRESSO' && (
            <div className="pt-4 space-y-4">
              <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5">
                <h3 className="font-poster text-xl font-bold flex gap-2 items-center">
                  <Target className="text-[#C8FF00]" /> METAS PESSOAIS
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  <label className="text-xs text-[#A8A8A8]">
                    TIPO DE META
                    <select value={goalForm.type} onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value })}>
                      {['Corrida distância', 'Força carga em exercício', 'Peso corporal'].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="text-xs text-[#A8A8A8]">
                    TÍTULO
                    <input value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} placeholder="Ex.: Correr 50 km no mês" />
                  </label>
                  <label className="text-xs text-[#A8A8A8]">
                    VALOR ATUAL / INICIAL
                    <input type="text" inputMode="decimal" value={goalForm.current} onChange={(e) => setGoalForm({ ...goalForm, current: e.target.value })} />
                  </label>
                  <label className="text-xs text-[#A8A8A8]">
                    VALOR META
                    <input type="text" inputMode="decimal" value={goalForm.target} onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })} />
                  </label>
                  {goalForm.type === 'Força carga em exercício' && (
                    <label className="text-xs text-[#A8A8A8] sm:col-span-2">
                      EXERCÍCIO
                      <input value={goalForm.exercise} onChange={(e) => setGoalForm({ ...goalForm, exercise: e.target.value })} placeholder="Ex.: Supino reto com barra" />
                    </label>
                  )}
                </div>
                <button disabled={busy} onClick={saveGoal} className="mt-3 bg-[#C8FF00] text-black font-bold px-5 py-3 rounded-lg">
                  CRIAR META
                </button>

                <div className="mt-4 space-y-3">
                  {myGoals.map((g) => {
                    const pct = goalProgressForUser(g, current!.id);
                    return (
                      <div key={g.id} className="border border-[#2A2A2A] rounded-xl p-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-bold">{g.title}</p>
                            <p className="text-xs text-[#A8A8A8]">{g.type} • meta: {g.target}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateGoalCurrent(g, 1)} className="px-2 py-1 bg-[#1D1D1D] border border-[#2A2A2A] rounded text-xs font-bold">+1</button>
                            <button onClick={() => deleteGoal(g.id)} className="p-1.5 text-red-400 border border-[#2A2A2A] rounded"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <div className="bar mt-2"><div style={{ width: `${pct}%` }} /></div>
                        <p className="text-xs text-[#C8FF00] font-bold mt-1">{pct.toFixed(0)}% concluído</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* PESO CORPORAL */}
              <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5">
                <h3 className="font-poster text-xl font-bold">PESO CORPORAL E CINTURA</h3>
                <div className="grid sm:grid-cols-3 gap-3 mt-3">
                  <label className="text-xs text-[#A8A8A8]">DATA<input type="date" value={bodyForm.date} onChange={(e) => setBodyForm({ ...bodyForm, date: e.target.value })} /></label>
                  <label className="text-xs text-[#A8A8A8]">PESO (KG)<input type="text" inputMode="decimal" value={bodyForm.weight} onChange={(e) => setBodyForm({ ...bodyForm, weight: e.target.value })} /></label>
                  <label className="text-xs text-[#A8A8A8]">CINTURA (CM)<input type="text" inputMode="decimal" value={bodyForm.waist} onChange={(e) => setBodyForm({ ...bodyForm, waist: e.target.value })} /></label>
                </div>
                <button disabled={busy} onClick={saveBody} className="mt-3 bg-white text-black font-bold px-5 py-3 rounded-lg">SALVAR PESO</button>
                <div className="mt-4 space-y-2">
                  {myBodies.slice(-6).map((b) => (
                    <div key={b.id} className="flex justify-between text-sm border-b border-[#2A2A2A] pb-2">
                      <span>{fmtDate(b.date)}</span>
                      <span className="font-bold">{b.weight} kg {b.waist ? `• ${b.waist} cm` : ''}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* PRs */}
              <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5">
                <h3 className="font-poster text-xl font-bold">RECORDES PESSOAIS (PRs)</h3>
                <div className="mt-3 space-y-2">
                  {prList.slice(0, 10).map(([name, pr]) => (
                    <div key={name} onClick={() => setSelectedExercise(name)} className={`flex justify-between p-3 rounded-lg border cursor-pointer ${selectedExercise === name ? 'border-[#C8FF00] bg-black' : 'border-[#2A2A2A]'}`}>
                      <span className="text-sm font-bold">{name}</span>
                      <span className="text-sm text-[#C8FF00]">{pr.max} kg • {fmtDate(pr.date)}</span>
                    </div>
                  ))}
                  {prList.length === 0 && <p className="text-sm text-[#A8A8A8]">Conclua um treino para registrar seus PRs.</p>}
                </div>
              </section>
            </div>
          )}
        </main>
      )}

      {/* MODAIS */}
      {loginFor && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl w-full max-w-md p-5">
            <div className="flex justify-between">
              <h3 className="font-poster text-2xl font-bold">ENTRAR COMO {loginFor.nickname.toUpperCase()}</h3>
              <button onClick={() => setLoginFor(null)}><X /></button>
            </div>
            <label className="block text-xs text-[#A8A8A8] mt-4">
              SENHA
              <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') tryLogin(); }} placeholder="Digite sua senha" />
            </label>
            {loginError && <p className="text-sm text-[#FFD400] mt-2">{loginError}</p>}
            <button onClick={tryLogin} className="mt-4 w-full bg-[#C8FF00] text-black font-poster font-bold py-3.5 rounded-xl">ENTRAR</button>
          </div>
        </div>
      )}

      {publicUser && (() => {
        const p = pointsFor(publicUser.id);
        const puWorkouts = workouts.filter((w) => w.userId === publicUser.id);
        const puRuns = runs.filter((r) => r.userId === publicUser.id);
        const totalKm = puRuns.reduce((s, r) => s + r.distance, 0);
        const totalVol = puWorkouts.reduce((s, w) => s + w.volume, 0);
        return (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl w-full max-w-md p-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-[#C8FF00] tracking-widest">CARTÃO DO ATLETA</p>
                  <h3 className="font-poster text-3xl font-bold">{publicUser.nickname.toUpperCase()}</h3>
                  <p className="text-sm text-[#A8A8A8]">{publicUser.objective} • {publicUser.plan}</p>
                </div>
                <button onClick={() => setPublicUser(null)}><X /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                {[
                  [`${p.total} PTS`, 'PONTOS'],
                  [`${p.trainings}`, 'TREINOS'],
                  [`${totalKm.toFixed(1)} KM`, 'KM TOTAL'],
                  [`${totalVol.toLocaleString('pt-BR')} KG`, 'VOLUME TOTAL'],
                ].map(([v, l]) => (
                  <div key={l} className="bg-black rounded-xl p-3">
                    <p className="font-poster font-bold text-lg text-[#C8FF00]">{v}</p>
                    <p className="text-[11px] text-[#A8A8A8]">{l}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setPublicUser(null)} className="mt-4 w-full border border-[#2A2A2A] py-3 rounded-xl font-bold">FECHAR</button>
            </div>
          </div>
        );
      })()}

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={createUser} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl w-full max-w-lg p-5 my-auto">
            <div className="flex justify-between">
              <h3 className="font-poster text-2xl font-bold">CRIAR NOVO USUÁRIO</h3>
              <button type="button" onClick={() => setShowCreate(false)}><X /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <label className="text-xs text-[#A8A8A8]">NOME<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" /></label>
              <label className="text-xs text-[#A8A8A8]">APELIDO<input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="Como quer ser chamado" /></label>
              <label className="text-xs text-[#A8A8A8]">OBJETIVO<select value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })}>{['Hipertrofia', 'Redução de gordura', 'Condicionamento', 'Hyrox / Performance'].map((o) => <option key={o}>{o}</option>)}</select></label>
              <label className="text-xs text-[#A8A8A8]">PLANO INICIAL<select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>{Object.keys(PLANS).map((p) => <option key={p}>{p}</option>)}</select></label>
              <label className="text-xs text-[#A8A8A8]">SENHA (MÍN. 4)<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
              <label className="text-xs text-[#A8A8A8]">CONFIRMAR SENHA<input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></label>
            </div>
            <button disabled={busy} className="mt-4 w-full bg-[#C8FF00] text-black font-poster font-bold py-3.5 rounded-xl">CRIAR USUÁRIO</button>
          </form>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl w-full max-w-lg p-5">
            <div className="flex justify-between">
              <h3 className="font-poster text-2xl font-bold">EDITAR USUÁRIO</h3>
              <button onClick={() => setEditUser(null)}><X /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <label className="text-xs text-[#A8A8A8]">NOME<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label className="text-xs text-[#A8A8A8]">APELIDO<input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} /></label>
              <label className="text-xs text-[#A8A8A8]">OBJETIVO<select value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })}>{['Hipertrofia', 'Redução de gordura', 'Condicionamento', 'Hyrox / Performance'].map((o) => <option key={o}>{o}</option>)}</select></label>
              <label className="text-xs text-[#A8A8A8]">PLANO<select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>{Object.keys(PLANS).map((p) => <option key={p}>{p}</option>)}</select></label>
              <label className="text-xs text-[#A8A8A8]">NOVA SENHA (OPCIONAL)<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
              <label className="text-xs text-[#A8A8A8]">SENHA ATUAL PARA CONFIRMAR<input type="password" value={editPass} onChange={(e) => setEditPass(e.target.value)} /></label>
            </div>
            <button disabled={busy} onClick={saveEdit} className="mt-4 w-full bg-[#C8FF00] text-black font-poster font-bold py-3.5 rounded-xl">SALVAR ALTERAÇÕES</button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl w-full max-w-md p-5">
            <h3 className="font-poster text-2xl font-bold">EXCLUIR {deleteTarget.nickname.toUpperCase()}?</h3>
            <p className="text-sm text-[#A8A8A8] mt-1">Apaga o usuário e todos os registros dele. Digite a senha para confirmar.</p>
            <label className="block text-xs text-[#A8A8A8] mt-4">SENHA<input type="password" value={deletePass} onChange={(e) => setDeletePass(e.target.value)} /></label>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-[#2A2A2A] py-3 rounded-xl font-bold">CANCELAR</button>
              <button disabled={busy} onClick={doDelete} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl">EXCLUIR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}