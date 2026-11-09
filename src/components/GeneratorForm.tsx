import React, { useState } from 'react';
import { GenerateQuestionsRequest, QuestionSet } from '../types/question';
import {
  Sparkles,
  BookOpen,
  Sliders,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle,
  Wand2,
  ListOrdered,
  Percent,
  Clock,
  RotateCcw,
  Bot,
} from 'lucide-react';

interface GeneratorFormProps {
  initialSubject?: string;
  onQuestionsGenerated: (
    questions: any[],
    requestData: GenerateQuestionsRequest
  ) => void;
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({
  initialSubject = '',
  onQuestionsGenerated,
}) => {
  const [subject, setSubject] = useState(initialSubject || 'Ilmu Pengetahuan Alam (IPA)');
  const [customSubject, setCustomSubject] = useState('');
  const [gradeClass, setGradeClass] = useState('Kelas 8 (SMP)');
  const [curriculum, setCurriculum] = useState<'Kurikulum Merdeka' | 'Kurikulum 2013 (K13)' | 'Lainnya'>('Kurikulum Merdeka');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [durationMinutes, setDurationMinutes] = useState(90);

  // Question Type Counts
  const [typeCounts, setTypeCounts] = useState({
    pg: 5,
    isian: 2,
    uraian: 1,
    menjodohkan: 1,
    bs: 1,
  });

  // Difficulty Distribution
  const [difficultyDistribution, setDifficultyDistribution] = useState({
    mudah: 30,
    sedang: 50,
    sukar: 20,
  });

  // Learning Objectives & Stimulus
  const [learningObjectives, setLearningObjectives] = useState(
    'Menganalisis konsep dasar, struktur, fungsi, dan penerapan ilmiah dalam kehidupan sehari-hari.'
  );
  const [stimulusText, setStimulusText] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingStimulus, setIsGeneratingStimulus] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const subjectsList = [
    'Ilmu Pengetahuan Alam (IPA)',
    'Matematika',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Ilmu Pengetahuan Sosial (IPS)',
    'Pendidikan Pancasila',
    'Informatika / TIK',
    'Fisika',
    'Kimia',
    'Biologi',
    'Sejarah',
    'Ekonomi',
    'Sosiologi',
    'Seni Budaya',
    'PJOK',
    'Lainnya (Tulis Sendiri)',
  ];

  const totalQuestions =
    typeCounts.pg +
    typeCounts.isian +
    typeCounts.uraian +
    typeCounts.menjodohkan +
    typeCounts.bs;

  const totalPercentage =
    difficultyDistribution.mudah +
    difficultyDistribution.sedang +
    difficultyDistribution.sukar;

  // Preset Handlers
  const handlePresetDistribution = (mudah: number, sedang: number, sukar: number) => {
    setDifficultyDistribution({ mudah, sedang, sukar });
  };

  const handleDifficultyChange = (field: 'mudah' | 'sedang' | 'sukar', val: number) => {
    setDifficultyDistribution((prev) => {
      const next = { ...prev, [field]: val };
      return next;
    });
  };

