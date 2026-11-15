import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, Calendar as CalIcon, Camera, ChevronLeft, ChevronRight, Dumbbell,
  Flame, Footprints, LogOut, Send, Settings, Trash2, Trophy, Upload, UserCheck, Users
} from 'lucide-react';
import { supabase } from './supabase';
import { ExerciseThumbnail } from './components/ExerciseMedia';
import { DynamicAvatar } from './components/DynamicAvatar';
import { WaterSlider } from './components/WaterSlider';

type UserProfile = {
  id: string;
  name: string;
  nickname: string;
  objective: string;
  plan: string;
  password: string;
  role: 'atleta' | 'treinador';
  coach_id?: string | null;
  invite_code?: string | null;
  gender: string;
  age: number;
  height: number;
  weight: number;
  strava_athlete_id?: string | null;
};

type ExerciseSet = { weight: number; reps: number; done: boolean };
type WorkoutExercise = { name: string; prescription: string; sets: ExerciseSet[] };

const DEFAULT_PLANS: Record<string, { title: string; exercises: { name: string; prescription: string }[] }[]> = {
  'Híbrido Performance': [
    {
      title: 'Força Base + Hyrox Engine',
      exercises: [
        { name: 'Agachamento Livre', prescription: '4x6-8' },
        { name: 'Supino Reto', prescription: '4x8' },
        { name: 'SkiErg / Remo Ergômetro', prescription: '4x500m' },
        { name: 'Wall Balls', prescription: '3x25' },
      ],
    },
    {
      title: 'Upper Body + Corrida Limiar',
      exercises: [
        { name: 'Puxada Frontal / Barra Fixa', prescription: '4x8-10' },
        { name: 'Desenvolvimento Halteres', prescription: '3x10' },
        { name: 'Farmer Carry', prescription: '4x40m' },
        { name: 'Tempo Run (Zona 4)', prescription: '25 min' },
      ],
    },
  ],
  'ABCDE 5 Dias': [
    {
      title: 'Treino A • Peito',
      exercises: [
        { name: 'Supino Reto Barra', prescription: '4x8-10' },
        { name: 'Supino Inclinado Halteres', prescription: '4x10' },
        { name: 'Crucifixo Máquina / Polia', prescription: '3x12' },
      ],
    },
    {
      title: 'Treino B • Costas',
      exercises: [
        { name: 'Puxada Frontal', prescription: '4x10' },
        { name: 'Remada Curvada', prescription: '4x8-10' },
        { name: 'Remada Baixa Triângulo', prescription: '3x12' },
      ],
    },
    {
      title: 'Treino C • Pernas',
      exercises: [
        { name: 'Agachamento Livre', prescription: '4x8' },
        { name: 'Leg Press 45°', prescription: '4x10' },
        { name: 'Mesa Flexora', prescription: '3x12' },
      ],
    },
    {
      title: 'Treino D • Ombros',
      exercises: [
        { name: 'Desenvolvimento Militar', prescription: '4x8-10' },
        { name: 'Elevação Lateral', prescription: '4x15' },
        { name: 'Crucifixo Invertido', prescription: '3x12' },
      ],
    },
    {
      title: 'Treino E • Braços & Core',
      exercises: [
        { name: 'Rosca Direta Barra', prescription: '4x10' },
        { name: 'Tríceps Testa / Corda', prescription: '4x10' },
        { name: 'Prancha Abdominal', prescription: '3x60s' },
      ],
    },
  ],
  'Upper / Lower': [
    {
      title: 'Upper A (Força)',
      exercises: [
        { name: 'Supino Inclinado', prescription: '4x8' },
        { name: 'Remada Curvada', prescription: '4x8' },
        { name: 'Elevação Lateral', prescription: '3x15' },
      ],
    },
    {
      title: 'Lower A (Força)',
      exercises: [
        { name: 'Leg Press 45°', prescription: '4x10' },
        { name: 'Mesa Flexora', prescription: '3x12' },
        { name: 'Panturrilha em Pé', prescription: '4x15' },
      ],
    },
  ],
  'Full Body 3x': [
    {
      title: 'Full Body Completo',
      exercises: [
        { name: 'Agachamento Livre', prescription: '3x8' },
        { name: 'Supino Reto', prescription: '3x8' },
        { name: 'Puxada Frontal', prescription: '3x10' },
        { name: 'Remo Ergômetro', prescription: '3x500m' },
      ],
    },
  ],
};

const todayStr = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

