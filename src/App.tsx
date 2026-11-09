import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { GeneratorForm } from './components/GeneratorForm';
import { QuestionEditor } from './components/QuestionEditor';
import { BankSoal } from './components/BankSoal';
import { SchoolHeaderModal } from './components/SchoolHeaderModal';
import { QuestionSet, SchoolHeaderConfig, GenerateQuestionsRequest } from './types/question';
import { SAMPLE_QUESTION_SETS } from './data/sampleQuestionSets';

const STORAGE_KEY_SETS = 'edugen_ai_question_sets_v1';
const STORAGE_KEY_HEADER = 'edugen_ai_school_header_v1';

const DEFAULT_HEADER: SchoolHeaderConfig = {
  dinasYayasan: 'PEMERINTAH PROVINSI DKI JAKARTA / DINAS PENDIDIKAN',
  namaSekolah: 'SMA NEGERI 1 JAKARTA',
  alamatSekolah: 'Jl. Budi Utomo No. 7, Pasar Baru, Jakarta Pusat',
  nomorTelepon: 'Telp. (021) 386-5001',
  websiteEmail: 'sman1jkt.sch.id | info@sman1jkt.sch.id',
  tahunAjaran: '2025/2026',
  namaGuru: 'Ahmad Fauzi, S.Pd., M.Si.',
  nipGuru: '19850101 201001 1 001',
  namaKepalaSekolah: 'Dr. Hj. Ratna Sari, M.Pd.',
  nipKepalaSekolah: '19750202 199802 1 002',
  logoText: 'SMAN 1 JAKARTA',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'generator' | 'bank' | 'preview'>('dashboard');
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [activeQuestionSet, setActiveQuestionSet] = useState<QuestionSet | null>(null);
  const [generatorPresetSubject, setGeneratorPresetSubject] = useState<string>('');
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState<boolean>(false);
  const [headerConfig, setHeaderConfig] = useState<SchoolHeaderConfig>(DEFAULT_HEADER);

  // Load Initial Data from localStorage
  useEffect(() => {
    try {
      const savedSets = localStorage.getItem(STORAGE_KEY_SETS);
      if (savedSets) {
        const parsed = JSON.parse(savedSets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestionSets(parsed);
        } else {
          setQuestionSets(SAMPLE_QUESTION_SETS);
        }
      } else {
        setQuestionSets(SAMPLE_QUESTION_SETS);
      }

      const savedHeader = localStorage.getItem(STORAGE_KEY_HEADER);
      if (savedHeader) {
        setHeaderConfig(JSON.parse(savedHeader));
      }
    } catch (e) {
      setQuestionSets(SAMPLE_QUESTION_SETS);
    }
  }, []);

  // Save Question Sets to localStorage
  const saveQuestionSetsToStorage = (sets: QuestionSet[]) => {
    setQuestionSets(sets);
    try {
      localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(sets));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  };

  // Save Header Config to localStorage
  const handleSaveHeaderConfig = (newConfig: SchoolHeaderConfig) => {
    setHeaderConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY_HEADER, JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save header config', e);
    }
  };

  // Start Generator Callback
  const handleStartGenerator = (presetSubject?: string) => {
    if (presetSubject) {
      setGeneratorPresetSubject(presetSubject);
    } else {
      setGeneratorPresetSubject('');
    }
    setActiveTab('generator');
  };

  // Questions Generated Callback
  const handleQuestionsGenerated = (
    questions: any[],
    requestData: GenerateQuestionsRequest
  ) => {
    const newSet: QuestionSet = {
      id: `set-${Date.now()}`,
      title: `Asesmen Sumatif ${requestData.subject} - ${requestData.gradeClass}`,
      subject: requestData.subject,
      gradeClass: requestData.gradeClass,
      curriculum: requestData.curriculum,
      semester: requestData.semester,
      durationMinutes: requestData.durationMinutes,
      difficultyDistribution: requestData.difficultyDistribution,
      typeCounts: requestData.typeCounts,
      learningObjectives: requestData.learningObjectives,
      stimulusText: requestData.stimulusText,
      questions,
      createdAt: new Date().toISOString(),
      schoolHeader: headerConfig,
    };

    // Prepend to question sets & save
    const updatedSets = [newSet, ...questionSets];
    saveQuestionSetsToStorage(updatedSets);

    setActiveQuestionSet(newSet);
    setActiveTab('preview');
  };

  // Save / Update Set from QuestionEditor
  const handleSaveQuestionSet = (updatedSet: QuestionSet) => {
    const exists = questionSets.some((s) => s.id === updatedSet.id);
    let updatedSets: QuestionSet[];
    if (exists) {
      updatedSets = questionSets.map((s) => (s.id === updatedSet.id ? updatedSet : s));
    } else {
      updatedSets = [updatedSet, ...questionSets];
    }
    saveQuestionSetsToStorage(updatedSets);
    setActiveQuestionSet(updatedSet);
  };

  // Delete Question Set
  const handleDeleteQuestionSet = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus paket soal ini dari Bank Soal?')) {
      const filtered = questionSets.filter((s) => s.id !== id);
      saveQuestionSetsToStorage(filtered);
      if (activeQuestionSet?.id === id) {
        setActiveQuestionSet(null);
        setActiveTab('bank');
      }
    }
  };

  // View Question Set
  const handleViewQuestionSet = (set: QuestionSet) => {
    setActiveQuestionSet(set);
    setActiveTab('preview');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenHeaderSettings={() => setIsHeaderModalOpen(true)}
        onStartNewGenerator={() => handleStartGenerator()}
        questionSetCount={questionSets.length}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            questionSets={questionSets}
            onStartGenerator={handleStartGenerator}
            onViewQuestionSet={handleViewQuestionSet}
            onDeleteQuestionSet={handleDeleteQuestionSet}
          />
        )}

        {activeTab === 'generator' && (
          <GeneratorForm
            initialSubject={generatorPresetSubject}
            onQuestionsGenerated={handleQuestionsGenerated}
          />
        )}

        {activeTab === 'preview' && activeQuestionSet && (
          <QuestionEditor
            questionSet={activeQuestionSet}
            onSaveSet={handleSaveQuestionSet}
            onBack={() => setActiveTab('bank')}
            headerConfig={headerConfig}
            allQuestionSets={questionSets}
          />
        )}

        {activeTab === 'bank' && (
          <BankSoal
            questionSets={questionSets}
            onViewQuestionSet={handleViewQuestionSet}
            onDeleteQuestionSet={handleDeleteQuestionSet}
            onStartGenerator={() => handleStartGenerator()}
          />
        )}
      </main>

      {/* Footer (Hidden on print) */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} EduGen AI · Platform Generator Soal & Bank Soal Guru Indonesia</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsHeaderModalOpen(true)}
              className="hover:text-slate-800 transition-colors"
            >
              Pengaturan Kop Sekolah
            </button>
            <span>·</span>
            <button
              onClick={() => handleStartGenerator()}
              className="hover:text-slate-800 transition-colors font-medium text-indigo-600"
            >
              + Buat Soal Otomatis
            </button>
          </div>
        </div>
      </footer>

      {/* Kop Surat Modal */}
      <SchoolHeaderModal
        isOpen={isHeaderModalOpen}
        onClose={() => setIsHeaderModalOpen(false)}
        headerConfig={headerConfig}
        onSave={handleSaveHeaderConfig}
      />

    </div>
  );
}
