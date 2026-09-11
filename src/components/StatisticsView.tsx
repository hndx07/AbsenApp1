import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Users,
  Award,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  ClassRoom,
  Student,
  AttendanceSession,
  TeacherProfile,
  StudentGrade,
} from '../types';
import { calculateStudentGrade } from '../utils/gradeCalculations';

interface StatisticsViewProps {
  currentClass: ClassRoom;
  students: Student[];
  sessions: AttendanceSession[];
  grades: Record<string, StudentGrade>;
  teacher: TeacherProfile;
}

const COLORS_ATTENDANCE = ['#059669', '#2563eb', '#d97706', '#e11d48'];
const COLORS_GRADE = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  currentClass,
  students = [],
  sessions = [],
  grades = {},
  teacher,
}) => {
  // Attendance Overall Aggregation
  const attendanceTotals = useMemo(() => {
    let totalH = 0;
    let totalS = 0;
    let totalI = 0;
    let totalA = 0;

    (sessions || []).forEach((sess) => {
      Object.values(sess?.records || {}).forEach((r: any) => {
        if (r?.status === 'H') totalH++;
        else if (r?.status === 'S') totalS++;
        else if (r?.status === 'I') totalI++;
        else if (r?.status === 'A') totalA++;
      });
    });

    const grandTotal = totalH + totalS + totalI + totalA;
    const rateHadir = grandTotal > 0 ? Math.round((totalH / grandTotal) * 100) : 100;

    return { totalH, totalS, totalI, totalA, grandTotal, rateHadir };
  }, [sessions]);

  // Attendance per session chart data
  const perSessionAttendanceData = useMemo(() => {
    return (sessions || []).map((sess) => {
      let h = 0;
      let s = 0;
      let i = 0;
      let a = 0;

      (students || []).forEach((st) => {
        const rec = sess?.records?.[st.id]?.status;
        if (rec === 'H') h++;
        else if (rec === 'S') s++;
        else if (rec === 'I') i++;
        else if (rec === 'A') a++;
      });

      return {
        name: `P${sess.pertemuanKe}`,
        Hadir: h,
        Sakit: s,
        Izin: i,
        Alfa: a,
      };
    });
  }, [sessions, students]);

  // Grade Metrics & Distribution
  const gradeDistribution = useMemo(() => {
    let a = 0;
    let b = 0;
    let c = 0;
    let d = 0;
    let tuntas = 0;
    let totalNilai = 0;
    let validCount = 0;

    (students || []).forEach((st) => {
      const calc = calculateStudentGrade(grades?.[st.id], currentClass.kkm);
      if (calc.nilaiAkhir > 0) {
        totalNilai += calc.nilaiAkhir;
        validCount++;
        if (calc.isTuntas) tuntas++;

        if (calc.predikat === 'A') a++;
        else if (calc.predikat === 'B') b++;
        else if (calc.predikat === 'C') c++;
        else if (calc.predikat === 'D') d++;
      }
    });

    const rataRata = validCount > 0 ? Math.round(totalNilai / validCount) : 0;
    const rateTuntas = validCount > 0 ? Math.round((tuntas / validCount) * 100) : 0;

    return {
      rataRata,
      tuntas,
      remedial: validCount - tuntas,
      rateTuntas,
      validCount,
      chartData: [
        { name: 'Predikat A (Sangat Baik)', value: a },
        { name: 'Predikat B (Baik)', value: b },
        { name: 'Predikat C (Cukup)', value: c },
        { name: 'Predikat D (Perlu Remedial)', value: d },
      ],
    };
  }, [students, grades, currentClass.kkm]);

  // Pie chart attendance data
  const pieAttendanceData = [
    { name: 'Hadir', value: attendanceTotals.totalH },
    { name: 'Sakit', value: attendanceTotals.totalS },
    { name: 'Izin', value: attendanceTotals.totalI },
    { name: 'Alfa', value: attendanceTotals.totalA },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Analitik & Statistik Rekap
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Kelas {currentClass.namaKelas}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Capaian Akademik & Presensi
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Grafik komprehensif kehadiran siswa, distribusi nilai formatif & sumatif, serta persentase ketuntasan KKM {currentClass.kkm}.
          </p>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Rata-rata Presensi</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {attendanceTotals.rateHadir}%
          </div>
          <p className="text-[11px] text-slate-500">
            {attendanceTotals.totalH} total kehadiran dari {sessions.length} sesi
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Rata-rata Nilai Kelas</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {gradeDistribution.rataRata}
          </div>
          <p className="text-[11px] text-slate-500">
            Standar KKM: {currentClass.kkm} (Kurikulum Merdeka)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Tingkat Ketuntasan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {gradeDistribution.rateTuntas}%
          </div>
          <p className="text-[11px] text-slate-500">
            {gradeDistribution.tuntas} dari {gradeDistribution.validCount} siswa tuntas
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Siswa Perlu Remedial</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">
            {gradeDistribution.remedial}
          </div>
          <p className="text-[11px] text-slate-500">
            Nilai Akhir di bawah KKM {currentClass.kkm}
          </p>
        </div>
      </div>

      {/* Charts Grid: Bar Chart & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance per Meeting Bar Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Dinamika Kehadiran Siswa Per Pertemuan (P1 - P{sessions.length})</span>
            </h3>
            <span className="text-xs text-slate-500">Total {students.length} Siswa/Kelas</span>
          </div>

          <div className="h-72 w-full">
            {perSessionAttendanceData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Belum ada sesi KBM tercatat.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perSessionAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Hadir" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Sakit" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Izin" fill="#d97706" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Alfa" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Grade Distribution Pie Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Distribusi Predikat Nilai</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sebaran predikat A, B, C, D seluruh siswa
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistribution.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {gradeDistribution.chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_GRADE[index % COLORS_GRADE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {gradeDistribution.chartData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-slate-600">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS_GRADE[idx % COLORS_GRADE.length] }}
                />
                <span className="truncate">
                  {item.name.slice(0, 10)}: <strong>{item.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
