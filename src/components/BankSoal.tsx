import React, { useState } from 'react';
import { QuestionSet } from '../types/question';
import {
  BookOpen,
  Search,
  Filter,
  FileText,
  Printer,
  Trash2,
  Eye,
  Plus,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { exportQuestionSetToDocx } from '../utils/docxExport';

interface BankSoalProps {
  questionSets: QuestionSet[];
  onViewQuestionSet: (set: QuestionSet) => void;
  onDeleteQuestionSet: (id: string) => void;
  onStartGenerator: () => void;
}

export const BankSoal: React.FC<BankSoalProps> = ({
  questionSets,
  onViewQuestionSet,
  onDeleteQuestionSet,
  onStartGenerator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedCurriculum, setSelectedCurriculum] = useState('all');

  const subjectsList = Array.from(new Set(questionSets.map((s) => s.subject)));

  const filteredSets = questionSets.filter((set) => {
    const matchesSearch =
      set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.learningObjectives.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject =
      selectedSubject === 'all' || set.subject === selectedSubject;

    const matchesCurriculum =
      selectedCurriculum === 'all' || set.curriculum === selectedCurriculum;

    return matchesSearch && matchesSubject && matchesCurriculum;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>Bank Soal Terintegrasi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kumpulan seluruh naskah soal asesmen tersimpan ({questionSets.length} paket soal).
          </p>
        </div>

        <button
          onClick={onStartGenerator}
          className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Paket Soal Baru</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci, topik, mata pelajaran..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="all">Semua Mata Pelajaran</option>
            {subjectsList.map((sub, idx) => (
              <option key={idx} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Curriculum Filter */}
          <select
            value={selectedCurriculum}
            onChange={(e) => setSelectedCurriculum(e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="all">Semua Kurikulum</option>
            <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
            <option value="Kurikulum 2013 (K13)">Kurikulum 2013 (K13)</option>
          </select>

        </div>
      </div>

      {/* Sets Grid */}
      {filteredSets.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Tidak ada paket soal yang ditemukan</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau buat paket soal baru menggunakan Generator Soal AI.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSets.map((set) => (
            <div
              key={set.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs">
                    {set.subject}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(set.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h3
                  onClick={() => onViewQuestionSet(set)}
                  className="text-base font-extrabold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer leading-snug"
                >
                  {set.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {set.learningObjectives}
                </p>

                {/* Difficulty Distribution Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{set.questions.length} Butir Soal ({set.durationMinutes} mnt)</span>
                    <span>
                      {set.difficultyDistribution.mudah}% M / {set.difficultyDistribution.sedang}% S / {set.difficultyDistribution.sukar}% K
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                    <div style={{ width: `${set.difficultyDistribution.mudah}%` }} className="bg-emerald-500" />
                    <div style={{ width: `${set.difficultyDistribution.sedang}%` }} className="bg-amber-500" />
                    <div style={{ width: `${set.difficultyDistribution.sukar}%` }} className="bg-rose-500" />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onViewQuestionSet(set)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat & Edit</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => exportQuestionSetToDocx(set, { includeAnswers: false })}
                    className="px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
                    title="Unduh Naskah Word (.docx)"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Word</span>
                  </button>

                  <button
                    onClick={() => onDeleteQuestionSet(set.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus Paket Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
