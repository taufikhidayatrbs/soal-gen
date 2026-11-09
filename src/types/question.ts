export type QuestionType = 'pg' | 'isian' | 'uraian' | 'menjodohkan' | 'bs';

export type DifficultyLevel = 'mudah' | 'sedang' | 'sukar';

export type BloomLevel = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';

export interface MatchingPair {
  id: string;
  premis: string; // Left column (e.g., Istilah / Pertanyaan)
  respon: string; // Right column (e.g., Definisi / Jawaban)
}

export interface QuestionItem {
  id: string;
  number: number;
  type: QuestionType;
  difficulty: DifficultyLevel;
  bloomLevel: BloomLevel;
  questionText: string;
  options?: string[]; // E.g. ["A. Option 1", "B. Option 2", ...] for PG
  matchingPairs?: MatchingPair[]; // For matching questions
  correctAnswer: string; // "A" / "B" or answer text or "Benar"
  explanation: string; // Pembahasan lengkap
  scoreWeight: number; // Bobot nilai (e.g., 2 untuk PG, 10 untuk Uraian)
  learningObjective?: string; // Indikator / TP
}

export interface SchoolHeaderConfig {
  dinasYayasan: string;
  namaSekolah: string;
  alamatSekolah: string;
  nomorTelepon: string;
  websiteEmail: string;
  tahunAjaran: string;
  namaGuru: string;
  nipGuru: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  logoText?: string;
}

export interface QuestionSet {
  id: string;
  title: string;
  subject: string;
  gradeClass: string;
  curriculum: 'Kurikulum Merdeka' | 'Kurikulum 2013 (K13)' | 'Lainnya';
  semester: 'Ganjil' | 'Genap';
  durationMinutes: number;
  difficultyDistribution: {
    mudah: number;
    sedang: number;
    sukar: number;
  };
  typeCounts: {
    pg: number;
    isian: number;
    uraian: number;
    menjodohkan: number;
    bs: number;
  };
  learningObjectives: string;
  stimulusText?: string;
  questions: QuestionItem[];
  createdAt: string;
  schoolHeader?: SchoolHeaderConfig;
}

export interface GenerateQuestionsRequest {
  subject: string;
  gradeClass: string;
  curriculum: 'Kurikulum Merdeka' | 'Kurikulum 2013 (K13)' | 'Lainnya';
  semester: 'Ganjil' | 'Genap';
  durationMinutes: number;
  learningObjectives: string;
  stimulusText?: string;
  difficultyDistribution: {
    mudah: number;
    sedang: number;
    sukar: number;
  };
  typeCounts: {
    pg: number;
    isian: number;
    uraian: number;
    menjodohkan: number;
    bs: number;
  };
  customInstruction?: string;
}
