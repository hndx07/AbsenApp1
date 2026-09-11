import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  Sparkles,
  Info,
} from 'lucide-react';
import { Student, ClassRoom, TeacherProfile, StudentGrade } from '../types';
import { calculateStudentGrade, extractGradeValues, FormattedGradeDetail } from '../utils/gradeCalculations';

interface GradebookViewProps {
  currentClass: ClassRoom;
  students: Student[];
  grades: Record<string, StudentGrade>;
  teacher: TeacherProfile;
  onUpdateGrade: (studentId: string, field: keyof StudentGrade, value: number | null) => void;
  onAutoFillGrades?: () => void;
}

export const GradebookView: React.FC<GradebookViewProps> = ({
  currentClass,
  students = [],
  grades = {},
  teacher,
  onUpdateGrade,
  onAutoFillGrades,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'tuntas' | 'remedial'>('all');

  // Calculate stats for all students
  const calculatedGrades = useMemo<Record<string, FormattedGradeDetail>>(() => {
    const map: Record<string, FormattedGradeDetail> = {};
    (students || []).forEach((st) => {
      if (st) {
        map[st.id] = calculateStudentGrade(grades?.[st.id], currentClass?.kkm || 75);
      }
    });
    return map;
  }, [students, grades, currentClass?.kkm]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return (students || []).filter((s) => {
      if (!s) return false;
      const matchSearch =
        (s.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nisn || '').includes(searchQuery);
      if (!matchSearch) return false;

      const calc = calculatedGrades[s.id];
      if (filterStatus === 'tuntas') return calc?.isTuntas;
      if (filterStatus === 'remedial') return !calc?.isTuntas;
      return true;
    });
  }, [students, searchQuery, filterStatus, calculatedGrades]);

  // Compute class grade metrics
  const classMetrics = useMemo(() => {
    let sumFinal = 0;
    let count = 0;
    let tuntasCount = 0;

    Object.values(calculatedGrades).forEach((calc: FormattedGradeDetail) => {
      if (calc.nilaiAkhir > 0) {
        sumFinal += calc.nilaiAkhir;
        count++;
        if (calc.isTuntas) tuntasCount++;
      }
    });

    const avg = count > 0 ? Math.round(sumFinal / count) : 0;
    const persentaseTuntas = count > 0 ? Math.round((tuntasCount / count) * 100) : 0;

    return { avg, tuntasCount, remedialCount: count - tuntasCount, persentaseTuntas };
  }, [calculatedGrades]);

  return (
    <div className="space-y-4">
      {/* Top Banner & Grade Statistics */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Kurikulum Merdeka 10 Kolom
            </span>
            <span className="text-xs text-slate-500 font-medium">
              KKM Standar: <strong className="text-slate-800">{currentClass.kkm}</strong>
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Buku Nilai & Rekap Asesmen - {currentClass.namaKelas}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Mata Pelajaran: <span className="font-semibold text-slate-800">{currentClass.mataPelajaran}</span> • Rumus: 50% Formatif + 25% STS + 25% SAS
          </p>
        </div>

        {/* Quick Metric Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500">Rata-rata Kelas:</span>{' '}
            <strong className="text-slate-900 font-extrabold">{classMetrics.avg}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold">
            Tuntas: {classMetrics.tuntasCount} ({classMetrics.persentaseTuntas}%)
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold">
            Remedial: {classMetrics.remedialCount}
          </div>
        </div>
      </div>

      {/* Filter & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari siswa atau NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('tuntas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === 'tuntas'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Tuntas ({classMetrics.tuntasCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('remedial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === 'remedial'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              Remedial ({classMetrics.remedialCount})
            </button>
          </div>
        </div>

        {onAutoFillGrades && (
          <button
            type="button"
            onClick={onAutoFillGrades}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
            title="Isi contoh nilai realistis siswa"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Simulasi Contoh Nilai</span>
          </button>
        )}
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
            <thead className="bg-slate-100/95 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
              <tr>
                <th className="py-2.5 px-2 text-center w-10 border-r border-slate-200">No</th>
                <th className="py-2.5 px-2.5 w-24 border-r border-slate-200">NISN</th>
                <th className="py-2.5 px-3 min-w-[170px] border-r border-slate-200">Nama Siswa</th>

                {/* 8 Asesmen Formatif Header */}
                <th className="py-1 px-1 text-center w-11 border-r border-slate-200 bg-slate-50">F1</th>
                <th className="py-1 px-1 text-center w-11 border-r border-slate-200 bg-slate-50">F2</th>
                <th className="py-1 px-1 text-center w-11 border-r border-slate-200 bg-slate-50">F3</th>
                <th className="py-1 px-1 text-center w-11 border-r border-slate-200 bg-slate-50">F4</th>
                <th className="py-1 px-1 text-center w-11 border-r border-slate-200 bg-slate-50">F5</th>
                <th className="py-1 px-1 text-center w-11 border-r border-slate-200 bg-slate-50">F6</th>
                <th className="py-1 px-1 text-center w-11 border-r border-slate-200 bg-slate-50">F7</th>
                <th className="py-1 px-1 text-center w-11 border-r border-slate-200 bg-slate-50">F8</th>
                <th className="py-2.5 px-1.5 text-center w-14 text-blue-800 bg-blue-50/80 border-r border-slate-200">
                  Rata F
                </th>

                {/* 2 Asesmen Sumatif Header */}
                <th className="py-1 px-1 text-center w-12 border-r border-slate-200 bg-amber-50/70">
                  STS
                </th>
                <th className="py-1 px-1 text-center w-12 border-r border-slate-200 bg-amber-50/70">
                  SAS
                </th>

                {/* Final Calculation Result */}
                <th className="py-2.5 px-2 text-center w-14 bg-indigo-50/90 text-indigo-950 font-black border-r border-slate-200">
                  NA
                </th>
                <th className="py-2.5 px-1 text-center w-10 border-r border-slate-200">Pred</th>
                <th className="py-2.5 px-2 text-center w-24">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada siswa yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const g = grades[st.id];
                  const calc = calculatedGrades[st.id];
                  const vals = extractGradeValues(g);

                  const renderInput = (
                    field: keyof StudentGrade,
                    val: number | null | undefined,
                    bgColor?: string
                  ) => (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={val ?? ''}
                      placeholder="-"
                      onChange={(e) => {
                        const v = e.target.value === '' ? null : Number(e.target.value);
                        onUpdateGrade(st.id, field, v);
                      }}
                      className={`w-10 text-center font-semibold text-xs py-1 px-0.5 rounded border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 ${
                        bgColor || 'bg-white'
                      } ${
                        val !== null && val !== undefined && val < currentClass.kkm
                          ? 'text-rose-600 bg-rose-50/80 font-bold border-rose-300'
                          : 'text-slate-800'
                      }`}
                    />
                  );

                  return (
                    <tr key={st.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-1 px-2 text-center font-mono text-slate-500 border-r border-slate-100">
                        {st.no}
                      </td>
                      <td className="py-1 px-2.5 font-mono text-[11px] text-slate-600 border-r border-slate-100">
                        {st.nisn}
                      </td>
                      <td className="py-1 px-3 font-semibold text-slate-900 truncate max-w-[190px] border-r border-slate-100">
                        {st.nama}
                      </td>

                      {/* 8 Formatif Columns */}
                      <td className="py-1 px-1 text-center border-r border-slate-100">
                        {renderInput('formatif1', vals.formatif1)}
                      </td>
                      <td className="py-1 px-1 text-center border-r border-slate-100">
                        {renderInput('formatif2', vals.formatif2)}
                      </td>
                      <td className="py-1 px-1 text-center border-r border-slate-100">
                        {renderInput('formatif3', vals.formatif3)}
                      </td>
                      <td className="py-1 px-1 text-center border-r border-slate-100">
                        {renderInput('formatif4', vals.formatif4)}
                      </td>
                      <td className="py-1 px-1 text-center border-r border-slate-100">
                        {renderInput('formatif5', vals.formatif5)}
                      </td>
                      <td className="py-1 px-1 text-center border-r border-slate-100">
                        {renderInput('formatif6', vals.formatif6)}
                      </td>
                      <td className="py-1 px-1 text-center border-r border-slate-100">
                        {renderInput('formatif7', vals.formatif7)}
                      </td>
                      <td className="py-1 px-1 text-center border-r border-slate-100">
                        {renderInput('formatif8', vals.formatif8)}
                      </td>

                      {/* Rata-rata Formatif */}
                      <td className="py-1 px-1 text-center font-bold text-blue-700 bg-blue-50/40 border-r border-slate-100">
                        {calc.rataFormatif || '-'}
                      </td>

                      {/* 2 Sumatif Columns */}
                      <td className="py-1 px-1 text-center border-r border-slate-100 bg-amber-50/30">
                        {renderInput('sumatifTengah', vals.sumatifTengah)}
                      </td>
                      <td className="py-1 px-1 text-center border-r border-slate-100 bg-amber-50/30">
                        {renderInput('sumatifAkhir', vals.sumatifAkhir)}
                      </td>

                      {/* Nilai Akhir */}
                      <td className="py-1 px-2 text-center font-black text-sm text-indigo-900 bg-indigo-50/50 border-r border-slate-100">
                        {calc.nilaiAkhir || '-'}
                      </td>

                      {/* Predikat */}
                      <td className="py-1 px-1 text-center font-extrabold border-r border-slate-100">
                        <span
                          className={`inline-block w-6 py-0.5 rounded text-xs ${
                            calc.predikat === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : calc.predikat === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : calc.predikat === 'C'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {calc.predikat}
                        </span>
                      </td>

                      {/* Status Kelulusan */}
                      <td className="py-1 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                            calc.isTuntas
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {calc.isTuntas ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span>{calc.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
