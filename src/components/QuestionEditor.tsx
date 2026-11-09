import React, { useState } from 'react';
import { QuestionSet, QuestionItem, SchoolHeaderConfig } from '../types/question';
import { SAMPLE_QUESTION_SETS } from '../data/sampleQuestionSets';
import {
  FileText,
  Printer,
  Save,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Check,
  Building2,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  Award,
  Layers,
  CheckCircle2,
  Key,
  BookOpenCheck,
  X,
  Download,
  Maximize2,
  FileCheck,
  ExternalLink,
  Search,
  Filter,
  CheckSquare,
  Square,
  CopyPlus,
  BookOpen,
} from 'lucide-react';
import { exportQuestionSetToDocx, DocxExportMode } from '../utils/docxExport';
import html2pdf from 'html2pdf.js';

interface QuestionEditorProps {
  questionSet: QuestionSet;
  onSaveSet: (updatedSet: QuestionSet) => void;
  onBack: () => void;
  headerConfig: SchoolHeaderConfig;
  allQuestionSets?: QuestionSet[];
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  questionSet,
  onSaveSet,
  onBack,
  headerConfig,
  allQuestionSets,
}) => {
  const [currentSet, setCurrentSet] = useState<QuestionSet>({
    ...questionSet,
    schoolHeader: headerConfig,
  });

  const [viewMode, setViewMode] = useState<'student' | 'teacher' | 'edit'>('student');
  const [showAnswersInline, setShowAnswersInline] = useState<boolean>(false);
  const [includeKeyPage, setIncludeKeyPage] = useState<boolean>(true);
  const [showSignatureBlock, setShowSignatureBlock] = useState<boolean>(false);
  const [showQuestionBadges, setShowQuestionBadges] = useState<boolean>(false);
  const [isCompactPrint, setIsCompactPrint] = useState<boolean>(true);
  const [isSavedAlert, setIsSavedAlert] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Dedicated Print View Page State
  const [isPrintPageActive, setIsPrintPageActive] = useState<boolean>(false);

  // Export Modal State
  const [exportModalType, setExportModalType] = useState<'docx' | 'pdf' | null>(null);

  // Bank Soal Picker Modal State
  const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false);
  const [bankSearchText, setBankSearchText] = useState<string>('');
  const [bankSubjectFilter, setBankSubjectFilter] = useState<string>('all');
  const [bankTypeFilter, setBankTypeFilter] = useState<string>('all');
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState<string>('all');
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<
    Array<QuestionItem & { sourceSetTitle: string; sourceSubject: string; uniqueKey: string }>
  >([]);
  const [importAlertMessage, setImportAlertMessage] = useState<string | null>(null);

  // Available Bank Question Sets (Combine prop and sample sets to ensure rich choices)
  const sourceSets = React.useMemo(() => {
    if (allQuestionSets && allQuestionSets.length > 0) {
      // Merge allQuestionSets with sample sets if not already present
      const existingIds = new Set(allQuestionSets.map((s) => s.id));
      const missingSamples = SAMPLE_QUESTION_SETS.filter((s) => !existingIds.has(s.id));
      return [...allQuestionSets, ...missingSamples];
    }
    return SAMPLE_QUESTION_SETS;
  }, [allQuestionSets]);

  // Flattened Bank Questions
  const allBankQuestions = React.useMemo(() => {
    return sourceSets.flatMap((set) =>
      set.questions.map((q) => ({
        ...q,
        sourceSetId: set.id,
        sourceSetTitle: set.title,
        sourceSubject: set.subject,
        sourceGradeClass: set.gradeClass,
        uniqueKey: `${set.id}:::${q.id}`,
      }))
    );
  }, [sourceSets]);

  // Unique Subjects list for Filter dropdown
  const uniqueSubjects = React.useMemo(() => {
    const subjects = new Set<string>();
    sourceSets.forEach((s) => {
      if (s.subject) subjects.add(s.subject);
    });
    return Array.from(subjects);
  }, [sourceSets]);

  // Filtered Bank Questions
  const filteredBankQuestions = React.useMemo(() => {
    return allBankQuestions.filter((item) => {
      const matchesSearch =
        bankSearchText.trim() === '' ||
        item.questionText.toLowerCase().includes(bankSearchText.toLowerCase()) ||
        item.explanation.toLowerCase().includes(bankSearchText.toLowerCase()) ||
        item.sourceSubject.toLowerCase().includes(bankSearchText.toLowerCase()) ||
        item.sourceSetTitle.toLowerCase().includes(bankSearchText.toLowerCase());

      const matchesSubject =
        bankSubjectFilter === 'all' || item.sourceSubject.toLowerCase() === bankSubjectFilter.toLowerCase();

      const matchesType = bankTypeFilter === 'all' || item.type === bankTypeFilter;

      const matchesDifficulty = bankDifficultyFilter === 'all' || item.difficulty === bankDifficultyFilter;

      return matchesSearch && matchesSubject && matchesType && matchesDifficulty;
    });
  }, [allBankQuestions, bankSearchText, bankSubjectFilter, bankTypeFilter, bankDifficultyFilter]);

  const toggleSelectBankQuestion = (
    item: QuestionItem & { sourceSetTitle: string; sourceSubject: string; uniqueKey: string }
  ) => {
    setSelectedBankQuestions((prev) => {
      const exists = prev.some((q) => q.uniqueKey === item.uniqueKey);
      if (exists) {
        return prev.filter((q) => q.uniqueKey !== item.uniqueKey);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedBankQuestions.length === filteredBankQuestions.length) {
      setSelectedBankQuestions([]);
    } else {
      setSelectedBankQuestions([...filteredBankQuestions]);
    }
  };

  const handleImportSelectedBankQuestions = () => {
    if (selectedBankQuestions.length === 0) return;

    const newItems: QuestionItem[] = selectedBankQuestions.map((q, idx) => ({
      id: `imported-q-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      number: currentSet.questions.length + idx + 1,
      type: q.type,
      difficulty: q.difficulty,
      bloomLevel: q.bloomLevel,
      questionText: q.questionText,
      options: q.options ? [...q.options] : undefined,
      matchingPairs: q.matchingPairs ? q.matchingPairs.map((p) => ({ ...p })) : undefined,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      scoreWeight: q.scoreWeight,
      learningObjective: q.learningObjective,
    }));

    setCurrentSet((prev) => {
      const combined = [...prev.questions, ...newItems];
      const renumbered = combined.map((item, index) => ({
        ...item,
        number: index + 1,
      }));
      return { ...prev, questions: renumbered };
    });

    setImportAlertMessage(`Berhasil menambahkan ${selectedBankQuestions.length} soal dari Bank Soal ke naskah ini!`);
    setSelectedBankQuestions([]);
    setIsBankModalOpen(false);
    setTimeout(() => setImportAlertMessage(null), 4000);
  };

  const handleTitleChange = (val: string) => {
    setCurrentSet((prev) => ({ ...prev, title: val }));
  };

  const handleQuestionTextChange = (id: string, text: string) => {
    setCurrentSet((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === id ? { ...q, questionText: text } : q)),
    }));
  };

  const handleOptionChange = (questionId: string, optIdx: number, text: string) => {
    setCurrentSet((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q.id !== questionId || !q.options) return q;
        const newOpts = [...q.options];
        newOpts[optIdx] = text;
        return { ...q, options: newOpts };
      }),
    }));
  };

  const handleCorrectAnswerChange = (id: string, val: string) => {
    setCurrentSet((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === id ? { ...q, correctAnswer: val } : q)),
    }));
  };

  const handleExplanationChange = (id: string, text: string) => {
    setCurrentSet((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === id ? { ...q, explanation: text } : q)),
    }));
  };

  const handleDeleteQuestion = (id: string) => {
    setCurrentSet((prev) => {
      const filtered = prev.questions.filter((q) => q.id !== id);
      const renumbered = filtered.map((q, idx) => ({ ...q, number: idx + 1 }));
      return { ...prev, questions: renumbered };
    });
  };

  const handleAddQuestion = () => {
    const newQ: QuestionItem = {
      id: `manual-q-${Date.now()}`,
      number: currentSet.questions.length + 1,
      type: 'pg',
      difficulty: 'sedang',
      bloomLevel: 'C3',
      questionText: 'Tuliskan pertanyaan soal baru di sini...',
      options: [
        'A. Pilihan Jawaban A',
        'B. Pilihan Jawaban B',
        'C. Pilihan Jawaban C',
        'D. Pilihan Jawaban D',
        'E. Pilihan Jawaban E',
      ],
      correctAnswer: 'A',
      explanation: 'Tuliskan kunci pembahasan dan analisis logis di sini...',
      scoreWeight: 2,
    };

    setCurrentSet((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
    }));
  };

  const handleSaveToBank = () => {
    onSaveSet(currentSet);
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3000);
  };

  // Perform Docx Export based on selected mode
  const executeDocxExport = (mode: DocxExportMode) => {
    exportQuestionSetToDocx(currentSet, { mode, includeSignatures: showSignatureBlock });
    setExportModalType(null);
  };

  // Direct Client PDF File Generation via html2pdf
  const handleDownloadPdfFile = () => {
    const element = document.getElementById('printable-exam-sheet');
    if (!element) return;

    setIsGeneratingPdf(true);
    const cleanTitle = currentSet.title.replace(/[^a-zA-Z0-9_-]/g, '_');

    const opt = {
      margin: 10,
      filename: `${cleanTitle}_Naskah_Soal.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        setIsGeneratingPdf(false);
      })
      .catch((err: any) => {
        console.error('PDF Generation Error:', err);
        setIsGeneratingPdf(false);
        handlePopupPrint();
      });
  };

  // Clean Window Popup Print (Bypasses iframe restrictions)
  const handlePopupPrint = () => {
    const element = document.getElementById('printable-exam-sheet');
    if (!element) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=950,height=1000');
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${currentSet.title}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; background: #ffffff; padding: 15px; color: #000; font-size: 10.5pt; line-height: 1.3; }
            @page { size: A4; margin: 8mm 10mm; }
            .page-break { page-break-before: always; break-before: page; }
            .question-item-print { page-break-inside: avoid; break-inside: avoid; margin-bottom: 0.5rem; }
          </style>
        </head>
        <body>
          ${element.outerHTML}
          <script>
            setTimeout(function() {
              window.print();
            }, 600);
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Switch to dedicated Print Page
  const openPrintPage = (printAnswersInline: boolean, printKeyPage: boolean) => {
    setExportModalType(null);
    setShowAnswersInline(printAnswersInline);
    setIncludeKeyPage(printKeyPage);
    setIsPrintPageActive(true);
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'mudah':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">Mudah</span>;
      case 'sedang':
        return <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px]">Sedang</span>;
      case 'sukar':
        return <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px]">Sukar / HOTS</span>;
      default:
        return null;
    }
  };

  // Render Printable Paper Section
  const renderPaperDocument = () => (
    <div id="printable-exam-sheet" className={`bg-white rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto print-container ${isCompactPrint ? 'p-5 sm:p-7 space-y-3.5' : 'p-8 sm:p-12 space-y-6'}`}>
      
      {/* Kop Surat Sekolah Header */}
      <div className={`text-center border-b-2 border-slate-900 ${isCompactPrint ? 'pb-2 space-y-0.5' : 'pb-4 space-y-1'}`}>
        <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
          {headerConfig.dinasYayasan}
        </p>
        <p className="text-base sm:text-xl font-extrabold uppercase tracking-wide text-slate-900">
          {headerConfig.namaSekolah}
        </p>
        <p className="text-[11px] text-slate-600 italic">
          {headerConfig.alamatSekolah} | {headerConfig.nomorTelepon}
        </p>
        <p className="text-[11px] text-slate-600 italic">
          Email/Web: {headerConfig.websiteEmail}
        </p>
      </div>

      {/* Exam Title & Header Metadata */}
      <div className={`text-center ${isCompactPrint ? 'my-2 space-y-0.5' : 'my-4 space-y-1'}`}>
        <h2 className="text-base sm:text-lg font-bold uppercase text-slate-900 tracking-tight">
          NASKAH SOAL ASESMEN SUMATIF {currentSet.curriculum.toUpperCase()}
        </h2>
        <p className="text-xs font-semibold text-slate-700">
          TAHUN AJARAN {headerConfig.tahunAjaran}
        </p>
      </div>

      {/* Metadata Table */}
      <div className={`border border-slate-900 text-xs ${isCompactPrint ? 'p-2 grid grid-cols-2 gap-2' : 'p-3 grid grid-cols-2 gap-4'}`}>
        <div className="space-y-0.5">
          <p><span className="font-bold">Mata Pelajaran:</span> {currentSet.subject}</p>
          <p><span className="font-bold">Kelas / Semester:</span> {currentSet.gradeClass} / {currentSet.semester}</p>
        </div>
        <div className="space-y-0.5">
          <p><span className="font-bold">Alokasi Waktu:</span> {currentSet.durationMinutes} Menit</p>
          <p><span className="font-bold">Kurikulum:</span> {currentSet.curriculum}</p>
        </div>
      </div>

      {/* Petunjuk Umum */}
      <div className={`text-xs text-slate-800 bg-slate-50/50 rounded-lg border border-slate-200 ${isCompactPrint ? 'p-2 space-y-0.5 text-[10.5px]' : 'p-3 space-y-1 text-xs'}`}>
        <p className="font-bold uppercase text-slate-900">PETUNJUK UMUM:</p>
        <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-700">
          <li>Berdoalah sebelum mulai mengerjakan soal.</li>
          <li>Tuliskan nama dan nomor peserta Anda pada lembar jawaban yang tersedia.</li>
          <li>Bacalah setiap pertanyaan dengan teliti sebelum menentukan jawaban.</li>
          <li>Laporkan kepada pengawas jika terdapat tulisan yang kurang jelas atau rusak.</li>
        </ol>
      </div>

      {/* Stimulus Text if present */}
      {currentSet.stimulusText && (
        <div className="p-3 rounded-xl bg-indigo-50/50 border-l-4 border-indigo-600 text-xs text-slate-800 space-y-1">
          <p className="font-bold text-indigo-900 uppercase">TEKS STIMULUS / BACAAN ACUAN:</p>
          <p className="italic leading-relaxed">{currentSet.stimulusText}</p>
        </div>
      )}

      {/* Questions Render List */}
      <div className={`pt-2 ${isCompactPrint ? 'space-y-3' : 'space-y-6'}`}>
        {currentSet.questions.map((q) => (
          <div
            key={q.id}
            className={`question-item-print rounded-xl transition-all ${
              viewMode === 'edit'
                ? 'border-2 border-indigo-200 bg-slate-50/30 p-3 space-y-2'
                : isCompactPrint
                ? 'p-2 space-y-1 border border-transparent'
                : 'p-4 space-y-2 border border-transparent'
            }`}
          >
            {/* Question Item Header Bar (Only render badges if viewMode === 'edit' or showQuestionBadges === true) */}
            {(viewMode === 'edit' || showQuestionBadges) && (
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px] uppercase">
                    {q.type}
                  </span>

                  {getDifficultyBadge(q.difficulty)}

                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                    {q.bloomLevel}
                  </span>

                  <span className="text-[10px] text-slate-500 font-medium">
                    (Bobot: {q.scoreWeight})
                  </span>
                </div>

                {viewMode === 'edit' && (
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg no-print"
                    title="Hapus Soal Ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Question Text */}
            {viewMode === 'edit' ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Teks Pertanyaan Soal {q.number}:
                </label>
                <textarea
                  rows={2}
                  value={q.questionText}
                  onChange={(e) => handleQuestionTextChange(q.id, e.target.value)}
                  className="w-full p-2.5 text-xs font-medium rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                />
              </div>
            ) : (
              <p className="text-xs sm:text-sm font-medium text-slate-900 leading-snug pl-5 -indent-5">
                <span className="font-bold mr-1">{q.number}.</span>
                {q.questionText}
              </p>
            )}

            {/* Options for Pilihan Ganda (2-column layout in compact mode for paper saving!) */}
            {q.options && q.options.length > 0 && (
              <div className={`pl-5 ${isCompactPrint ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5' : 'space-y-1.5'}`}>
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="text-xs text-slate-800 leading-snug">
                    {viewMode === 'edit' ? (
                      <div className="flex items-center gap-2 my-0.5">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(q.id, optIdx, e.target.value)}
                          className="w-full p-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                        />
                      </div>
                    ) : (
                      <span className="font-normal">{opt}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Matching Pairs */}
            {q.matchingPairs && q.matchingPairs.length > 0 && (
              <div className="pl-5 pt-2">
                <table className="w-full text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold">
                      <th className="p-2 border border-slate-300 text-left">Kolom A (Pernyataan)</th>
                      <th className="p-2 border border-slate-300 text-left">Kolom B (Pasangan)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.matchingPairs.map((pair, pIdx) => (
                      <tr key={pair.id || pIdx} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-300">{pIdx + 1}. {pair.premis}</td>
                        <td className="p-2 border border-slate-300">{String.fromCharCode(65 + pIdx)}. {pair.respon}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* KUNCI JAWABAN DAN PEMBAHASAN INLINE BOX */}
            {(showAnswersInline || viewMode === 'teacher') && (
              <div className="p-4 rounded-xl bg-emerald-50/80 border-2 border-emerald-300/80 space-y-2 mt-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-200/60">
                  <span className="font-extrabold text-emerald-950 flex items-center gap-1.5 text-xs">
                    <Key className="w-4 h-4 text-emerald-600" />
                    <span>KUNCI JAWABAN:</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-700 text-white font-black text-xs tracking-wide">
                      {q.correctAnswer}
                    </span>
                  </span>

                  {viewMode === 'edit' && (
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-700">Edit Kunci:</label>
                      <input
                        type="text"
                        value={q.correctAnswer}
                        onChange={(e) => handleCorrectAnswerChange(q.id, e.target.value)}
                        className="w-28 p-1 text-xs font-bold rounded border border-emerald-400 bg-white text-slate-900"
                      />
                    </div>
                  )}
                </div>

                {viewMode === 'edit' ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Edit Kunci Pembahasan & Rubrik Skor:
                    </label>
                    <textarea
                      rows={2}
                      value={q.explanation}
                      onChange={(e) => handleExplanationChange(q.id, e.target.value)}
                      className="w-full p-2 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-medium"
                    />
                  </div>
                ) : (
                  <div className="text-slate-800 leading-relaxed space-y-1">
                    <p className="font-bold text-emerald-900 flex items-center gap-1">
                      <span>💡 PEMBAHASAN & RUBRIK SKOR (Bobot: {q.scoreWeight}):</span>
                    </p>
                    <p className="italic bg-white/70 p-2.5 rounded-lg border border-emerald-200/60 font-medium text-slate-800 whitespace-pre-line">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Add Question Buttons in Edit Mode */}
      {viewMode === 'edit' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 no-print pt-2">
          <button
            onClick={() => setIsBankModalOpen(true)}
            className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
          >
            <CopyPlus className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
            <span>Ambil Soal dari Bank Soal ({allBankQuestions.length} Soal)</span>
          </button>

          <button
            onClick={handleAddQuestion}
            className="py-3 px-4 border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Tambah Butir Soal Manual</span>
          </button>
        </div>
      )}

      {/* Signature Block (Hidden by default unless toggled) */}
      {showSignatureBlock && (
        <div className="pt-10 grid grid-cols-2 text-xs text-slate-900">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah</p>
            <div className="h-16" />
            <p className="font-extrabold underline">{headerConfig.namaKepalaSekolah}</p>
            <p className="text-[11px] text-slate-600">NIP. {headerConfig.nipKepalaSekolah}</p>
          </div>

          <div className="text-right">
            <p>Kota ......, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">Guru Mata Pelajaran</p>
            <div className="h-16" />
            <p className="font-extrabold underline">{headerConfig.namaGuru}</p>
            <p className="text-[11px] text-slate-600">NIP. {headerConfig.nipGuru}</p>
          </div>
        </div>
      )}

      {/* Standalone Printable Answer Key Page (If includeKeyPage is active) */}
      {includeKeyPage && (
        <div className="page-break pt-8 border-t-2 border-slate-300 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-extrabold uppercase text-slate-900 tracking-tight">
              LAMPIRAN: KUNCI JAWABAN DAN PEMBAHASAN LENGKAP
            </h2>
            <p className="text-xs font-bold text-slate-700">
              {currentSet.subject.toUpperCase()} - {currentSet.gradeClass.toUpperCase()} ({currentSet.curriculum})
            </p>
          </div>

          <div className="space-y-4">
            {currentSet.questions.map((q) => (
              <div key={`key-page-${q.id}`} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Soal No. {q.number} [{q.type.toUpperCase()} - {q.difficulty.toUpperCase()} - {q.bloomLevel}]</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-extrabold text-[11px]">
                    Kunci: {q.correctAnswer}
                  </span>
                </div>
                <p className="text-slate-700 font-medium"><span className="font-bold">Pertanyaan:</span> {q.questionText}</p>
                <p className="text-slate-800 italic bg-white p-2 rounded border border-slate-200">
                  <span className="font-bold text-indigo-700">Pembahasan & Rubrik ({q.scoreWeight} Poin):</span> {q.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );

  // If Dedicated Print Page is active
  if (isPrintPageActive) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 sm:p-8 animate-in fade-in duration-150">
        
        {/* Sticky Print Controls Bar (Hidden when printing to paper/PDF) */}
        <div className="sticky top-4 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 no-print border border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPrintPageActive(false)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Editor</span>
            </button>
            <div className="hidden sm:block h-5 w-px bg-slate-700" />
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-indigo-400" />
                <span>Halaman Cetak & PDF Ujian</span>
              </p>
              <p className="text-[10px] text-slate-400">Pilih opsi cetak atau unduh berkas PDF langsung</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPdfFile}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 text-xs font-bold text-indigo-900 bg-indigo-100 hover:bg-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh Berkas PDF (.pdf)'}</span>
            </button>

            <button
              onClick={handlePopupPrint}
              className="px-3.5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Cetak di Tab Baru / Printer</span>
            </button>
          </div>
        </div>

        {/* Paper Document Container */}
        {renderPaperDocument()}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Action Bar (Hidden during print) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs no-print space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                <span className="font-bold text-indigo-600">{currentSet.subject}</span>
                <span>·</span>
                <span>{currentSet.gradeClass}</span>
                <span>·</span>
                <span>{currentSet.curriculum}</span>
              </div>
              <input
                type="text"
                value={currentSet.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-lg font-extrabold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full sm:w-auto"
              />
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start md:self-auto">
            <button
              onClick={() => {
                setViewMode('student');
                setShowAnswersInline(false);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === 'student' && !showAnswersInline
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Lembar Soal Siswa</span>
            </button>

            <button
              onClick={() => {
                setViewMode('teacher');
                setShowAnswersInline(true);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === 'teacher' || showAnswersInline
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kunci & Pembahasan Guru</span>
            </button>

            <button
              onClick={() => {
                setViewMode('edit');
                setShowAnswersInline(true);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === 'edit' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Mode Edit</span>
            </button>
          </div>
        </div>

        {/* Toggles Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer select-none bg-emerald-50/60 px-2.5 py-1 rounded-lg border border-emerald-200/80">
              <input
                type="checkbox"
                checked={isCompactPrint}
                onChange={(e) => setIsCompactPrint(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="font-bold text-emerald-900 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mode Hemat Kertas (Margin & Spasi Rapat)</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAnswersInline}
                onChange={(e) => setShowAnswersInline(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tampilkan Kunci & Pembahasan Inline</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeKeyPage}
                onChange={(e) => setIncludeKeyPage(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <BookOpenCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sertakan Halaman Kunci (Belakang)</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showSignatureBlock}
                onChange={(e) => setShowSignatureBlock(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Tanda Tangan Guru & Kepsek</span>
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToBank}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Ke Bank Soal</span>
            </button>

            <button
              onClick={() => setExportModalType('docx')}
              className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Ekspor Word (.docx)</span>
            </button>

            <button
              onClick={() => openPrintPage(showAnswersInline, includeKeyPage)}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Buka Halaman Cetak PDF</span>
            </button>
          </div>
        </div>

        {isSavedAlert && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Naskah soal dan kunci pembahasan berhasil disimpan ke Bank Soal!</span>
          </div>
        )}

        {importAlertMessage && (
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{importAlertMessage}</span>
          </div>
        )}
      </div>

      {/* Main Document Body */}
      {renderPaperDocument()}

      {/* Export Options Modal Dialog (Docx or PDF/Print) */}
      {exportModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${exportModalType === 'docx' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                  {exportModalType === 'docx' ? <FileText className="w-5 h-5" /> : <Printer className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pilihan Format {exportModalType === 'docx' ? 'Ekspor Word (.docx)' : 'Cetak / Ekspor PDF'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilih opsi penyertaan Kunci Jawaban & Pembahasan sesuai kebutuhan Anda.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExportModalType(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: Student Only */}
              <button
                onClick={() => {
                  if (exportModalType === 'docx') {
                    executeDocxExport('student_only');
                  } else {
                    openPrintPage(false, false);
                  }
                }}
                className="w-full p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 text-left transition-all group flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-indigo-100 text-slate-700 group-hover:text-indigo-700 shrink-0 mt-0.5">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-900">
                    1. Naskah Soal Ujian Siswa (Hanya Soal)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Hanya berisi teks soal dan pilihan jawaban. Tanpa kunci jawaban dan pembahasan (Cocok untuk dibagikan ke siswa saat ujian).
                  </p>
                </div>
              </button>

              {/* Option 2: Student + Key Page (Recommended) */}
              <button
                onClick={() => {
                  if (exportModalType === 'docx') {
                    executeDocxExport('student_with_key_page');
                  } else {
                    openPrintPage(false, true);
                  }
                }}
                className="w-full p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/20 hover:border-indigo-600 hover:bg-indigo-50/50 text-left transition-all group flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
                  <BookOpenCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-indigo-950">
                      2. Naskah Soal + Kunci & Pembahasan di Halaman Belakang
                    </p>
                    <span className="px-2 py-0.2 bg-indigo-600 text-white font-extrabold text-[9px] rounded-full">
                      Rekomendasi
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-900/80 mt-0.5 leading-relaxed">
                    Halaman depan berisi naskah soal siswa. Dilengkapi Halaman Kunci Jawaban & Pembahasan Lengkap di lembar lampiran terakhir.
                  </p>
                </div>
              </button>

              {/* Option 3: Teacher Inline Master Copy */}
              <button
                onClick={() => {
                  if (exportModalType === 'docx') {
                    executeDocxExport('teacher_inline');
                  } else {
                    openPrintPage(true, false);
                  }
                }}
                className="w-full p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-left transition-all group flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                    3. Naskah Pegangan Guru (Kunci & Pembahasan Langsung di Setiap Soal)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Kunci jawaban dan penjelasan pembahasan tertera secara langsung di bawah tiap butir soal (Cocok untuk pegangan/arsip guru).
                  </p>
                </div>
              </button>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setExportModalType(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Soal Question Picker Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 no-print animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-sm shrink-0">
                  <CopyPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Ambil & Impor Soal dari Bank Soal
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih butir soal dari pustaka Bank Soal untuk ditambahkan langsung ke naskah ujian ini ({filteredBankQuestions.length} soal ditemukan).
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsBankModalOpen(false);
                  setSelectedBankQuestions([]);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filters Bar */}
            <div className="p-4 bg-white border-b border-slate-100 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                
                {/* Search Input */}
                <div className="relative sm:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bankSearchText}
                    onChange={(e) => setBankSearchText(e.target.value)}
                    placeholder="Cari teks pertanyaan, kata kunci, materi..."
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-slate-50/50"
                  />
                  {bankSearchText && (
                    <button
                      onClick={() => setBankSearchText('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Subject */}
                <div>
                  <select
                    value={bankSubjectFilter}
                    onChange={(e) => setBankSubjectFilter(e.target.value)}
                    className="w-full p-2 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50"
                  >
                    <option value="all">Semua Mata Pelajaran</option>
                    {uniqueSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Type */}
                <div>
                  <select
                    value={bankTypeFilter}
                    onChange={(e) => setBankTypeFilter(e.target.value)}
                    className="w-full p-2 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50"
                  >
                    <option value="all">Semua Jenis Soal</option>
                    <option value="pg">Pilihan Ganda (PG)</option>
                    <option value="isian">Isian Singkat</option>
                    <option value="menjodohkan">Menjodohkan</option>
                    <option value="bs">Benar / Salah</option>
                    <option value="uraian">Uraian / Essay</option>
                  </select>
                </div>
              </div>

              {/* Sub Bar: Select All Toggle & Selection Indicator */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  onClick={handleSelectAllFiltered}
                  className="flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  {selectedBankQuestions.length === filteredBankQuestions.length && filteredBankQuestions.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {selectedBankQuestions.length === filteredBankQuestions.length && filteredBankQuestions.length > 0
                      ? 'Batalkan Pilih Semua'
                      : 'Pilih Semua Soal Hasil Filter'}
                  </span>
                </button>

                <div className="flex items-center gap-2 text-slate-500 font-semibold">
                  <span>
                    Menampilkan <strong className="text-slate-900">{filteredBankQuestions.length}</strong> dari{' '}
                    <strong className="text-slate-900">{allBankQuestions.length}</strong> soal di Bank Soal
                  </span>
                  {selectedBankQuestions.length > 0 && (
                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-extrabold rounded-full text-[11px]">
                      {selectedBankQuestions.length} Terpilih
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Questions Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/40">
              {filteredBankQuestions.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Tidak Ada Soal Yang Cocok</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Coba ubah kata kunci pencarian atau ganti filter mata pelajaran/jenis soal.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setBankSearchText('');
                      setBankSubjectFilter('all');
                      setBankTypeFilter('all');
                      setBankDifficultyFilter('all');
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                  >
                    Reset Semua Filter
                  </button>
                </div>
              ) : (
                filteredBankQuestions.map((item) => {
                  const isSelected = selectedBankQuestions.some((q) => q.uniqueKey === item.uniqueKey);
                  return (
                    <div
                      key={item.uniqueKey}
                      onClick={() => toggleSelectBankQuestion(item)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-2 border-indigo-500 bg-indigo-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          
                          {/* Selection Checkbox */}
                          <div className="pt-0.5 shrink-0">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-indigo-600 fill-indigo-100" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                            )}
                          </div>

                          <div className="space-y-2 flex-1">
                            {/* Badges & Source Set Title */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px] uppercase">
                                {item.type}
                              </span>
                              {getDifficultyBadge(item.difficulty)}
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                                {item.bloomLevel}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500">
                                (Bobot: {item.scoreWeight})
                              </span>
                              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md truncate max-w-xs">
                                📌 {item.sourceSetTitle}
                              </span>
                            </div>

                            {/* Question Text */}
                            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                              {item.questionText}
                            </p>

                            {/* Options if PG */}
                            {item.options && item.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-700 pt-1">
                                {item.options.map((opt, oIdx) => (
                                  <div key={oIdx} className="truncate">
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Answer Key & Explanation Preview */}
                            <div className="text-[11px] text-emerald-900 font-medium bg-emerald-50/60 p-2 rounded-lg border border-emerald-200/60 flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-bold">Kunci Jawaban:</span>{' '}
                                <span className="px-1.5 py-0.2 bg-emerald-600 text-white font-extrabold rounded text-[10px]">
                                  {item.correctAnswer}
                                </span>
                              </div>
                              <div className="italic text-slate-600 truncate max-w-md">
                                {item.explanation}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sticky Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600 font-medium">
                {selectedBankQuestions.length > 0 ? (
                  <span className="font-bold text-indigo-700">
                    {selectedBankQuestions.length} soal terpilih siap diimpor ke naskah Anda.
                  </span>
                ) : (
                  <span>Centang soal di atas untuk mengimpor ke naskah ini.</span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setIsBankModalOpen(false);
                    setSelectedBankQuestions([]);
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  onClick={handleImportSelectedBankQuestions}
                  disabled={selectedBankQuestions.length === 0}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CopyPlus className="w-4 h-4" />
                  <span>Impor {selectedBankQuestions.length > 0 ? `${selectedBankQuestions.length} Soal` : ''} Ke Naskah</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