function formatPace(paceDecimal: number) {
  if (!paceDecimal || !isFinite(paceDecimal)) return '--';
  const mins = Math.floor(paceDecimal);
  const secs = Math.round((paceDecimal - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')} min/km`;
}

export default function App() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<'hoje' | 'agenda' | 'corrida' | 'comunidade' | 'alunos' | 'progresso'>('hoje');
  const [loading, setLoading] = useState(true);

  // Auth states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginNick, setLoginNick] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regName, setRegName] = useState('');
  const [regNick, setRegNick] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regRole, setRegRole] = useState<'atleta' | 'treinador'>('atleta');
  const [regGender, setRegGender] = useState('M');
  const [regAge, setRegAge] = useState('28');
  const [regHeight, setRegHeight] = useState('175');
  const [regWeight, setRegWeight] = useState('75');

  // Data states
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [bodyHistory, setBodyHistory] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [assignedPlans, setAssignedPlans] = useState<any[]>([]);
  const [customPlans, setCustomPlans] = useState<any[]>([]);

  // Active workout state
  const [selectedCategory, setSelectedCategory] = useState<string>('Híbrido Performance');
  const [sessionTitle, setSessionTitle] = useState('Força Base + Hyrox Engine');
  const [sessionExercises, setSessionExercises] = useState<WorkoutExercise[]>([
    { name: 'Agachamento Livre', prescription: '4x6-8', sets: [{ weight: 60, reps: 8, done: false }] },
  ]);
  const [newExName, setNewExName] = useState('');
  const [newExPresc, setNewExPresc] = useState('3x12');

  // Calendar state
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(todayStr());

  // Check-in & Water state
  const [sleepH, setSleepH] = useState('7.5');
  const [mood, setMood] = useState('8');
  const [soreness, setSoreness] = useState('3');
  const [waterMl, setWaterMl] = useState(0);

  // Run state
  const [runType, setRunType] = useState('Rodagem Leve');
  const [runDist, setRunDist] = useState('5');
  const [runDur, setRunDur] = useState('28');
  const [stravaIdInput, setStravaIdInput] = useState('');

  // Community post state
  const [postCaption, setPostCaption] = useState('');
  const [postMetrics, setPostMetrics] = useState('');
  const [postFile, setPostFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);

  // Body & Profile update states
  const [newWeight, setNewWeight] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [newBf, setNewBf] = useState('');
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editAge, setEditAge] = useState('28');
  const [editHeight, setEditHeight] = useState('175');
  const [editGender, setEditGender] = useState('M');
  const [editRole, setEditRole] = useState<'atleta' | 'treinador'>('atleta');

  // Coach & Student link states
  const [coachCodeInput, setCoachCodeInput] = useState('');
  const [targetStudentId, setTargetStudentId] = useState('');
  const [prescTitle, setPrescTitle] = useState('');
  const [prescNote, setPrescNote] = useState('');
  const [prescExercisesText, setPrescExercisesText] = useState('Agachamento Livre | 4x8\nCorrida Intervalada | 6x400m');

  async function loadAllData(activeId?: string, silent = false) {
    if (!silent) setLoading(true);
    const [uRes, wRes, rRes, cRes, bRes, pRes, aRes, cpRes] = await Promise.all([
      supabase.from('ch_users').select('*'),
      supabase.from('ch_workouts').select('*').order('created_at', { ascending: false }),
      supabase.from('ch_runs').select('*').order('created_at', { ascending: false }),
      supabase.from('ch_checkins').select('*').order('created_at', { ascending: false }),
      supabase.from('ch_body').select('*').order('created_at', { ascending: true }),
      supabase.from('ch_posts').select('*').order('created_at', { ascending: false }).limit(40),
      supabase.from('ch_assigned_plans').select('*').order('created_at', { ascending: false }),
      supabase.from('ch_custom_plans').select('*').order('created_at', { ascending: false }),
    ]);

    const allUsers = (uRes.data || []) as UserProfile[];
    setUsers(allUsers);
    setWorkouts(wRes.data || []);
    setRuns(rRes.data || []);
    setCheckins(cRes.data || []);
    setBodyHistory(bRes.data || []);
    setPosts(pRes.data || []);
    setAssignedPlans(aRes.data || []);
    setCustomPlans(cpRes.data || []);

    const savedId = activeId || localStorage.getItem('ch_user_id');
    if (savedId) {
      const found = allUsers.find((u) => u.id === savedId) || null;
      setCurrentUser(found);
      if (found && !silent) {
        const todayCi = (cRes.data || []).find((c: any) => c.user_id === found.id && c.date === todayStr());
        setWaterMl(todayCi?.water_ml || 0);
        setStravaIdInput(found.strava_athlete_id || '');
        setEditAge(String(found.age || 28));
        setEditHeight(String(found.height || 175));
        setEditGender(found.gender || 'M');
        setEditRole(found.role || 'atleta');
      }
    }
    if (!silent) setLoading(false);
  }

  useEffect(() => {
    loadAllData();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const user = users.find(
      (u) => u.nickname.toLowerCase() === loginNick.trim().toLowerCase() && u.password === loginPass
    );
    if (!user) return alert('Apelido ou senha incorretos.');
    localStorage.setItem('ch_user_id', user.id);
    await loadAllData(user.id);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim() || !regNick.trim() || !regPass.trim()) return alert('Preencha nome, apelido e senha.');
    if (users.some((u) => u.nickname.toLowerCase() === regNick.trim().toLowerCase())) {
      return alert('Esse apelido já está em uso.');
    }
    const inviteCode = regRole === 'treinador'
      ? `CH-${regNick.trim().toUpperCase().slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`
      : null;

    const payload = {
      name: regName.trim(),
      nickname: regNick.trim(),
      objective: 'Performance Híbrida',
      plan: 'Híbrido Performance',
      password: regPass,
      role: regRole,
      invite_code: inviteCode,
      gender: regGender,
      age: Number(regAge) || 28,
      height: Number(regHeight) || 175,
      weight: Number(regWeight.replace(',', '.')) || 75,
    };

    const { data, error } = await supabase.from('ch_users').insert(payload).select().single();
    if (error || !data) return alert('Erro ao cadastrar: ' + error?.message);

    await supabase.from('ch_body').insert({
      user_id: data.id,
      date: todayStr(),
      weight: payload.weight,
      waist: 0,
    });

    localStorage.setItem('ch_user_id', data.id);
    await loadAllData(data.id);
  }

  async function saveProfileSettings() {
    if (!currentUser) return;
    const inviteCode = editRole === 'treinador'
      ? (currentUser.invite_code || `CH-${currentUser.nickname.toUpperCase().slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`)
      : currentUser.invite_code;

    await supabase.from('ch_users').update({
      age: Number(editAge) || 28,
      height: Number(editHeight) || 175,
      gender: editGender,
      role: editRole,
      invite_code: inviteCode,
    }).eq('id', currentUser.id);

    setEditProfileOpen(false);
    alert(editRole === 'treinador'
      ? `Perfil atualizado! Seu código de Treinador é: ${inviteCode}`
      : 'Dados biométricos do perfil atualizados!');
    loadAllData(currentUser.id, true);
  }

  const liveVolume = useMemo(() => {
    return sessionExercises.reduce(
      (acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0),
      0
    );
  }, [sessionExercises]);

  async function saveWorkout() {
    if (!currentUser) return;
    const points = 100 + Math.min(80, Math.round(liveVolume / 250));
    const { error } = await supabase.from('ch_workouts').insert({
      user_id: currentUser.id,
      date: todayStr(),
      plan: selectedCategory,
      day_label: 'Sessão',
      title: sessionTitle,
      exercises: sessionExercises,
      volume: liveVolume,
      points,
    });
    if (error) return alert('Erro ao salvar treino: ' + error.message);
    setPostMetrics(`${sessionTitle} • Volume: ${liveVolume} kg`);
    alert(`Treino salvo no histórico! +${points} pts no ranking.`);
    loadAllData(currentUser.id, true);
  }

  async function saveAsCustomPlan() {
    if (!currentUser) return;
    await supabase.from('ch_custom_plans').insert({
      user_id: currentUser.id,
      title: sessionTitle,
      category: 'Personalizado',
      exercises: sessionExercises.map((e) => ({ name: e.name, prescription: e.prescription })),
    });
    alert(`Ficha "${sessionTitle}" salva nos seus modelos!`);
    loadAllData(currentUser.id, true);
  }

  async function deleteWorkout(id: string) {
    if (!currentUser || !confirm('Excluir este treino do histórico?')) return;
    await supabase.from('ch_workouts').delete().eq('id', id);
    loadAllData(currentUser.id, true);
  }

  async function handleWaterChange(newMl: number) {
    if (!currentUser) return;
    setWaterMl(newMl);
    const goalMl = Math.round(((currentUser.weight || 75) * 35) / 50) * 50;
    const existing = checkins.find((c) => c.user_id === currentUser.id && c.date === todayStr());

    if (existing) {
      setCheckins((prev) =>
        prev.map((c) => (c.id === existing.id ? { ...c, water_ml: newMl, water_goal_ml: goalMl } : c))
      );
      await supabase.from('ch_checkins').update({ water_ml: newMl, water_goal_ml: goalMl }).eq('id', existing.id);
    } else {
      const newRow = {
        user_id: currentUser.id,
        date: todayStr(),
        sleep: Number(sleepH.replace(',', '.')) || 7.5,
        mood: Number(mood) || 8,
        soreness: Number(soreness) || 3,
        readiness: 80,
        water_ml: newMl,
        water_goal_ml: goalMl,
      };
      const { data } = await supabase.from('ch_checkins').insert(newRow).select().single();
      if (data) setCheckins((prev) => [data, ...prev]);
    }
  }

  async function saveCheckin() {
    if (!currentUser) return;
    const s = Number(sleepH.replace(',', '.')) || 7;
    const m = Number(mood) || 7;
    const sor = Number(soreness) || 4;
    const readiness = Math.min(100, Math.max(20, Math.round(s * 6 + m * 4 + (10 - sor) * 2)));
    const goalMl = Math.round(((currentUser.weight || 75) * 35) / 50) * 50;
    const existing = checkins.find((c) => c.user_id === currentUser.id && c.date === todayStr());

    if (existing) {
      await supabase.from('ch_checkins').update({ sleep: s, mood: m, soreness: sor, readiness, water_ml: waterMl, water_goal_ml: goalMl }).eq('id', existing.id);
    } else {
      await supabase.from('ch_checkins').insert({
        user_id: currentUser.id,
        date: todayStr(),
        sleep: s,
        mood: m,
        soreness: sor,
        readiness,
        water_ml: waterMl,
        water_goal_ml: goalMl,
      });
    }
    alert(`Check-in salvo! Prontidão hoje: ${readiness}%`);
    loadAllData(currentUser.id, true);
  }

  async function saveRun() {
    if (!currentUser) return;
    const dist = Number(runDist.replace(',', '.')) || 0;
    const dur = Number(runDur.replace(',', '.')) || 0;
    if (dist <= 0 || dur <= 0) return alert('Informe distância e duração válidas.');
    const pace = Number((dur / dist).toFixed(2));
    await supabase.from('ch_runs').insert({
      user_id: currentUser.id,
      date: todayStr(),
      type: runType,
      distance: dist,
      duration: dur,
      pace,
    });
    setPostMetrics(`Corrida (${runType}) • ${dist} km • ${formatPace(pace)}`);
    alert(`Corrida salva! Ritmo médio: ${formatPace(pace)}`);
    loadAllData(currentUser.id, true);
  }

  async function handleGpxUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const text = await file.text();
    const trkpts = Array.from(text.matchAll(/<trkpt[^>]*lat="([^"]+)"[^>]*lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g));
    if (trkpts.length < 2) return alert('Arquivo GPX sem pontos suficientes.');

    let totalKm = 0;
    const toRad = (v: number) => (v * Math.PI) / 180;
    for (let i = 1; i < trkpts.length; i++) {
      const lat1 = Number(trkpts[i - 1][1]), lon1 = Number(trkpts[i - 1][2]);
      const lat2 = Number(trkpts[i][1]), lon2 = Number(trkpts[i][2]);
      const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      totalKm += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    const times = Array.from(text.matchAll(/<time>([^<]+)<\/time>/g)).map((m) => new Date(m[1]).getTime());
    const durMin = times.length >= 2 ? Math.max(1, (times[times.length - 1] - times[0]) / 60000) : totalKm * 5.5;
    const localDate = times[0]
      ? new Date(times[0] - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
      : todayStr();

    const distFixed = Number(totalKm.toFixed(2));
    const durFixed = Number(durMin.toFixed(1));
    const pace = Number((durFixed / Math.max(0.1, distFixed)).toFixed(2));

    await supabase.from('ch_runs').insert({
      user_id: currentUser.id,
      date: localDate,
      type: 'Importado GPX/Strava',
      distance: distFixed,
      duration: durFixed,
      pace,
    });
    alert(`GPX importado! ${distFixed} km em ${durFixed} min (Data: ${localDate})`);
    loadAllData(currentUser.id, true);
  }

  async function saveStravaLink() {
    if (!currentUser) return;
    await supabase.from('ch_users').update({ strava_athlete_id: stravaIdInput.trim() }).eq('id', currentUser.id);
    alert('ID/Perfil Strava vinculado com sucesso!');
    loadAllData(currentUser.id, true);
  }

  async function publishPost() {
    if (!currentUser) return;
    if (!postCaption.trim() && !postFile) return alert('Escreva uma legenda ou escolha uma foto do treino.');
    setPosting(true);
    let imageUrl: string | null = null;

    if (postFile) {
      const ext = postFile.name.split('.').pop() || 'jpg';
      const filePath = `${currentUser.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('workout-photos').upload(filePath, postFile);
      if (upErr) {
        setPosting(false);
        return alert('Erro ao enviar foto: ' + upErr.message);
      }
      const { data: pub } = supabase.storage.from('workout-photos').getPublicUrl(filePath);
      imageUrl = pub.publicUrl;
    }

    await supabase.from('ch_posts').insert({
      user_id: currentUser.id,
      caption: postCaption.trim(),
      image_url: imageUrl,
      activity_type: 'Treino Híbrido',
      metrics_summary: postMetrics,
      likes: [],
      comments: [],
    });

    setPostCaption('');
    setPostMetrics('');
    setPostFile(null);
    setPosting(false);
    loadAllData(currentUser.id, true);
  }

  async function toggleLike(post: any) {
    if (!currentUser) return;
    const likes: string[] = Array.isArray(post.likes) ? post.likes : [];
    const updated = likes.includes(currentUser.id)
      ? likes.filter((id) => id !== currentUser.id)
      : [...likes, currentUser.id];
    await supabase.from('ch_posts').update({ likes: updated }).eq('id', post.id);
    loadAllData(currentUser.id, true);
  }

  async function linkToCoach() {
    if (!currentUser) return;
    const coach = users.find((u) => u.role === 'treinador' && u.invite_code?.toUpperCase() === coachCodeInput.trim().toUpperCase());
    if (!coach) return alert('Código de treinador não encontrado.');
    await supabase.from('ch_users').update({ coach_id: coach.id }).eq('id', currentUser.id);
    alert(`Vinculado ao treinador ${coach.name}!`);
    setCoachCodeInput('');
    loadAllData(currentUser.id, true);
  }

  async function prescribeWorkout() {
    if (!currentUser || !targetStudentId || !prescTitle.trim()) return alert('Selecione o aluno e o título do treino.');
    const parsed = prescExercisesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, prescription] = line.split('|').map((p) => p.trim());
        return { name: name || 'Exercício', prescription: prescription || '3x10' };
      });

    await supabase.from('ch_assigned_plans').insert({
      coach_id: currentUser.id,
      student_id: targetStudentId,
      title: prescTitle.trim(),
      day_label: todayStr(),
      note: prescNote.trim(),
      exercises: parsed,
    });
    alert('Treino enviado para o painel HOJE do aluno!');
    setPrescTitle('');
    setPrescNote('');
    loadAllData(currentUser.id, true);
  }

  async function saveBodyMetrics() {
    if (!currentUser || !newWeight) return alert('Informe o peso atual.');
    const w = Number(newWeight.replace(',', '.'));
    const waist = newWaist ? Number(newWaist.replace(',', '.')) : 0;
    const bf = newBf ? Number(newBf.replace(',', '.')) : null;

    await supabase.from('ch_body').insert({
      user_id: currentUser.id,
      date: todayStr(),
      weight: w,
      waist,
      body_fat: bf,
    });
    await supabase.from('ch_users').update({ weight: w }).eq('id', currentUser.id);
    setNewWeight('');
    setNewWaist('');
    setNewBf('');
    loadAllData(currentUser.id, true);
  }

  const ranking = useMemo(() => {
    return users
      .map((u) => {
        const uW = workouts.filter((w) => w.user_id === u.id);
        const uR = runs.filter((r) => r.user_id === u.id);
        const uC = checkins.filter((c) => c.user_id === u.id);
        const pts =
          uW.reduce((s, w) => s + (Number(w.points) || 100), 0) +
          uR.reduce((s, r) => s + Math.round((Number(r.distance) || 0) * 15), 0) +
          uC.reduce((s, c) => s + 20 + ((c.water_ml || 0) >= (c.water_goal_ml || 2625) ? 5 : 0), 0);
        return { ...u, pts };
      })
      .sort((a, b) => b.pts - a.pts);
  }, [users, workouts, runs, checkins]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#C8FF00] flex items-center justify-center font-bold tracking-widest">
        CARREGANDO O CARA HÍBRIDO 3.0...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 space-y-5">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold tracking-widest text-[#C8FF00]">VERSÃO 3.0 • COMUNIDADE & COACH</span>
            <h1 className="font-poster text-3xl font-black tracking-tight">O CARA HÍBRIDO</h1>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded-xl border border-[#2A2A2A]">
            <button onClick={() => setAuthMode('login')} className={`py-2 rounded-lg text-xs font-bold ${authMode === 'login' ? 'bg-[#C8FF00] text-black' : 'text-[#A8A8A8]'}`}>
              ENTRAR
            </button>
            <button onClick={() => setAuthMode('register')} className={`py-2 rounded-lg text-xs font-bold ${authMode === 'register' ? 'bg-[#C8FF00] text-black' : 'text-[#A8A8A8]'}`}>
              CRIAR CONTA
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <input value={loginNick} onChange={(e) => setLoginNick(e.target.value)} placeholder="Seu apelido" className="w-full bg-black border border-[#2A2A2A] rounded-xl p-3 text-sm" />
              <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="Sua senha" className="w-full bg-black border border-[#2A2A2A] rounded-xl p-3 text-sm" />
              <button type="submit" className="w-full bg-[#C8FF00] text-black font-black py-3 rounded-xl text-sm">ACESSAR PLATAFORMA</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRegRole('atleta')} className={`py-2 rounded-xl text-xs font-bold border ${regRole === 'atleta' ? 'border-[#C8FF00] bg-[#C8FF00]/15 text-[#C8FF00]' : 'border-[#2A2A2A] text-[#A8A8A8]'}`}>
                  SOU ATLETA
                </button>
                <button type="button" onClick={() => setRegRole('treinador')} className={`py-2 rounded-xl text-xs font-bold border ${regRole === 'treinador' ? 'border-[#C8FF00] bg-[#C8FF00]/15 text-[#C8FF00]' : 'border-[#2A2A2A] text-[#A8A8A8]'}`}>
                  SOU TREINADOR
                </button>
              </div>
              <input value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Nome completo" className="w-full bg-black border border-[#2A2A2A] rounded-xl p-3 text-sm" />
              <input value={regNick} onChange={(e) => setRegNick(e.target.value)} placeholder="Apelido (ex: Thz)" className="w-full bg-black border border-[#2A2A2A] rounded-xl p-3 text-sm" />
              <input type="password" value={regPass} onChange={(e) => setRegPass(e.target.value)} placeholder="Senha" className="w-full bg-black border border-[#2A2A2A] rounded-xl p-3 text-sm" />
              <div className="grid grid-cols-4 gap-2 text-xs">
                <select value={regGender} onChange={(e) => setRegGender(e.target.value)} className="bg-black border border-[#2A2A2A] rounded-xl p-2.5">
                  <option value="M">Masc</option>
                  <option value="F">Fem</option>
                </select>
                <input value={regAge} onChange={(e) => setRegAge(e.target.value)} placeholder="Idade" className="bg-black border border-[#2A2A2A] rounded-xl p-2.5" />
                <input value={regHeight} onChange={(e) => setRegHeight(e.target.value)} placeholder="Alt(cm)" className="bg-black border border-[#2A2A2A] rounded-xl p-2.5" />
                <input value={regWeight} onChange={(e) => setRegWeight(e.target.value)} placeholder="Peso(kg)" className="bg-black border border-[#2A2A2A] rounded-xl p-2.5" />
              </div>
              <button type="submit" className="w-full bg-[#C8FF00] text-black font-black py-3 rounded-xl text-sm">CRIAR PERFIL 3.0</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const myWorkouts = workouts.filter((w) => w.user_id === currentUser.id);
  const myRuns = runs.filter((r) => r.user_id === currentUser.id);
  const myCheckins = checkins.filter((c) => c.user_id === currentUser.id);
  const myBody = bodyHistory.filter((b) => b.user_id === currentUser.id);
  const myAssigned = assignedPlans.filter((p) => p.student_id === currentUser.id);
  const myCustom = customPlans.filter((p) => p.user_id === currentUser.id);
  const myStudents = users.filter((u) => u.coach_id === currentUser.id);
  const totalVolumeKg = myWorkouts.reduce((acc, w) => acc + (Number(w.volume) || 0), 0);

  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const availableTemplates = selectedCategory === 'Minhas Fichas'
    ? myCustom.map((cp) => ({ title: cp.title, exercises: cp.exercises || [] }))
    : DEFAULT_PLANS[selectedCategory] || [];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-[#2A2A2A] px-4 py-3 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#C8FF00] block">
            {currentUser.role === 'treinador' ? `TREINADOR • CÓDIGO: ${currentUser.invite_code}` : 'O CARA HÍBRIDO 3.0'}
          </span>
          <h1 className="font-poster text-lg font-black">{currentUser.name}</h1>
        </div>
        <button
          onClick={() => { localStorage.removeItem('ch_user_id'); setCurrentUser(null); }}
          className="p-2 rounded-xl bg-[#141414] border border-[#2A2A2A] text-[#A8A8A8] hover:text-white"
        >
          <LogOut size={16} />
        </button>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-5">
        {tab === 'hoje' && (
          <>
            <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold tracking-widest text-[#C8FF00]">CHECK-IN & HIDRATAÇÃO DIÁRIA</h2>
                <span className="text-[11px] text-[#A8A8A8]">{todayStr()}</span>
              </div>

              <WaterSlider weightKg={currentUser.weight || 75} currentMl={waterMl} onChangeMl={handleWaterChange} />

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-[#A8A8A8]">SONO (H)</label>
                  <input value={sleepH} onChange={(e) => setSleepH(e.target.value)} className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] text-[#A8A8A8]">DISPOSIÇÃO (1-10)</label>
                  <input value={mood} onChange={(e) => setMood(e.target.value)} className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] text-[#A8A8A8]">DOR MUSC. (1-10)</label>
                  <input value={soreness} onChange={(e) => setSoreness(e.target.value)} className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2 mt-1" />
                </div>
              </div>
              <button onClick={saveCheckin} className="w-full bg-[#C8FF00]/15 border border-[#C8FF00] text-[#C8FF00] font-bold py-2.5 rounded-xl text-xs">
                SALVAR CHECK-IN (+20 PTS)
              </button>
            </section>

            {myAssigned.length > 0 && (
              <section className="bg-[#141414] border border-[#C8FF00]/50 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold tracking-widest text-[#C8FF00] flex items-center gap-1.5">
                  <UserCheck size={14} /> TREINOS PRESCRITOS PELO SEU TREINADOR
                </span>
                {myAssigned.map((ap) => (
                  <div key={ap.id} className="bg-black border border-[#2A2A2A] rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="text-sm">{ap.title}</strong>
                      <button
                        onClick={() => {
                          setSessionTitle(ap.title);
                          setSessionExercises(
                            (ap.exercises || []).map((ex: any) => ({
                              name: ex.name,
                              prescription: ex.prescription,
                              sets: [{ weight: 0, reps: 10, done: false }],
                            }))
                          );
                        }}
                        className="bg-[#C8FF00] text-black text-[11px] font-black px-3 py-1 rounded-lg"
                      >
                        CARREGAR TREINO
                      </button>
                    </div>
                    {ap.note && <p className="text-xs text-[#A8A8A8]">{ap.note}</p>}
                  </div>
                ))}
              </section>
            )}

            <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-4">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <span className="text-[10px] font-bold tracking-widest text-[#C8FF00]">SESSÃO DE TREINO</span>
                  <input value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} className="w-full bg-transparent font-poster text-base font-bold text-white focus:outline-none" />
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[#A8A8A8] block">VOLUME AO VIVO</span>
                  <strong className="font-poster text-lg text-[#C8FF00]">{liveVolume} kg</strong>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#A8A8A8] block">ESCOLHER DIVISÃO DO PLANO:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[...Object.keys(DEFAULT_PLANS), ...(myCustom.length > 0 ? ['Minhas Fichas'] : [])].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                        selectedCategory === cat ? 'bg-[#C8FF00] text-black border-[#C8FF00]' : 'bg-black border-[#2A2A2A] text-[#A8A8A8]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {availableTemplates.map((tpl: any, i: number) => (
                    <button
                      key={`${tpl.title}-${i}`}
                      onClick={() => {
                        setSessionTitle(tpl.title);
                        setSessionExercises(tpl.exercises.map((e: any) => ({ ...e, sets: [{ weight: 0, reps: 10, done: false }] })));
                      }}
                      className={`text-left bg-black border px-3 py-2 rounded-xl text-xs font-bold ${
                        sessionTitle === tpl.title ? 'border-[#C8FF00] text-[#C8FF00]' : 'border-[#2A2A2A] text-white'
                      }`}
                    >
                      {tpl.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {sessionExercises.map((ex, exIdx) => (
                  <div key={exIdx} className="bg-black border border-[#2A2A2A] rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <ExerciseThumbnail name={ex.name} prescription={ex.prescription} />
                        <div>
                          <strong className="text-sm block">{ex.name}</strong>
                          <span className="text-[11px] text-[#A8A8A8]">{ex.prescription}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSessionExercises(sessionExercises.filter((_, i) => i !== exIdx))}
                        className="text-[#A8A8A8] hover:text-red-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {ex.sets.map((s, sIdx) => (
                      <div key={sIdx} className="grid grid-cols-4 gap-2 items-center text-xs">
                        <span className="text-[#A8A8A8] font-bold">Série {sIdx + 1}</span>
                        <input
                          type="number"
                          value={s.weight}
                          onChange={(e) => {
                            const copy = [...sessionExercises];
                            copy[exIdx].sets[sIdx].weight = Number(e.target.value);
                            setSessionExercises(copy);
                          }}
                          placeholder="kg"
                          className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-2 text-center"
                        />
                        <input
                          type="number"
                          value={s.reps}
                          onChange={(e) => {
                            const copy = [...sessionExercises];
                            copy[exIdx].sets[sIdx].reps = Number(e.target.value);
                            setSessionExercises(copy);
                          }}
                          placeholder="reps"
                          className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-2 text-center"
                        />
                        <button
                          onClick={() => {
                            const copy = [...sessionExercises];
                            copy[exIdx].sets[sIdx].done = !copy[exIdx].sets[sIdx].done;
                            setSessionExercises(copy);
                          }}
                          className={`py-2 rounded-lg font-bold ${s.done ? 'bg-[#C8FF00] text-black' : 'bg-[#141414] text-[#A8A8A8]'}`}
                        >
                          ✓
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        const copy = [...sessionExercises];
                        const last = copy[exIdx].sets[copy[exIdx].sets.length - 1] || { weight: 0, reps: 10, done: false };
                        copy[exIdx].sets.push({ ...last, done: false });
                        setSessionExercises(copy);
                      }}
                      className="text-[11px] font-bold text-[#C8FF00]"
                    >
                      + Adicionar Série
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input value={newExName} onChange={(e) => setNewExName(e.target.value)} placeholder="Novo exercício (ex: Remo, Supino...)" className="flex-1 bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-xs" />
                <input value={newExPresc} onChange={(e) => setNewExPresc(e.target.value)} placeholder="3x12" className="w-20 bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-xs text-center" />
                <button
                  onClick={() => {
                    if (!newExName.trim()) return;
                    setSessionExercises([...sessionExercises, { name: newExName.trim(), prescription: newExPresc, sets: [{ weight: 0, reps: 10, done: false }] }]);
                    setNewExName('');
                  }}
                  className="bg-[#141414] border border-[#C8FF00] text-[#C8FF00] px-3 rounded-xl font-bold text-xs"
                >
                  +
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button onClick={saveAsCustomPlan} className="col-span-1 bg-black border border-[#2A2A2A] text-[#A8A8A8] hover:text-white font-bold py-3 rounded-xl text-[11px]">
                  SALVAR FICHA
                </button>
                <button onClick={saveWorkout} className="col-span-2 bg-[#C8FF00] text-black font-black py-3 rounded-xl text-xs">
                  CONCLUIR E SALVAR TREINO
                </button>
              </div>
            </section>

            <section className="space-y-2">
              <span className="text-xs font-bold tracking-widest text-[#A8A8A8]">HISTÓRICO DE TREINOS REALIZADOS ({myWorkouts.length})</span>
              {myWorkouts.map((w) => (
                <div key={w.id} className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-3 flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-white block">{w.title}</strong>
                    <span className="text-[#A8A8A8]">{w.date} • Volume: {w.volume || 0} kg</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#C8FF00]">+{w.points || 100} pts</span>
                    <button onClick={() => deleteWorkout(w.id)} className="text-[#A8A8A8] hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {tab === 'agenda' && (
          <section className="space-y-4">
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} className="p-1.5 bg-black border border-[#2A2A2A] rounded-lg">
                  <ChevronLeft size={16} />
                </button>
                <span className="font-poster text-sm font-bold uppercase">
                  {calMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} className="p-1.5 bg-black border border-[#2A2A2A] rounded-lg">
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[#A8A8A8] font-bold">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstWeekday }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const hasW = myWorkouts.some((w) => w.date === iso);
                  const hasR = myRuns.some((r) => r.date === iso);
                  const hasC = myCheckins.some((c) => c.date === iso);
                  const isSelected = selectedDay === iso;

                  return (
                    <button
                      key={iso}
                      onClick={() => setSelectedDay(iso)}
                      className={`h-11 rounded-xl border flex flex-col items-center justify-center text-xs font-bold ${
                        isSelected ? 'border-[#C8FF00] bg-[#C8FF00]/15 text-white' : 'border-[#2A2A2A] bg-black text-[#D4D4D4]'
                      }`}
                    >
                      <span>{dayNum}</span>
                      <div className="flex gap-0.5 mt-0.5">
                        {hasW && <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00]" />}
                        {hasR && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                        {hasC && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-center gap-4 text-[10px] text-[#A8A8A8] pt-1">
                <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#C8FF00] inline-block" /> Treino</span>
                <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Corrida</span>
                <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Check-in</span>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-2 text-xs">
              <span className="text-xs font-bold tracking-widest text-[#C8FF00]">ATIVIDADES EM {selectedDay}</span>
              {myWorkouts.filter((w) => w.date === selectedDay).map((w) => (
                <div key={w.id} className="bg-black border border-[#2A2A2A] rounded-xl p-2.5">
                  <strong className="text-[#C8FF00]">Musculação/Hyrox:</strong> {w.title} ({w.volume} kg)
                </div>
              ))}
              {myRuns.filter((r) => r.date === selectedDay).map((r) => (
                <div key={r.id} className="bg-black border border-[#2A2A2A] rounded-xl p-2.5">
                  <strong className="text-orange-400">Corrida:</strong> {r.type} • {r.distance} km ({formatPace(r.pace)})
                </div>
              ))}
              {myCheckins.filter((c) => c.date === selectedDay).map((c) => (
                <div key={c.id} className="bg-black border border-[#2A2A2A] rounded-xl p-2.5">
                  <strong className="text-sky-400">Check-in:</strong> Prontidão {c.readiness}% • Água: {c.water_ml || 0} ml
                </div>
              ))}
              {!myWorkouts.some((w) => w.date === selectedDay) &&
                !myRuns.some((r) => r.date === selectedDay) &&
                !myCheckins.some((c) => c.date === selectedDay) && (
                  <p className="text-[#A8A8A8]">Nenhum registro encontrado nesta data.</p>
                )}
            </div>
          </section>
        )}

        {tab === 'corrida' && (
          <section className="space-y-4">
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold tracking-widest text-[#C8FF00]">REGISTRAR CORRIDA</span>
              <div className="flex flex-wrap gap-1.5">
                {['Rodagem Leve', 'Tempo Run', 'Tiros / Intervalado', 'Longão', 'Esteira'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setRunType(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border ${runType === t ? 'bg-[#C8FF00] text-black border-[#C8FF00]' : 'bg-black border-[#2A2A2A] text-[#A8A8A8]'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-[#A8A8A8]">DISTÂNCIA (KM)</label>
                  <input value={runDist} onChange={(e) => setRunDist(e.target.value)} className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] text-[#A8A8A8]">DURAÇÃO (MIN)</label>
                  <input value={runDur} onChange={(e) => setRunDur(e.target.value)} className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 mt-1" />
                </div>
              </div>
              <button onClick={saveRun} className="w-full bg-[#C8FF00] text-black font-black py-3 rounded-xl text-sm">SALVAR CORRIDA</button>
            </div>

            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold tracking-widest text-orange-400">INTEGRAÇÃO STRAVA & RELÓGIOS (.GPX)</span>
              <label className="flex items-center justify-center gap-2 bg-black border border-dashed border-[#2A2A2A] hover:border-[#C8FF00] rounded-xl p-3 text-xs font-bold cursor-pointer">
                <Upload size={16} className="text-[#C8FF00]" /> IMPORTAR ARQUIVO .GPX DO RELÓGIO / STRAVA
                <input type="file" accept=".gpx" onChange={handleGpxUpload} className="hidden" />
              </label>
              <div className="flex gap-2">
                <input value={stravaIdInput} onChange={(e) => setStravaIdInput(e.target.value)} placeholder="Seu @ ou ID Strava" className="flex-1 bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-xs" />
                <button onClick={saveStravaLink} className="bg-orange-500 text-black font-black px-4 rounded-xl text-xs">VINCULAR</button>
              </div>
            </div>

            <div className="space-y-2">
              {myRuns.map((r) => (
                <div key={r.id} className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-3 flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-white block">{r.type} • {r.distance} km</strong>
                    <span className="text-[#A8A8A8]">{r.date} • {r.duration} min</span>
                  </div>
                  <span className="font-poster text-sm text-[#C8FF00]">{formatPace(r.pace)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'comunidade' && (
          <section className="space-y-4">
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold tracking-widest text-[#C8FF00]">MURAL DA DISCIPLINA • POSTAR TREINO</span>
              <textarea
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                placeholder="Compartilhe seu treino, sensação ou meta batida hoje..."
                className="w-full bg-black border border-[#2A2A2A] rounded-xl p-3 text-xs h-20"
              />
              {postMetrics && (
                <div className="bg-black border border-[#C8FF00]/40 rounded-lg px-3 py-1.5 text-[11px] text-[#C8FF00] font-bold">
                  Resumo anexado: {postMetrics}
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 bg-black border border-[#2A2A2A] px-3 py-2 rounded-xl text-xs font-bold cursor-pointer">
                  <Camera size={15} className="text-[#C8FF00]" /> {postFile ? postFile.name.slice(0, 18) : 'Adicionar Foto'}
                  <input type="file" accept="image/*" onChange={(e) => setPostFile(e.target.files?.[0] || null)} className="hidden" />
                </label>
                <button disabled={posting} onClick={publishPost} className="bg-[#C8FF00] text-black font-black px-5 py-2 rounded-xl text-xs flex items-center gap-1.5">
                  <Send size={14} /> {posting ? 'ENVIANDO...' : 'PUBLICAR'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {posts.map((p) => {
                const author = users.find((u) => u.id === p.user_id);
                const likes: string[] = Array.isArray(p.likes) ? p.likes : [];
                const liked = likes.includes(currentUser.id);
                return (
                  <article key={p.id} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                    <div className="p-3 flex justify-between items-center">
                      <div>
                        <strong className="text-xs block">{author?.name || 'Atleta'}</strong>
                        <span className="text-[10px] text-[#A8A8A8]">{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {p.metrics_summary && (
                        <span className="text-[10px] font-bold bg-[#C8FF00]/15 text-[#C8FF00] px-2.5 py-1 rounded-full">{p.metrics_summary}</span>
                      )}
                    </div>
                    {p.image_url && <img src={p.image_url} alt="Treino" className="w-full max-h-80 object-cover bg-black" />}
                    <div className="p-3 space-y-2">
                      {p.caption && <p className="text-xs text-[#E5E5E5]">{p.caption}</p>}
                      <button
                        onClick={() => toggleLike(p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${liked ? 'bg-[#C8FF00] text-black border-[#C8FF00]' : 'bg-black border-[#2A2A2A] text-[#A8A8A8]'}`}
                      >
                        <Flame size={14} /> Disciplina! ({likes.length})
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === 'alunos' && (
          <section className="space-y-4">
            {currentUser.role === 'atleta' ? (
              <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold tracking-widest text-[#C8FF00]">VINCULAR A UM TREINADOR</span>
                <p className="text-xs text-[#A8A8A8]">Peça o código de convite ao seu treinador para receber treinos personalizados direto na aba Hoje.</p>
                <div className="flex gap-2">
                  <input value={coachCodeInput} onChange={(e) => setCoachCodeInput(e.target.value)} placeholder="Ex: CH-THZ-123" className="flex-1 bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-xs uppercase" />
                  <button onClick={linkToCoach} className="bg-[#C8FF00] text-black font-black px-4 rounded-xl text-xs">CONECTAR</button>
                </div>
                <div className="pt-2 border-t border-[#2A2A2A]">
                  <p className="text-[11px] text-[#A8A8A8] mb-2">Você é o treinador? Ative o modo Coach no seu perfil:</p>
                  <button
                    onClick={() => { setTab('progresso'); setEditProfileOpen(true); }}
                    className="w-full bg-black border border-[#C8FF00] text-[#C8FF00] font-bold py-2 rounded-xl text-xs"
                  >
                    ATIVAR MODO TREINADOR (COACH)
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-[#141414] border border-[#C8FF00]/40 rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-bold tracking-widest text-[#C8FF00]">SEU CÓDIGO DE CONVITE PARA ALUNOS</span>
                  <strong className="font-poster text-2xl text-white block">{currentUser.invite_code}</strong>
                </div>

                <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
                  <span className="text-xs font-bold tracking-widest text-[#C8FF00]">PRESCREVER TREINO REMOTO</span>
                  <select value={targetStudentId} onChange={(e) => setTargetStudentId(e.target.value)} className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-xs">
                    <option value="">Selecione o aluno...</option>
                    {myStudents.map((st) => (
                      <option key={st.id} value={st.id}>{st.name} (@{st.nickname})</option>
                    ))}
                  </select>
                  <input value={prescTitle} onChange={(e) => setPrescTitle(e.target.value)} placeholder="Título (ex: Força Inferiores + 5km)" className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-xs" />
                  <textarea value={prescExercisesText} onChange={(e) => setPrescExercisesText(e.target.value)} className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-xs h-24 font-mono" />
                  <input value={prescNote} onChange={(e) => setPrescNote(e.target.value)} placeholder="Observação técnica do treinador..." className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-xs" />
                  <button onClick={prescribeWorkout} className="w-full bg-[#C8FF00] text-black font-black py-3 rounded-xl text-xs">ENVIAR TREINO PARA O ALUNO</button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold tracking-widest text-[#A8A8A8]">MEUS ALUNOS ({myStudents.length})</span>
                  {myStudents.map((st) => {
                    const lastCi = checkins.find((c) => c.user_id === st.id);
                    const stWorkouts = workouts.filter((w) => w.user_id === st.id).length;
                    return (
                      <div key={st.id} className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-3 flex justify-between items-center text-xs">
                        <div>
                          <strong className="block">{st.name}</strong>
                          <span className="text-[#A8A8A8]">Treinos: {stWorkouts} • Água hoje: {lastCi?.date === todayStr() ? `${lastCi.water_ml || 0}ml` : '0ml'}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full font-bold bg-[#C8FF00]/15 text-[#C8FF00]">
                          Prontidão: {lastCi?.readiness ? `${lastCi.readiness}%` : '--'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {tab === 'progresso' && (
          <section className="space-y-4">
            <DynamicAvatar
              gender={currentUser.gender || 'M'}
              age={currentUser.age || 28}
              height={currentUser.height || 175}
              history={myBody.length > 0 ? myBody : [{ date: todayStr(), weight: currentUser.weight || 75 }]}
              totalVolumeKg={totalVolumeKg}
              streak={myWorkouts.length}
            />

            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold tracking-widest text-[#C8FF00]">DADOS FIXOS & MODO TREINADOR</span>
                <button
                  onClick={() => setEditProfileOpen(!editProfileOpen)}
                  className="text-xs font-bold text-[#C8FF00] flex items-center gap-1 bg-black border border-[#2A2A2A] px-3 py-1.5 rounded-xl"
                >
                  <Settings size={13} /> {editProfileOpen ? 'FECHAR' : 'EDITAR PERFIL'}
                </button>
              </div>

              {editProfileOpen && (
                <div className="space-y-3 pt-2 border-t border-[#2A2A2A] text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-[#A8A8A8]">IDADE</label>
                      <input value={editAge} onChange={(e) => setEditAge(e.target.value)} className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2 mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#A8A8A8]">ALTURA (CM)</label>
                      <input value={editHeight} onChange={(e) => setEditHeight(e.target.value)} className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2 mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#A8A8A8]">GÊNERO</label>
                      <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2 mt-1">
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#A8A8A8] block mb-1">TIPO DE CONTA NA PLATAFORMA</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditRole('atleta')}
                        className={`py-2 rounded-xl font-bold border ${editRole === 'atleta' ? 'border-[#C8FF00] bg-[#C8FF00]/15 text-[#C8FF00]' : 'border-[#2A2A2A] text-[#A8A8A8]'}`}
                      >
                        ATLETA
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditRole('treinador')}
                        className={`py-2 rounded-xl font-bold border ${editRole === 'treinador' ? 'border-[#C8FF00] bg-[#C8FF00]/15 text-[#C8FF00]' : 'border-[#2A2A2A] text-[#A8A8A8]'}`}
                      >
                        TREINADOR (COACH)
                      </button>
                    </div>
                  </div>

                  <button onClick={saveProfileSettings} className="w-full bg-[#C8FF00] text-black font-black py-2.5 rounded-xl">
                    SALVAR CONFIGURAÇÕES DO PERFIL
                  </button>
                </div>
              )}
            </div>

            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold tracking-widest text-[#C8FF00]">ATUALIZAR MEDIDAS CORPORAIS</span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <input value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="Peso (kg)" className="bg-black border border-[#2A2A2A] rounded-xl p-2.5" />
                <input value={newWaist} onChange={(e) => setNewWaist(e.target.value)} placeholder="Cintura (cm)" className="bg-black border border-[#2A2A2A] rounded-xl p-2.5" />
                <input value={newBf} onChange={(e) => setNewBf(e.target.value)} placeholder="% BF (opc)" className="bg-black border border-[#2A2A2A] rounded-xl p-2.5" />
              </div>
              <button onClick={saveBodyMetrics} className="w-full bg-[#C8FF00] text-black font-black py-2.5 rounded-xl text-xs">ATUALIZAR AVATAR</button>
            </div>

            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold tracking-widest text-[#C8FF00] flex items-center gap-1.5">
                <Trophy size={14} /> RANKING DA DISCIPLINA
              </span>
              {ranking.map((u, idx) => (
                <div key={u.id} className="flex justify-between items-center bg-black border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs">
                  <span><strong className="text-[#C8FF00]">#{idx + 1}</strong> {u.name}</span>
                  <strong className="font-poster text-sm">{u.pts} pts</strong>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-[#0A0A0A]/95 backdrop-blur border-t border-[#2A2A2A] px-1 py-2 flex justify-around text-[9px] font-bold">
        {[
          { id: 'hoje', label: 'HOJE', icon: Dumbbell },
          { id: 'agenda', label: 'AGENDA', icon: CalIcon },
          { id: 'corrida', label: 'CORRIDA', icon: Footprints },
          { id: 'comunidade', label: 'MURAL', icon: Camera },
          { id: 'alunos', label: currentUser.role === 'treinador' ? 'ALUNOS' : 'COACH', icon: Users },
          { id: 'progresso', label: 'AVATAR', icon: Activity },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id as any)}
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl ${active ? 'text-[#C8FF00]' : 'text-[#A8A8A8]'}`}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}