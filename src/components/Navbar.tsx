import React from 'react';
import {
  School,
  User,
  BookOpen,
  CalendarCheck2,
  GraduationCap,
  BarChart3,
  FileSpreadsheet,
  MessageSquare,
  Plus,
  RefreshCw,
  ChevronDown,
  Trash2,
  LogOut,
  Cloud,
  MapPin,
} from 'lucide-react';
import { ActiveTab, ClassRoom, TeacherProfile } from '../types';
import { SchoolLogo } from './SchoolLogo';

interface NavbarProps {
  teacher: TeacherProfile;
  classes: ClassRoom[];
  activeClassId: string;
  activeTab: ActiveTab;
  isCloudSaving?: boolean;
  onSelectClass: (classId: string) => void;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenClassModal: () => void;
  onOpenLoginModal: () => void;
  onResetData: () => void;
  onDeleteClass: (classId: string) => void;
  onLogout: () => void;
  onOpenFrontPage?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  teacher,
  classes = [],
  activeClassId,
  activeTab,
  isCloudSaving = false,
  onSelectClass,
  onSelectTab,
  onOpenClassModal,
  onOpenLoginModal,
  onResetData,
  onDeleteClass,
  onLogout,
  onOpenFrontPage,
}) => {
  const activeClass = (classes || []).find((c) => c.id === activeClassId);

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs no-print backdrop-blur-md bg-white/95">
      {/* Primary Brand & Actions Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[58px] py-2 gap-2 sm:gap-4 flex-wrap md:flex-nowrap">
          {/* Brand & School Logo */}
          <div
            onClick={onOpenFrontPage}
            className={`flex items-center gap-2.5 min-w-0 shrink-0 ${
              onOpenFrontPage ? 'cursor-pointer group' : ''
            }`}
            title={onOpenFrontPage ? 'Buka Halaman Muka / Landing Page' : undefined}
          >
            <SchoolLogo
              size="md"
              className="p-1 bg-white rounded-xl shadow-xs shrink-0 ring-1 ring-slate-200/80 group-hover:ring-emerald-500 transition-all"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight truncate group-hover:text-emerald-700 transition-colors">
                  SIM Presensi & Nilai
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                  SMK Muh Bawang
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate hidden lg:block font-medium">
                Tahun Ajaran {teacher.tahunAjaran} ({teacher.semester})
              </p>
            </div>
          </div>

          {/* Right Action Tools: Class Switcher, Cloud Badge, Teacher Profile, Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto shrink-0 flex-wrap justify-end">
            {/* Clean Class Selector Pill */}
            <div className="flex items-center gap-1 bg-slate-100/90 hover:bg-slate-200/70 p-0.5 sm:p-1 rounded-xl border border-slate-200/90 transition-colors">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 ml-1.5 shrink-0 hidden sm:block" />
              <div className="relative">
                <select
                  id="navbar-class-select"
                  value={activeClassId}
                  onChange={(e) => onSelectClass(e.target.value)}
                  aria-label="Pilih Kelas"
                  className="appearance-none bg-transparent text-slate-900 font-bold text-xs sm:text-sm pl-2 pr-6 py-1 cursor-pointer focus:outline-none max-w-[130px] sm:max-w-[190px] truncate"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.namaKelas} • {cls.mataPelajaran}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Add Class Button */}
              <button
                id="btn-add-class-nav"
                onClick={onOpenClassModal}
                title="Buat Kelas Baru"
                className="p-1 sm:px-2 sm:py-1 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200/80 rounded-lg transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {activeClass && (classes?.length || 0) > 1 && (
                <button
                  id="btn-delete-class-nav"
                  onClick={() => onDeleteClass(activeClass.id)}
                  title={`Hapus Kelas ${activeClass.namaKelas}`}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer hidden sm:block"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Cloud Sync Status Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-600 shadow-2xs">
              {isCloudSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />
                  <span className="text-amber-600 font-semibold hidden md:inline">Menyimpan...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-slate-600 font-medium hidden md:inline">Cloud Aktif</span>
                </>
              )}
            </div>

            {/* Profile Button with Avatar, Name & Email */}
            <button
              id="btn-teacher-profile"
              onClick={onOpenLoginModal}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200/90 hover:border-indigo-300 bg-white hover:bg-indigo-50/40 transition-all text-left cursor-pointer shadow-2xs"
              title="Profil Guru & Status Akun Cloud Firestore"
            >
              {teacher.avatarUrl ? (
                <img
                  src={teacher.avatarUrl}
                  alt={teacher.namaGuru || 'Foto Profil'}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shadow-2xs shrink-0 ring-2 ring-indigo-200"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 ring-2 ring-indigo-200">
                  {teacher.namaGuru?.charAt(0) || teacher.email?.charAt(0).toUpperCase() || 'G'}
                </div>
              )}
              <div className="hidden sm:block text-left max-w-[150px] lg:max-w-[180px]">
                <div className="font-bold text-slate-800 text-xs truncate leading-tight">
                  {teacher.namaGuru || 'Guru SMK'}
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate leading-tight">
                  {teacher.email || 'Akun Google'}
                </div>
              </div>
            </button>

            {/* Front Page / Portal Link */}
            {onOpenFrontPage && (
              <button
                id="btn-nav-front-page"
                onClick={onOpenFrontPage}
                title="Buka Halaman Muka Login"
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <School className="w-3.5 h-3.5 text-emerald-600" />
                <span>Halaman Muka</span>
              </button>
            )}

            {/* Prominent Clear Logout Button */}
            <button
              id="btn-logout"
              onClick={onLogout}
              title="Keluar dari sesi Guru dan Firestore"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clean Immersive Navigation Tabs */}
      <div className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto py-1.5 scrollbar-none" aria-label="Tabs">
            <button
              id="tab-absensi"
              onClick={() => onSelectTab('absensi')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'absensi'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CalendarCheck2 className="w-3.5 h-3.5" />
              <span>Presensi Siswa</span>
            </button>

            <button
              id="tab-nilai"
              onClick={() => onSelectTab('nilai')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'nilai'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Rekap Nilai</span>
            </button>

            <button
              id="tab-statistik"
              onClick={() => onSelectTab('statistik')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'statistik'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Statistik & Resume</span>
            </button>

            <button
              id="tab-impor"
              onClick={() => onSelectTab('impor')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'impor'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Data Siswa</span>
            </button>

            <button
              id="tab-workspace"
              onClick={() => onSelectTab('workspace')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200/60'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Workspace & Cloud</span>
            </button>

            <button
              id="tab-peta"
              onClick={() => onSelectTab('peta')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'peta'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Peta & Zonasi</span>
            </button>

            <button
              id="tab-laporan-ortu"
              onClick={() => onSelectTab('laporan-ortu')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'laporan-ortu'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100 border border-emerald-200/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Laporan Ortu (WA)</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
