import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  PageBreak,
} from 'docx';
import { saveAs } from 'file-saver';
import { QuestionSet, SchoolHeaderConfig } from '../types/question';

export type DocxExportMode = 'student_only' | 'student_with_key_page' | 'teacher_inline';

export const exportQuestionSetToDocx = async (
  questionSet: QuestionSet,
  options: { mode?: DocxExportMode; includeAnswers?: boolean; includeSignatures?: boolean } = { mode: 'student_with_key_page', includeSignatures: false }
) => {
  const exportMode: DocxExportMode =
    options.mode || (options.includeAnswers ? 'teacher_inline' : 'student_with_key_page');
  const includeSignatures = options.includeSignatures ?? false;
  const header: SchoolHeaderConfig = questionSet.schoolHeader || {
    dinasYayasan: 'PEMERINTAH PROVINSI / DINAS PENDIDIKAN',
    namaSekolah: 'SMA / SMP NEGERI SEJAHTERA',
    alamatSekolah: 'Jl. Pendidikan No. 123, Indonesia',
    nomorTelepon: 'Telp. (021) 555-1234',
    websiteEmail: 'info@sekolah.sch.id',
    tahunAjaran: '2025/2026',
    namaGuru: 'Guru Pengampu, S.Pd.',
    nipGuru: '19850101 201001 1 001',
    namaKepalaSekolah: 'Kepala Sekolah, M.Pd.',
    nipKepalaSekolah: '19750202 199802 1 002',
  };

  const children: (Paragraph | Table)[] = [];

  // 1. Kop Sekolah Header Paragraphs
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: header.dinasYayasan.toUpperCase(), bold: true, size: 22 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: header.namaSekolah.toUpperCase(), bold: true, size: 28 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `${header.alamatSekolah} | ${header.nomorTelepon}`, size: 18, italics: true }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Email/Web: ${header.websiteEmail}`, size: 18, italics: true }),
      ],
    }),
    // Underline simulating Kop Surat
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: {
        bottom: { color: '000000', space: 1, style: BorderStyle.SINGLE, size: 12 },
      },
      children: [],
    }),
    new Paragraph({ text: '', spacing: { after: 200 } })
  );

  // 2. Title & Metadata Table
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: `NASKAH SOAL ASESMEN SUMATIF ${questionSet.curriculum.toUpperCase()}`,
          bold: true,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `TAHUN AJARAN ${header.tahunAjaran}`, bold: true, size: 20 }),
      ],
      spacing: { after: 200 },
    })
  );

  // Metadata Table
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Mata Pelajaran : ', bold: true }),
                  new TextRun({ text: questionSet.subject }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Kelas / Semester : ', bold: true }),
                  new TextRun({ text: `${questionSet.gradeClass} / ${questionSet.semester}` }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Waktu : ', bold: true }),
                  new TextRun({ text: `${questionSet.durationMinutes} Menit` }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Kurikulum : ', bold: true }),
                  new TextRun({ text: questionSet.curriculum }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(metaTable);
  children.push(new Paragraph({ text: '', spacing: { after: 200 } }));

  // Petunjuk Umum
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'PETUNJUK UMUM:', bold: true, size: 20 })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '1. Berdoalah sebelum mengerjakan soal.\n2. Tuliskan identitas Anda pada lembar jawaban yang tersedia.\n3. Periksa dan bacalah setiap soal dengan cermat sebelum menjawab.\n4. Laporkan kepada pengawas jika terdapat tulisan yang kurang jelas atau rusak.',
          size: 18,
        }),
      ],
      spacing: { after: 250 },
    })
  );

  // Stimulus Text if present
  if (questionSet.stimulusText) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'TEKS STIMULUS / BACAAN:', bold: true, size: 20 })],
      }),
      new Paragraph({
        border: {
          left: { color: '4F46E5', space: 4, style: BorderStyle.SINGLE, size: 12 },
        },
        children: [new TextRun({ text: questionSet.stimulusText, italics: true, size: 19 })],
        spacing: { after: 250 },
      })
    );
  }

  // 3. Questions Grouped by Type
  const pgQuestions = questionSet.questions.filter((q) => q.type === 'pg');
  const isianQuestions = questionSet.questions.filter((q) => q.type === 'isian');
  const matchingQuestions = questionSet.questions.filter((q) => q.type === 'menjodohkan');
  const bsQuestions = questionSet.questions.filter((q) => q.type === 'bs');
  const uraianQuestions = questionSet.questions.filter((q) => q.type === 'uraian');

  // A. Pilihan Ganda
  if (pgQuestions.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'I. PILIHAN GANDA',
            bold: true,
            size: 22,
          }),
        ],
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Pilihlah salah satu jawaban yang paling tepat dengan memberikan tanda silang (X) pada huruf A, B, C, D, atau E!',
            italics: true,
            size: 18,
          }),
        ],
        spacing: { after: 150 },
      })
    );

    pgQuestions.forEach((q, idx) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${idx + 1}. `, bold: true }),
            new TextRun({ text: q.questionText }),
          ],
          spacing: { before: 100, after: 80 },
        })
      );

      if (q.options && q.options.length > 0) {
        q.options.forEach((opt) => {
          children.push(
            new Paragraph({
              indent: { left: 360 },
              children: [new TextRun({ text: opt })],
              spacing: { after: 40 },
            })
          );
        });
      }

      if (exportMode === 'teacher_inline') {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            children: [
              new TextRun({ text: `KUNCI JAWABAN: ${q.correctAnswer} | `, bold: true, color: '16A34A' }),
              new TextRun({ text: `PEMBAHASAN: ${q.explanation}`, italics: true, color: '2563EB' }),
            ],
            spacing: { after: 120 },
          })
        );
      }
    });
  }

  // B. Isian Singkat
  if (isianQuestions.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'II. ISIAN SINGKAT',
            bold: true,
            size: 22,
          }),
        ],
        spacing: { before: 300, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Isilah titik-titik di bawah ini dengan jawaban yang singkat dan tepat!',
            italics: true,
            size: 18,
          }),
        ],
        spacing: { after: 150 },
      })
    );

    isianQuestions.forEach((q, idx) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${idx + 1}. `, bold: true }),
            new TextRun({ text: q.questionText }),
          ],
          spacing: { before: 100, after: 80 },
        })
      );

      if (exportMode === 'teacher_inline') {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            children: [
              new TextRun({ text: `KUNCI JAWABAN: ${q.correctAnswer} | `, bold: true, color: '16A34A' }),
              new TextRun({ text: `PEMBAHASAN: ${q.explanation}`, italics: true, color: '2563EB' }),
            ],
            spacing: { after: 100 },
          })
        );
      }
    });
  }

  // C. Menjodohkan
  if (matchingQuestions.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'III. MENJODOHKAN',
            bold: true,
            size: 22,
          }),
        ],
        spacing: { before: 300, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Jodohkanlah pernyataan pada Kolom A dengan jawaban yang tepat pada Kolom B!',
            italics: true,
            size: 18,
          }),
        ],
        spacing: { after: 150 },
      })
    );

    matchingQuestions.forEach((q, idx) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${idx + 1}. `, bold: true }),
            new TextRun({ text: q.questionText }),
          ],
          spacing: { before: 100, after: 80 },
        })
      );

      if (q.matchingPairs && q.matchingPairs.length > 0) {
        const rows = [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: 'Kolom A (Pernyataan)', bold: true })] })],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: 'Kolom B (Pasangan)', bold: true })] })],
              }),
            ],
          }),
          ...q.matchingPairs.map(
            (pair, pIdx) =>
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: `${pIdx + 1}. ${pair.premis}` })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: `${String.fromCharCode(65 + pIdx)}. ${pair.respon}` })],
                  }),
                ],
              })
          ),
        ];

        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
      }

      if (exportMode === 'teacher_inline') {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `KUNCI JAWABAN: ${q.correctAnswer} | `, bold: true, color: '16A34A' }),
              new TextRun({ text: `PEMBAHASAN: ${q.explanation}`, italics: true, color: '2563EB' }),
            ],
            spacing: { before: 80, after: 120 },
          })
        );
      }
    });
  }

  // D. Benar / Salah
  if (bsQuestions.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'IV. BENAR / SALAH',
            bold: true,
            size: 22,
          }),
        ],
        spacing: { before: 300, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Tentukan apakah pernyataan berikut BENAR (B) atau SALAH (S)!',
            italics: true,
            size: 18,
          }),
        ],
        spacing: { after: 150 },
      })
    );

    bsQuestions.forEach((q, idx) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${idx + 1}. [ B / S ] `, bold: true }),
            new TextRun({ text: q.questionText }),
          ],
          spacing: { before: 100, after: 80 },
        })
      );

      if (exportMode === 'teacher_inline') {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            children: [
              new TextRun({ text: `KUNCI JAWABAN: ${q.correctAnswer} | `, bold: true, color: '16A34A' }),
              new TextRun({ text: `PEMBAHASAN: ${q.explanation}`, italics: true, color: '2563EB' }),
            ],
            spacing: { after: 100 },
          })
        );
      }
    });
  }

  // E. Uraian / Essay
  if (uraianQuestions.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'V. URAIAN / ESSAY',
            bold: true,
            size: 22,
          }),
        ],
        spacing: { before: 300, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Jawablah pertanyaan-pertanyaan berikut dengan uraian yang jelas dan lengkap!',
            italics: true,
            size: 18,
          }),
        ],
        spacing: { after: 150 },
      })
    );

    uraianQuestions.forEach((q, idx) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${idx + 1}. `, bold: true }),
            new TextRun({ text: q.questionText }),
          ],
          spacing: { before: 100, after: 80 },
        })
      );

      if (exportMode === 'teacher_inline') {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            children: [
              new TextRun({ text: `PEDOMAN JAWABAN & RUBRIK SKOR (Bobot: ${q.scoreWeight}): `, bold: true, color: '16A34A' }),
              new TextRun({ text: q.explanation, italics: true, color: '2563EB' }),
            ],
            spacing: { after: 100 },
          })
        );
      } else {
        children.push(
          new Paragraph({ text: '', spacing: { after: 400 } })
        );
      }
    });
  }

  // Signature Block at the end of student paper (Only if includeSignatures is true)
  if (includeSignatures) {
    children.push(
      new Paragraph({ text: '', spacing: { before: 300 } }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ children: [new TextRun({ text: 'Mengetahui,' })] }),
                  new Paragraph({ children: [new TextRun({ text: 'Kepala Sekolah' })] }),
                  new Paragraph({ text: '', spacing: { after: 800 } }),
                  new Paragraph({ children: [new TextRun({ text: header.namaKepalaSekolah, bold: true, underline: {} })] }),
                  new Paragraph({ children: [new TextRun({ text: `NIP. ${header.nipKepalaSekolah}` })] }),
                ],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ children: [new TextRun({ text: `Kota ......, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` })] }),
                  new Paragraph({ children: [new TextRun({ text: 'Guru Mata Pelajaran' })] }),
                  new Paragraph({ text: '', spacing: { after: 800 } }),
                  new Paragraph({ children: [new TextRun({ text: header.namaGuru, bold: true, underline: {} })] }),
                  new Paragraph({ children: [new TextRun({ text: `NIP. ${header.nipGuru}` })] }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  }

  // If exportMode is 'student_with_key_page', append dedicated Answer Key & Pembahasan page
  if (exportMode === 'student_with_key_page') {
    children.push(
      new Paragraph({
        children: [new PageBreak()],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'KUNCI JAWABAN DAN PEMBAHASAN LENGKAP',
            bold: true,
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `${questionSet.subject.toUpperCase()} - ${questionSet.gradeClass.toUpperCase()}`,
            bold: true,
            size: 20,
          }),
        ],
        spacing: { after: 200 },
      })
    );

    questionSet.questions.forEach((q) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Soal No. ${q.number} [${q.type.toUpperCase()} - ${q.difficulty.toUpperCase()} - ${q.bloomLevel}]`, bold: true, size: 20 }),
          ],
          spacing: { before: 120, after: 40 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Pertanyaan: `, bold: true }),
            new TextRun({ text: q.questionText }),
          ],
          spacing: { after: 40 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `KUNCI JAWABAN: `, bold: true, color: '16A34A' }),
            new TextRun({ text: q.correctAnswer, bold: true }),
          ],
          spacing: { after: 40 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `PEMBAHASAN / RUBRIK SKOR (${q.scoreWeight} Poin): `, bold: true, color: '2563EB' }),
            new TextRun({ text: q.explanation, italics: true }),
          ],
          spacing: { after: 150 },
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 in
              bottom: 720, // 0.5 in
              left: 720, // 0.5 in
              right: 720, // 0.5 in
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanTitle = questionSet.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanTitle}_${options.includeAnswers ? 'Kunci_Jawaban' : 'Soal'}.docx`;
  saveAs(blob, filename);
};
