import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  FileSpreadsheet,
  Download,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  UserPlus,
  FileDown,
} from 'lucide-react';
import { Student, ClassRoom } from '../types';
import { exportStudentsToExcel, downloadStudentTemplate } from '../utils/excel';

interface StudentManagementViewProps {
  currentClass: ClassRoom;
  students: Student[];
  onOpenStudentModal: (student?: Student) => void;
  onOpenSpreadsheetImportModal: () => void;
  onDeleteStudent: (student: Student) => void;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({
  currentClass,
  students = [],
  onOpenStudentModal,
  onOpenSpreadsheetImportModal,
  onDeleteStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'L' | 'P'>('all');

  const filteredStudents = useMemo(() => {
    return (students || []).filter((s) => {
      if (!s) return false;
      const matchSearch =
        (s.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nisn || '').includes(searchQuery);
      const matchGender = genderFilter === 'all' || s.gender === genderFilter;
      return matchSearch && matchGender;
    });
  }, [students, searchQuery, genderFilter]);

  const handleExportData = () => {
    exportStudentsToExcel(students || [], currentClass.namaKelas);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Master Data Siswa
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {students?.length || 0} Siswa Terdaftar di Kelas {currentClass.namaKelas}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Data Peserta Didik - {currentClass.namaKelas}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Kelola data absensi pokok siswa, NISN, nomor WhatsApp orang tua, dan impor massal dari file Excel atau copy-paste spreadsheet.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenSpreadsheetImportModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Impor dari Spreadsheet</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenStudentModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadStudentTemplate('xlsx')}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            title="Download template kosong Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Format Excel</span>
          </button>
          <button
            type="button"
            onClick={handleExportData}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            title="Ekspor daftar siswa saat ini"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Ekspor Data</span>
          </button>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead className="bg-slate-100/95 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
              <tr>
                <th className="py-3 px-3 text-center w-12 border-r border-slate-200">No</th>
                <th className="py-3 px-3 w-28 border-r border-slate-200">NISN</th>
                <th className="py-3 px-4 border-r border-slate-200">Nama Lengkap Siswa</th>
                <th className="py-3 px-2 text-center w-16 border-r border-slate-200">Gender</th>
                <th className="py-3 px-3 w-36 border-r border-slate-200">No WA Ortu</th>
                <th className="py-3 px-4 border-r border-slate-200">Catatan Khusus</th>
                <th className="py-3 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Belum ada siswa di kelas ini. Klik &apos;Impor dari Spreadsheet&apos; atau &apos;Tambah Siswa&apos;.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500 border-r border-slate-100">
                      {st.no}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 border-r border-slate-100">
                      {st.nisn}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-100">
                      {st.nama}
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-slate-100">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          st.gender === 'L'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}
                      >
                        {st.gender === 'L' ? 'L' : 'P'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 border-r border-slate-100">
                      {st.noHpOrangTua || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 text-xs border-r border-slate-100">
                      {st.catatanUmum || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenStudentModal(st)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Siswa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteStudent(st)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
