import React from 'react';
import { QuestionSet } from '../types/question';
import {
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  Printer,
  FileText,
  Plus,
  BarChart3,
  CheckCircle2,
  Clock,
  Zap,
  Layers,
  ArrowRight,
  Trash2,
  Eye,
} from 'lucide-react';
import { exportQuestionSetToDocx } from '../utils/docxExport';

interface DashboardProps {
  questionSets: QuestionSet[];
  onStartGenerator: (presetSubject?: string) => void;
  onViewQuestionSet: (set: QuestionSet) => void;
  onDeleteQuestionSet: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  questionSets,
  onStartGenerator,
  onViewQuestionSet,
  onDeleteQuestionSet,
}) => {
  const totalQuestionsCount = questionSets.reduce(
    (acc, set) => acc + (set.questions ? set.questions.length : 0),
    0
  );

  const popularSubjects = [
    { name: 'Ilmu Pengetahuan Alam (IPA)', icon: '🧬', color: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
    { name: 'Matematika', icon: '📐', color: 'border-blue-200 bg-blue-50 text-blue-800' },
    { name: 'Bahasa Indonesia', icon: '📖', color: 'border-indigo-200 bg-indigo-50 text-indigo-800' },
    { name: 'Bahasa Inggris', icon: '🌐', color: 'border-purple-200 bg-purple-50 text-purple-800' },
    { name: 'Pendidikan Pancasila', icon: '🇮🇩', color: 'border-red-200 bg-red-50 text-red-800' },
    { name: 'Informatika', icon: '💻', color: 'border-cyan-200 bg-cyan-50 text-cyan-800' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-indigo-700/30">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-10 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-4 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>AI Question Generator untuk Guru Indonesia</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Buat Naskah Soal Ujian & Asesmen Otomatis Sesuai Kurikulum
          </h1>

          <p className="mt-3 text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            Hasilkan paket soal berstandar Kurikulum Merdeka & K13 secara presisi. Dilengkapi distribusi tingkat kesukaran persentase, kisi-kisi Taksonomi Bloom, kunci jawaban, pembahasan, serta ekspor langsung ke Microsoft Word (.docx) dan PDF.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartGenerator()}
              className="px-5 py-3 rounded-xl bg-white text-indigo-950 font-bold text-sm hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-950/20 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600" />
              <span>Mulai Buat Soal Otomatis</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <a
              href="#bank-soal-section"
              className="px-5 py-3 rounded-xl bg-indigo-800/40 hover:bg-indigo-800/60 text-white font-medium text-sm border border-indigo-400/20 transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Buka Bank Soal ({questionSets.length})</span>
            </a>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Soal Tergenerasi</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {totalQuestionsCount} <span className="text-xs font-normal text-slate-500">butir</span>
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Paket Soal Tersimpan</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {questionSets.length} <span className="text-xs font-normal text-slate-500">paket</span>
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Kurikulum Didukung</p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              Merdeka & K13
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Format Ekspor</p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              MS Word (.docx) & PDF
            </p>
          </div>
        </div>
      </div>

      {/* Subject Quick Generator Presets */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pilih Mata Pelajaran Favorit</h2>
            <p className="text-xs text-slate-500">Klik untuk langsung membuka generator dengan prasetel mata pelajaran</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {popularSubjects.map((sub, idx) => (
            <button
              key={idx}
              onClick={() => onStartGenerator(sub.name)}
              className={`p-3.5 rounded-xl border text-left transition-all hover:scale-[1.02] hover:shadow-sm flex flex-col justify-between gap-3 ${sub.color}`}
            >
              <span className="text-2xl">{sub.icon}</span>
              <div>
                <p className="text-xs font-bold leading-tight line-clamp-2">{sub.name}</p>
                <p className="text-[10px] opacity-75 font-medium mt-1 flex items-center gap-1">
                  <span>Buat Soal</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Question Sets Table Section */}
      <div id="bank-soal-section" className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Daftar Paket Soal di Bank Soal</span>
            </h2>
            <p className="text-xs text-slate-500">
              Kelola, pratinjau, cetak, atau unduh naskah soal dalam format Word (.docx)
            </p>
          </div>

          <button
            onClick={() => onStartGenerator()}
            className="px-3.5 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Paket Soal Baru</span>
          </button>
        </div>

        {questionSets.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Belum ada paket soal tersimpan</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Gunakan Generator Soal AI untuk membuat paket soal ujian pertama Anda dalam hitungan detik.
            </p>
            <button
              onClick={() => onStartGenerator()}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Mulai Generasi Soal Sekarang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {questionSets.map((set) => (
              <div
                key={set.id}
                className="p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {set.subject}
                    </span>
                    <span>·</span>
                    <span>{set.gradeClass}</span>
                    <span>·</span>
                    <span>{set.curriculum}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {set.durationMinutes} Menit
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => onViewQuestionSet(set)}>
                    {set.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">
                      {set.questions.length} Butir Soal
                    </span>
                    <span>·</span>
                    <span className="text-slate-500">
                      Distribusi: <span className="text-emerald-600 font-medium">Mudah {set.difficultyDistribution.mudah}%</span> /{' '}
                      <span className="text-amber-600 font-medium">Sedang {set.difficultyDistribution.sedang}%</span> /{' '}
                      <span className="text-rose-600 font-medium">Sukar {set.difficultyDistribution.sukar}%</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <button
                    onClick={() => onViewQuestionSet(set)}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Pratinjau & Edit Soal"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat & Edit</span>
                  </button>

                  <button
                    onClick={() => exportQuestionSetToDocx(set, { includeAnswers: false })}
                    className="px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Unduh Naskah Soal MS Word (.docx)"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Word (.docx)</span>
                  </button>

                  <button
                    onClick={() => onDeleteQuestionSet(set.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus Paket Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
