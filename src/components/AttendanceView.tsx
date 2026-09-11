import React, { useState, useMemo } from 'react';
import {
  CalendarCheck2,
  Plus,
  Edit2,
  Trash2,
  Share2,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Users,
  Filter,
  Download,
  Calendar,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import {
  Student,
  AttendanceSession,
  AttendanceStatus,
  ClassRoom,
  TeacherProfile,
} from '../types';

interface AttendanceViewProps {
  currentClass: ClassRoom;
  students: Student[];
  sessions: AttendanceSession[];
  teacher: TeacherProfile;
  onOpenSessionModal: (session?: AttendanceSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateAttendanceRecord: (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus,
    catatan?: string
  ) => void;
  onMarkAllPresent: (sessionId: string) => void;
  onOpenWhatsAppShare: (session: AttendanceSession) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  currentClass,
  students = [],
  sessions = [],
  teacher,
  onOpenSessionModal,
  onDeleteSession,
  onUpdateAttendanceRecord,
  onMarkAllPresent,
  onOpenWhatsAppShare,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'L' | 'P'>('all');

  // Filter students based on search and gender
  const filteredStudents = useMemo(() => {
    return (students || []).filter((s) => {
      if (!s) return false;
      const matchesSearch =
        (s.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nisn || '').includes(searchQuery);
      const matchesGender = genderFilter === 'all' || s.gender === genderFilter;
      return matchesSearch && matchesGender;
    });
  }, [students, searchQuery, genderFilter]);

  // Compute summary stats for each student
  const studentStats = useMemo(() => {
    const stats: Record<
      string,
      { hadir: number; sakit: number; izin: number; alfa: number; persentase: number }
    > = {};

    (students || []).forEach((st) => {
      if (!st) return;
      let h = 0;
      let s = 0;
      let i = 0;
      let a = 0;

      (sessions || []).forEach((sess) => {
        const record = sess.records?.[st.id]?.status;
        if (record === 'H') h++;
        else if (record === 'S') s++;
        else if (record === 'I') i++;
        else if (record === 'A') a++;
      });

      const total = (sessions || []).length;
      const persentase = total > 0 ? Math.round((h / total) * 100) : 100;
      stats[st.id] = { hadir: h, sakit: s, izin: i, alfa: a, persentase };
    });

    return stats;
  }, [students, sessions]);

  // Status cycle: H -> S -> I -> A -> H
  const getNextStatus = (current?: AttendanceStatus): AttendanceStatus => {
    if (current === 'H') return 'S';
    if (current === 'S') return 'I';
    if (current === 'I') return 'A';
    return 'H';
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Presensi Spreadsheet
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {sessions.length} Pertemuan KBM Terjadwal
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Lembar Presensi KBM - {currentClass.namaKelas}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Mata Pelajaran: <span className="font-semibold text-slate-800">{currentClass.mataPelajaran}</span> • Guru: <span className="font-semibold text-slate-800">{teacher.namaGuru}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <button
            type="button"
            onClick={() => onOpenSessionModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pertemuan</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama atau NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">Semua Gender</option>
            <option value="L">Laki-laki (L)</option>
            <option value="P">Perempuan (P)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Legenda:</span>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            H: Hadir
          </span>
          <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            S: Sakit
          </span>
          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            I: Izin
          </span>
          <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            A: Alfa
          </span>
        </div>
      </div>

      {/* Spreadsheet Main Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead className="bg-slate-100/95 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
              <tr>
                <th className="py-3 px-2 text-center w-10 border-r border-slate-200">No</th>
                <th className="py-3 px-2.5 w-24 border-r border-slate-200">NISN</th>
                <th className="py-3 px-3 min-w-[180px] border-r border-slate-200">Nama Siswa</th>
                <th className="py-3 px-1 text-center w-8 border-r border-slate-200">L/P</th>

                {/* Session Columns */}
                {sessions.map((sess) => (
                  <th
                    key={sess.id}
                    className="py-2 px-1 text-center min-w-[76px] border-r border-slate-200 bg-slate-50/80"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1 font-extrabold text-indigo-700">
                        <span>P{sess.pertemuanKe}</span>
                        <button
                          type="button"
                          onClick={() => onOpenSessionModal(sess)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Edit Sesi"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {sess.tanggal.slice(5)}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <button
                          type="button"
                          onClick={() => onMarkAllPresent(sess.id)}
                          className="text-[9px] px-1 py-0.2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-semibold transition-colors"
                          title="Tandai Semua Hadir"
                        >
                          All H
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenWhatsAppShare(sess)}
                          className="text-slate-400 hover:text-emerald-600 transition-colors"
                          title="Laporan Harian WA Ortu"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </th>
                ))}

                {/* Summary Columns */}
                <th className="py-3 px-2 text-center w-10 text-emerald-800 bg-emerald-50/70 border-r border-slate-200">
                  H
                </th>
                <th className="py-3 px-2 text-center w-10 text-blue-800 bg-blue-50/70 border-r border-slate-200">
                  S
                </th>
                <th className="py-3 px-2 text-center w-10 text-amber-800 bg-amber-50/70 border-r border-slate-200">
                  I
                </th>
                <th className="py-3 px-2 text-center w-10 text-rose-800 bg-rose-50/70 border-r border-slate-200">
                  A
                </th>
                <th className="py-3 px-2 text-center w-16 text-slate-900 bg-slate-100 font-bold">
                  % Kehadiran
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={8 + (sessions?.length || 0)}
                    className="py-12 text-center text-slate-400 font-medium"
                  >
                    Tidak ada data siswa yang cocok dengan filter atau pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const stat = studentStats[st.id] || {
                    hadir: 0,
                    sakit: 0,
                    izin: 0,
                    alfa: 0,
                    persentase: 100,
                  };

                  return (
                    <tr key={st.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-100">
                        {st.no}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-[11px] text-slate-600 border-r border-slate-100">
                        {st.nisn}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 truncate max-w-[200px] border-r border-slate-100">
                        {st.nama}
                      </td>
                      <td className="py-2 px-1 text-center font-bold text-[11px] text-slate-500 border-r border-slate-100">
                        {st.gender}
                      </td>

                      {/* Session Record Cells */}
                      {sessions.map((sess) => {
                        const rec = sess.records[st.id]?.status || 'H';
                        return (
                          <td
                            key={sess.id}
                            className="py-1.5 px-1 text-center border-r border-slate-100"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateAttendanceRecord(
                                  sess.id,
                                  st.id,
                                  getNextStatus(rec)
                                )
                              }
                              className={`w-7 h-7 rounded-lg font-bold text-xs inline-flex items-center justify-center transition-all cursor-pointer ${
                                rec === 'H'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : rec === 'S'
                                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                  : rec === 'I'
                                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                              title={`Status: ${rec}. Klik untuk ganti.`}
                            >
                              {rec}
                            </button>
                          </td>
                        );
                      })}

                      {/* Student Stats Totals */}
                      <td className="py-2 px-2 text-center font-bold text-emerald-700 bg-emerald-50/40 border-r border-slate-100">
                        {stat.hadir}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-blue-700 bg-blue-50/40 border-r border-slate-100">
                        {stat.sakit}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-amber-700 bg-amber-50/40 border-r border-slate-100">
                        {stat.izin}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-rose-700 bg-rose-50/40 border-r border-slate-100">
                        {stat.alfa}
                      </td>
                      <td className="py-2 px-2 text-center font-black">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] ${
                            stat.persentase >= 85
                              ? 'bg-emerald-100 text-emerald-800'
                              : stat.persentase >= 75
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {stat.persentase}%
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