  // AI Stimulus Generator
  const handleAutoGenerateStimulus = async () => {
    const finalSubject = subject === 'Lainnya (Tulis Sendiri)' ? customSubject : subject;
    if (!finalSubject) {
      setErrorMessage('Pilih atau tuliskan mata pelajaran terlebih dahulu.');
      return;
    }

    setIsGeneratingStimulus(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/generate-stimulus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: finalSubject,
          gradeClass,
          topic: learningObjectives,
        }),
      });

      const data = await response.json();
      if (data.success && data.stimulusText) {
        setStimulusText(data.stimulusText);
      } else {
        setErrorMessage(data.error || 'Gagal menghasilkan stimulus otomatis.');
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan koneksi saat membuat stimulus.');
    } finally {
      setIsGeneratingStimulus(false);
    }
  };

  // Generate Questions Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalSubject = subject === 'Lainnya (Tulis Sendiri)' ? customSubject : subject;

    if (!finalSubject.trim()) {
      setErrorMessage('Silakan isi mata pelajaran.');
      return;
    }

    if (totalQuestions <= 0) {
      setErrorMessage('Minimal tentukan 1 jumlah soal.');
      return;
    }

    if (totalPercentage !== 100) {
      setErrorMessage(`Total persentase tingkat kesukaran harus 100%. (Saat ini: ${totalPercentage}%)`);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setLoadingStep(1);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 2500);

    const requestData: GenerateQuestionsRequest = {
      subject: finalSubject,
      gradeClass,
      curriculum,
      semester,
      durationMinutes,
      learningObjectives,
      stimulusText,
      difficultyDistribution,
      typeCounts,
      customInstruction,
    };

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error('Respon dari server tidak valid.');
      }

      if (response.ok && data.success && data.questions && data.questions.length > 0) {
        clearInterval(stepInterval);
        onQuestionsGenerated(data.questions, requestData);
      } else {
        clearInterval(stepInterval);
        setErrorMessage(
          data.error || 'Gagal menghasilkan soal AI. Silakan klik tombol "Generasi Naskah Soal" di bawah untuk mencoba kembali.'
        );
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setErrorMessage(
        err?.message || 'Terjadi kesalahan jaringan/server. Silakan periksa koneksi dan coba lagi.'
      );
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Generator Soal Otomatis AI
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur parameter identitas, jenis soal, rasio kesukaran persentase, dan indikator pembelajaran.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline shrink-0 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Identitas Mata Pelajaran & Kurikulum */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600 flex items-center gap-2 pb-3 border-b border-slate-100">
            <BookOpen className="w-4 h-4" />
            <span>1. Identitas Mata Pelajaran & Kurikulum</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Pelajaran
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                {subjectsList.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {subject === 'Lainnya (Tulis Sendiri)' && (
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Tuliskan nama mata pelajaran..."
                  className="mt-2 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kelas & Jenjang Pendidikan
              </label>
              <select
                value={gradeClass}
                onChange={(e) => setGradeClass(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                <optgroup label="Sekolah Dasar (SD)">
                  <option value="Kelas 1 (SD)">Kelas 1 (SD)</option>
                  <option value="Kelas 2 (SD)">Kelas 2 (SD)</option>
                  <option value="Kelas 3 (SD)">Kelas 3 (SD)</option>
                  <option value="Kelas 4 (SD)">Kelas 4 (SD)</option>
                  <option value="Kelas 5 (SD)">Kelas 5 (SD)</option>
                  <option value="Kelas 6 (SD)">Kelas 6 (SD)</option>
                </optgroup>
                <optgroup label="Sekolah Menengah Pertama (SMP)">
                  <option value="Kelas 7 (SMP)">Kelas 7 (SMP)</option>
                  <option value="Kelas 8 (SMP)">Kelas 8 (SMP)</option>
                  <option value="Kelas 9 (SMP)">Kelas 9 (SMP)</option>
                </optgroup>
                <optgroup label="Sekolah Menengah Atas / Kejuruan (SMA/SMK)">
                  <option value="Kelas 10 (SMA/SMK)">Kelas 10 (SMA/SMK)</option>
                  <option value="Kelas 11 (SMA/SMK)">Kelas 11 (SMA/SMK)</option>
                  <option value="Kelas 12 (SMA/SMK)">Kelas 12 (SMA/SMK)</option>
                </optgroup>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kurikulum
                </label>
                <select
                  value={curriculum}
                  onChange={(e: any) => setCurriculum(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                >
                  <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                  <option value="Kurikulum 2013 (K13)">Kurikulum 2013 (K13)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e: any) => setSemester(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alokasi Waktu Pengerjaan (Menit)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={15}
                  max={240}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none pl-8"
                />
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Jenis & Jumlah Soal */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600 flex items-center gap-2">
              <ListOrdered className="w-4 h-4" />
              <span>2. Jenis & Jumlah Soal</span>
            </h2>
            <div className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
              Total: {totalQuestions} Butir Soal
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Pilihan Ganda
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={typeCounts.pg}
                onChange={(e) => setTypeCounts({ ...typeCounts, pg: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs font-bold text-center rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Isian Singkat
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={typeCounts.isian}
                onChange={(e) => setTypeCounts({ ...typeCounts, isian: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs font-bold text-center rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Uraian / Essay
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={typeCounts.uraian}
                onChange={(e) => setTypeCounts({ ...typeCounts, uraian: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs font-bold text-center rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Menjodohkan
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={typeCounts.menjodohkan}
                onChange={(e) => setTypeCounts({ ...typeCounts, menjodohkan: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs font-bold text-center rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Benar / Salah
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={typeCounts.bs}
                onChange={(e) => setTypeCounts({ ...typeCounts, bs: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs font-bold text-center rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Tingkat Kesukaran (Persentase Interaktif) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600 flex items-center gap-2">
              <Percent className="w-4 h-4" />
              <span>3. Distribusi Tingkat Kesukaran (%)</span>
            </h2>

            {/* Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Prasetel:</span>
              <button
                type="button"
                onClick={() => handlePresetDistribution(30, 50, 20)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
              >
                Standar (30:50:20)
              </button>
              <button
                type="button"
                onClick={() => handlePresetDistribution(20, 40, 40)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition-colors"
              >
                HOTS (20:40:40)
              </button>
              <button
                type="button"
                onClick={() => handlePresetDistribution(60, 30, 10)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition-colors"
              >
                Dasar (60:30:10)
              </button>
            </div>
          </div>

          {/* Visual Percentage Bar */}
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
            <div
              style={{ width: `${difficultyDistribution.mudah}%` }}
              className="bg-emerald-500 transition-all duration-300"
              title={`Mudah: ${difficultyDistribution.mudah}%`}
            />
            <div
              style={{ width: `${difficultyDistribution.sedang}%` }}
              className="bg-amber-500 transition-all duration-300"
              title={`Sedang: ${difficultyDistribution.sedang}%`}
            />
            <div
              style={{ width: `${difficultyDistribution.sukar}%` }}
              className="bg-rose-500 transition-all duration-300"
              title={`Sukar: ${difficultyDistribution.sukar}%`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800">Mudah (LOTS)</span>
                <span className="text-xs font-extrabold text-emerald-700">{difficultyDistribution.mudah}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={difficultyDistribution.mudah}
                onChange={(e) => handleDifficultyChange('mudah', Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[10px] text-emerald-600 mt-1">
                ~{Math.round((totalQuestions * difficultyDistribution.mudah) / 100)} soal
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-800">Sedang (MOTS)</span>
                <span className="text-xs font-extrabold text-amber-700">{difficultyDistribution.sedang}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={difficultyDistribution.sedang}
                onChange={(e) => handleDifficultyChange('sedang', Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <p className="text-[10px] text-amber-600 mt-1">
                ~{Math.round((totalQuestions * difficultyDistribution.sedang) / 100)} soal
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-800">Sukar / HOTS</span>
                <span className="text-xs font-extrabold text-rose-700">{difficultyDistribution.sukar}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={difficultyDistribution.sukar}
                onChange={(e) => handleDifficultyChange('sukar', Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <p className="text-[10px] text-rose-600 mt-1">
                ~{Math.round((totalQuestions * difficultyDistribution.sukar) / 100)} soal
              </p>
            </div>
          </div>

          {totalPercentage !== 100 && (
            <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Total persentase saat ini = {totalPercentage}%. Mohon sesuaikan agar jumlah tepat 100%.</span>
            </p>
          )}
        </div>

        {/* Section 4: Tujuan Pembelajaran & Stimulus */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4" />
            <span>4. Tujuan Pembelajaran (TP) & Teks Stimulus</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Capaian / Tujuan Pembelajaran (CP / TP / Indikator Soal)
            </label>
            <textarea
              rows={3}
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              placeholder="Tuliskan TP/CP atau topik materi yang diuji..."
              className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Teks Bacaan / Stimulus Kasus / Cerita (Opsional)
              </label>

              <button
                type="button"
                onClick={handleAutoGenerateStimulus}
                disabled={isGeneratingStimulus}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 disabled:opacity-50"
              >
                <Wand2 className="w-3 h-3" />
                <span>{isGeneratingStimulus ? 'Membuat Teks AI...' : '✨ Buatkan Teks Stimulus AI'}</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={stimulusText}
              onChange={(e) => setStimulusText(e.target.value)}
              placeholder="Sertakan teks narasi, kasus, atau potongan berita jika soal membutuhkan bacaan acuan..."
              className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed italic"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instruksi Tambahan Khusus Guru (Opsional)
            </label>
            <input
              type="text"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Misal: Sertakan analisis lingkungan lokal, gunakan bahasa komunikatif, dll..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Submit Button & Generation State */}
        <div className="pt-2">
          {isLoading ? (
            <div className="p-6 rounded-2xl bg-indigo-950 text-white text-center space-y-4 shadow-xl animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/50 flex items-center justify-center mx-auto text-indigo-200">
                <Bot className="w-6 h-6 animate-spin" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">AI Sedang Menyusun Soal Ujian...</h3>
                <p className="text-xs text-indigo-200/80 mt-1">
                  Proses ini membutuhkan beberapa detik untuk menjamin kualitas naskah & pembahasan.
                </p>
              </div>

              {/* Progress Steps */}
              <div className="max-w-md mx-auto space-y-2 text-left pt-2">
                <div className={`flex items-center gap-2 text-xs font-medium ${loadingStep >= 1 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>1. Menganalisis Indikator CP/TP & Kurikulum</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-medium ${loadingStep >= 2 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>2. Menyusun Kisi-kisi & Taksonomi Bloom (C1-C6)</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-medium ${loadingStep >= 3 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>3. Menggenerasi Soal & Pilihan Jawaban (A-E)</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-medium ${loadingStep >= 4 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>4. Menghasilkan Kunci Jawaban & Pembahasan Detail</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              disabled={totalPercentage !== 100}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-sm sm:text-base transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Generasi Naskah Soal Otomatis dengan AI</span>
            </button>
          )}
        </div>

      </form>
    </div>
  );
};
