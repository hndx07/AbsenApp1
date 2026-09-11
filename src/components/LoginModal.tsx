import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  School,
  BookOpen,
  GraduationCap,
  Plus,
  X,
  Layers,
  LogIn,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Key,
} from 'lucide-react';
import { TeacherProfile, ClassRoom } from '../types';
import {
  signInWithGoogleWorkspace,
  GoogleWorkspaceAuthResult,
  createSimulatedWorkspaceSession,
  setManualAccessToken,
} from '../utils/googleWorkspace';

export interface LoginModalProps {
  isOpen: boolean;
  teacher: TeacherProfile;
  classes?: ClassRoom[];
  onSave?: (teacher: TeacherProfile, newClasses?: ClassRoom[]) => void;
  onSaveProfile?: (teacher: TeacherProfile) => void;
  onGoogleAuthSuccess?: (authResult: GoogleWorkspaceAuthResult) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  teacher,
  classes = [],
  onSave,
  onSaveProfile,
  onGoogleAuthSuccess,
  onClose,
}) => {
  const [namaGuru, setNamaGuru] = useState(teacher?.namaGuru || '');
  const [nip, setNip] = useState(teacher?.nip || '');
  const [namaSekolah, setNamaSekolah] = useState(teacher?.namaSekolah || '');
  const [mapel, setMapel] = useState(teacher?.mataPelajaranUtama || '');
  const [tahunAjaran, setTahunAjaran] = useState(teacher?.tahunAjaran || '2025/2026');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(teacher?.semester || 'Ganjil');

  // Initial class input in login modal
  const [newClassName, setNewClassName] = useState('');
  const [newClassMapel, setNewClassMapel] = useState('');
  const [newClassKkm, setNewClassKkm] = useState(75);
  const [localClasses, setLocalClasses] = useState<ClassRoom[]>(() => classes || []);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Domain whitelist error state & manual token
  const [domainErrorConfig, setDomainErrorConfig] = useState<{
    domain: string;
    projectId: string;
    consoleUrl: string;
  } | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [showManualToken, setShowManualToken] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');

  useEffect(() => {
    if (classes && classes.length > 0) {
      setLocalClasses(classes);
    }
  }, [classes]);

  useEffect(() => {
    if (teacher) {
      setNamaGuru(teacher.namaGuru || '');
      setNip(teacher.nip || '');
      setNamaSekolah(teacher.namaSekolah || 'SMK Muhammadiyah Bawang');
      setMapel(teacher.mataPelajaranUtama || '');
      setTahunAjaran(teacher.tahunAjaran || '2025/2026');
      setSemester(teacher.semester || 'Ganjil');
    }
  }, [teacher]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    setDomainErrorConfig(null);
    try {
      const result = await signInWithGoogleWorkspace();
      if (onGoogleAuthSuccess) {
        onGoogleAuthSuccess({
          accessToken: result.accessToken,
          userEmail: result.user?.email || (result as any).userEmail || undefined,
          displayName: result.user?.displayName || (result as any).displayName || undefined,
          photoUrl: result.user?.photoURL || (result as any).photoUrl || undefined,
          user: result.user,
        });
      }
      onClose();
    } catch (err: any) {
      if (
        err?.isUnauthorizedDomain ||
        err?.code === 'auth/unauthorized-domain' ||
        err?.message?.includes('unauthorized-domain')
      ) {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'run.app';
        setDomainErrorConfig({
          domain: err.domain || hostname,
          projectId: err.projectId || 'dependable-bearing-x14dk',
          consoleUrl:
            err.consoleUrl ||
            'https://console.firebase.google.com/project/dependable-bearing-x14dk/authentication/settings',
        });
        setGoogleError(null);
      } else {
        console.error('Google Sign In error:', err);
        setGoogleError(err.message || 'Gagal masuk dengan akun Google.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSimulatedTeacherSignIn = () => {
    const email = teacher?.email || 'hendxguitar@gmail.com';
    const name = namaGuru.trim() || teacher?.namaGuru || 'Drs. Hendra Al Kindi, M.Pd';
    const simResult = createSimulatedWorkspaceSession(email, name);

    if (onGoogleAuthSuccess) {
      onGoogleAuthSuccess(simResult);
    }
    onClose();
  };

  const handleApplyManualToken = () => {
    if (!manualTokenInput.trim()) return;
    const email = teacher?.email || 'guru@smkmuhbawang.sch.id';
    const name = namaGuru.trim() || teacher?.namaGuru || 'Drs. Hendra Al Kindi, M.Pd';
    const authRes = setManualAccessToken(manualTokenInput.trim(), email, name);
    if (onGoogleAuthSuccess) {
      onGoogleAuthSuccess(authRes);
    }
    onClose();
  };

  const handleCopyDomain = () => {
    const domainToCopy =
      domainErrorConfig?.domain || (typeof window !== 'undefined' ? window.location.hostname : '');
    if (domainToCopy && navigator?.clipboard) {
      navigator.clipboard.writeText(domainToCopy);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newClass: ClassRoom = {
      id: 'class-' + Date.now(),
      namaKelas: newClassName.trim(),
      mataPelajaran: newClassMapel.trim() || mapel || 'Umum',
      kkm: Number(newClassKkm) || 75,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setLocalClasses([...(localClasses || []), newClass]);
    setNewClassName('');
    setNewClassMapel('');
  };

  const handleRemoveClass = (id: string) => {
    if ((localClasses?.length || 0) <= 1) {
      alert('Guru harus memiliki setidaknya satu kelas.');
      return;
    }
    setLocalClasses((localClasses || []).filter((c) => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaGuru.trim()) {
      alert('Silakan masukkan nama guru.');
      return;
    }

    const updatedTeacher: TeacherProfile = {
      ...teacher,
      namaGuru: namaGuru.trim(),
      nip: nip.trim(),
      namaSekolah: namaSekolah.trim() || 'Sekolah',
      mataPelajaranUtama: mapel.trim() || 'Mata Pelajaran',
      tahunAjaran,
      semester,
      isLoggedIn: true,
    };

    if (onSave) {
      onSave(updatedTeacher, localClasses || []);
    } else if (onSaveProfile) {
      onSaveProfile(updatedTeacher);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Profil Guru & Manajemen Kelas</h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                Konfigurasi identitas pendidik, mata pelajaran yang diampu, dan daftar kelas Anda
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {/* Quick Google Workspace Login Option */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-blue-600" />
                  Masuk dengan Akun Google (Workspace)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Sinkronisasi langsung profil guru dengan Google Sheets, Docs, Drive, Calendar, dan Gmail.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSimulatedTeacherSignIn}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                  title="Masuk langsung dengan profil Guru SMK Bawang simulasi lengkap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mode Guru SMK</span>
                </button>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Menghubungkan...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Login Akun Google</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Unauthorized Domain Guide & Fallback Banner */}
            {domainErrorConfig && (
              <div className="mt-3 p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-900">
                      Domain Sandbox AI Studio Belum Diizinkan di Firebase Console
                    </h4>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      URL preview container saat ini (<strong>{domainErrorConfig.domain}</strong>) belum terdaftar di <strong>Authorized Domains</strong> Firebase Auth proyek <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono text-[10px]">{domainErrorConfig.projectId}</code>.
                    </p>
                  </div>
                </div>

                {/* Domain Copy Box */}
                <div className="bg-white p-2 rounded-lg border border-amber-200 flex items-center justify-between gap-2">
                  <div className="overflow-hidden">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Domain Untuk Di-Whitelist:</span>
                    <span className="text-xs font-mono font-medium text-slate-700 truncate block">
                      {domainErrorConfig.domain}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyDomain}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-md transition-colors cursor-pointer shrink-0"
                  >
                    {copiedDomain ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Domain</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Direct Action Options */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSimulatedTeacherSignIn}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Aktifkan Mode Guru SMK (Lanjutkan Tanpa Hambatan)</span>
                  </button>
                  <a
                    href={domainErrorConfig.consoleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Buka Firebase Console Settings</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowManualToken(!showManualToken)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline ml-auto cursor-pointer"
                  >
                    <Key className="w-3 h-3" />
                    <span>{showManualToken ? 'Tutup Input Token' : 'Atau Gunakan Token Manual'}</span>
                  </button>
                </div>

                {/* Manual Token Input Accordion */}
                {showManualToken && (
                  <div className="pt-2 border-t border-amber-200 flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="Tempel Google OAuth Access Token (Bearer ya29...)"
                      value={manualTokenInput}
                      onChange={(e) => setManualTokenInput(e.target.value)}
                      className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleApplyManualToken}
                      disabled={!manualTokenInput.trim()}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      Terapkan
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Other Google Error */}
            {googleError && !domainErrorConfig && (
              <p className="text-xs text-rose-600 font-medium mt-2 bg-rose-50 p-2 rounded-lg border border-rose-200">
                {googleError}
              </p>
            )}
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
              Atau Atur Profil Manual
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Identitas Guru & Sekolah */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <School className="w-4 h-4 text-indigo-600" />
              Identitas Guru & Lembaga
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Guru Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaGuru}
                  onChange={(e) => setNamaGuru(e.target.value)}
                  placeholder="Contoh: Drs. Hendra Al Kindi, M.Pd"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP / NUPTK / Kode Guru
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Contoh: 19850714 201001 1 012"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Sekolah / Madrasah
                </label>
                <input
                  type="text"
                  value={namaSekolah}
                  onChange={(e) => setNamaSekolah(e.target.value)}
                  placeholder="Contoh: SMK Negeri 1 Teladan"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mata Pelajaran Utama Yang Diampu
                </label>
                <input
                  type="text"
                  value={mapel}
                  onChange={(e) => setMapel(e.target.value)}
                  placeholder="Contoh: Pemrograman Web / Informatika"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  value={tahunAjaran}
                  onChange={(e) => setTahunAjaran(e.target.value)}
                  placeholder="2025/2026"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Manajemen Kelas Guru (Satu guru bisa punya banyak kelas) */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Daftar Kelas Yang Diampu ({localClasses?.length || 0} Kelas)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Anda dapat mengajar di banyak kelas sekaligus dengan mata pelajaran dan KKM masing-masing.
            </p>

            {/* List of existing classes */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 mb-3">
              {(localClasses || []).map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">
                      {cls.namaKelas ? cls.namaKelas.charAt(0) : 'K'}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">{cls.namaKelas}</span>
                      <span className="text-slate-500 ml-2">({cls.mataPelajaran})</span>
                      <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded ml-2 font-medium">
                        KKM: {cls.kkm}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveClass(cls.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                    title="Hapus Kelas"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Add Class inside login */}
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-indigo-900 block">
                + Tambah Kelas Cepat:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Nama Kelas (misal: X RPL 2)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder={`Mapel (${mapel || 'Sesuai Guru'})`}
                  value={newClassMapel}
                  onChange={(e) => setNewClassMapel(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="KKM (75)"
                    value={newClassKkm}
                    onChange={(e) => setNewClassKkm(Number(e.target.value))}
                    className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white w-20 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddClass}
                    className="grow inline-flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              Simpan & Masuk Aplikasi
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};
