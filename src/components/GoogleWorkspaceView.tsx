import React, { useState } from 'react';
import {
  Cloud,
  FileSpreadsheet,
  FileText,
  Mail,
  Calendar as CalendarIcon,
  CheckSquare,
  Database,
  ExternalLink,
  RefreshCw,
  Send,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lock,
  Layers,
  HardDrive,
} from 'lucide-react';
import {
  ClassRoom,
  Student,
  AttendanceSession,
  TeacherProfile,
  GradeRecord,
} from '../types';
import {
  exportToGoogleSheets,
  createGoogleDocAgenda,
  sendGmailReport,
  GoogleWorkspaceAuthResult,
} from '../utils/googleWorkspace';
import { GoogleCalendarPanel } from './GoogleCalendarPanel';
import { GoogleTasksPanel } from './GoogleTasksPanel';
import { CloudSqlFirebasePanel } from './CloudSqlFirebasePanel';

interface GoogleWorkspaceViewProps {
  currentClass: ClassRoom;
  students: Student[];
  sessions: AttendanceSession[];
  grades: Record<string, GradeRecord>;
  teacher: TeacherProfile;
  workspaceAuth: GoogleWorkspaceAuthResult | null;
  onConnectGoogle: () => void;
  onOpenConfirmModal: (config: {
    title: string;
    description: string;
    actionLabel: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
  onShowStatus: (status: {
    type: 'success' | 'error' | 'info';
    message: string;
    linkUrl?: string;
    linkLabel?: string;
  }) => void;
}

type WorkspaceSubTab = 'drive_sheets' | 'calendar' | 'tasks' | 'cloudsql_firebase';

export const GoogleWorkspaceView: React.FC<GoogleWorkspaceViewProps> = ({
  currentClass,
  students,
  sessions,
  grades,
  teacher,
  workspaceAuth,
  onConnectGoogle,
  onOpenConfirmModal,
  onShowStatus,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<WorkspaceSubTab>('drive_sheets');

  // Export Loading States
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [isExportingDoc, setIsExportingDoc] = useState(false);
  const [isSendingGmail, setIsSendingGmail] = useState(false);

  // Gmail Custom State
  const [recipientEmail, setRecipientEmail] = useState('kurikulum@smkmuhbawang.sch.id');
  const [emailSubject, setEmailSubject] = useState(
    `[Rekap Presensi & Nilai] Kelas ${currentClass.namaKelas} - SMK Muhammadiyah Bawang`
  );
  const [customMessage, setCustomMessage] = useState(
    `Yth. Bapak/Ibu Kepala Sekolah & Tim Kurikulum,\n\nBerikut terlampir laporan ringkasan presensi KBM dan evaluasi nilai siswa mata pelajaran ${currentClass.mataPelajaran} kelas ${currentClass.namaKelas} untuk diverifikasi.\n\nSalam hormat,\n${teacher.namaGuru}`
  );

  const accessToken = workspaceAuth?.accessToken || null;

  // Handle Google Sheets Export
  const handleExportSheets = async () => {
    if (!accessToken) {
      onShowStatus({
        type: 'info',
        message: 'Silakan hubungkan akun Google Workspace Anda terlebih dahulu.',
      });
      onConnectGoogle();
      return;
    }

    setIsExportingSheets(true);
    try {
      const result = await exportToGoogleSheets(accessToken, currentClass, students, sessions, grades);
      onShowStatus({
        type: 'success',
        message: `Berhasil membuat spreadsheet Google Sheets untuk kelas ${currentClass.namaKelas}!`,
        linkUrl: result.spreadsheetUrl,
        linkLabel: 'Buka di Google Sheets',
      });
    } catch (err: any) {
      console.error('Export Sheets Error:', err);
      onShowStatus({
        type: 'error',
        message: err.message || 'Gagal mengekspor data ke Google Sheets.',
      });
    } finally {
      setIsExportingSheets(false);
    }
  };

  // Handle Google Docs Export
  const handleExportDoc = async () => {
    if (!accessToken) {
      onShowStatus({
        type: 'info',
        message: 'Silakan hubungkan akun Google Workspace Anda terlebih dahulu.',
      });
      onConnectGoogle();
      return;
    }

    setIsExportingDoc(true);
    try {
      const result = await createGoogleDocAgenda(accessToken, currentClass, teacher, sessions);
      onShowStatus({
        type: 'success',
        message: `Berhasil menerbitkan Berita Acara & Jurnal KBM ke Google Docs!`,
        linkUrl: result.documentUrl,
        linkLabel: 'Buka di Google Docs',
      });
    } catch (err: any) {
      console.error('Export Doc Error:', err);
      onShowStatus({
        type: 'error',
        message: err.message || 'Gagal menerbitkan dokumen ke Google Docs.',
      });
    } finally {
      setIsExportingDoc(false);
    }
  };

  // Handle Gmail Send
  const handleSendGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      onShowStatus({
        type: 'info',
        message: 'Silakan hubungkan akun Google Workspace Anda terlebih dahulu.',
      });
      onConnectGoogle();
      return;
    }

    if (!recipientEmail.trim()) {
      onShowStatus({
        type: 'error',
        message: 'Harap masukkan alamat email penerima.',
      });
      return;
    }

    setIsSendingGmail(true);
    try {
      // Calculate quick metrics
      let totalHadir = 0;
      let totalSakit = 0;
      let totalIzin = 0;
      let totalAlfa = 0;

      sessions.forEach((s) => {
        Object.values(s.records).forEach((r: any) => {
          if (r?.status === 'H') totalHadir++;
          else if (r?.status === 'S') totalSakit++;
          else if (r?.status === 'I') totalIzin++;
          else if (r?.status === 'A') totalAlfa++;
        });
      });

      const bodyHtml = `
        <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #047857; margin-top: 0;">SMK Muhammadiyah Bawang</h2>
          <p><strong>Laporan Rekap Presensi & Nilai Siswa</strong></p>
          <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 16px 0;" />
          <p><strong>Kelas:</strong> ${currentClass.namaKelas}</p>
          <p><strong>Mata Pelajaran:</strong> ${currentClass.mataPelajaran}</p>
          <p><strong>Guru Pengampu:</strong> ${teacher.namaGuru}</p>
          <p><strong>Total Siswa:</strong> ${students.length} Siswa</p>
          <p><strong>Total Sesi KBM:</strong> ${sessions.length} Pertemuan</p>
          
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0;">Statistik Kehadiran:</h4>
            <ul>
              <li>Hadir: ${totalHadir} kali</li>
              <li>Sakit: ${totalSakit} kali</li>
              <li>Izin: ${totalIzin} kali</li>
              <li>Alfa: ${totalAlfa} kali</li>
            </ul>
          </div>
          
          <p style="white-space: pre-line;">${customMessage}</p>
          <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
          <p style="font-size: 11px; color: #64748b;">
            Dikirim secara otomatis melalui SIM Presensi & Nilai SMK Muhammadiyah Bawang terintegrasi Google Workspace.
          </p>
        </div>
      `;

      await sendGmailReport(accessToken, {
        to: recipientEmail.trim(),
        subject: emailSubject.trim(),
        bodyHtml,
      });

      onShowStatus({
        type: 'success',
        message: `Laporan resmi berhasil terkirim via Gmail ke ${recipientEmail}!`,
      });
    } catch (err: any) {
      console.error('Send Gmail Error:', err);
      onShowStatus({
        type: 'error',
        message: err.message || 'Gagal mengirim email melalui Gmail API.',
      });
    } finally {
      setIsSendingGmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Google Workspace Connectivity Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-800 text-white rounded-3xl p-6 shadow-md border border-blue-600/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-bold backdrop-blur-xs">
              <Cloud className="w-3.5 h-3.5 text-blue-200" />
              <span>Google Cloud & Workspace Enterprise Suite</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Pusat Integrasi Google Workspace, Cloud SQL & Firebase
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              Hubungkan presensi dan nilai kelas {currentClass.namaKelas} secara langsung dengan ekosistem resmi Google: Google Sheets, Docs, Drive, Gmail, Calendar, Tasks, serta penyimpanan cloud ganda Cloud SQL & Firebase.
            </p>
          </div>

          {/* Account Status Badge & Trigger */}
          <div className="bg-blue-950/40 p-3.5 rounded-2xl border border-blue-500/30 shrink-0 flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {accessToken ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Google Terhubung</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-white">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Koneksi Diperlukan</span>
                </span>
              )}
            </div>
            {workspaceAuth?.userEmail && (
              <span className="text-[11px] text-blue-200 font-mono">
                {workspaceAuth.userEmail}
              </span>
            )}
            <button
              type="button"
              onClick={onConnectGoogle}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{accessToken ? 'Ganti / Refresh Izin Google' : 'Sambungkan Akun Google'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('drive_sheets')}
          className={`flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'drive_sheets'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Sheets, Docs, Drive & Gmail</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('calendar')}
          className={`flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'calendar'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Google Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tasks')}
          className={`flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'tasks'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Google Tasks</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('cloudsql_firebase')}
          className={`flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'cloudsql_firebase'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cloud SQL & Firebase</span>
        </button>
      </div>

      {/* SUBTAB 1: SHEETS, DOCS, DRIVE & GMAIL */}
      {activeSubTab === 'drive_sheets' && (
        <div className="space-y-6">
          {/* Quick Action Grid: Sheets & Docs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Google Sheets Export Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Google Sheets API v4
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Sinkronisasi ke Google Sheets
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Membuat spreadsheet resmi di Google Drive guru berisi sheet presensi harian per pertemuan, formula rekap kehadiran otomatis, dan rekap nilai lengkap dengan KKM {currentClass.kkm}.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleExportSheets}
                  disabled={isExportingSheets}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>
                    {isExportingSheets ? 'Mengekspor Spreadsheet...' : 'Buat / Ekspor ke Google Sheets'}
                  </span>
                </button>
              </div>
            </div>

            {/* Google Docs Agenda Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Google Docs & Drive API
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Terbitkan Jurnal KBM ke Google Docs
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Menerbitkan dokumen Berita Acara & Jurnal Mengajar resmi berformat surat dinas SMK Muhammadiyah Bawang lengkap dengan rekap kehadiran siswa dan tanda tangan digital guru.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleExportDoc}
                  disabled={isExportingDoc}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>
                    {isExportingDoc ? 'Menerbitkan Dokumen...' : 'Terbitkan Dokumen ke Google Docs'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Official Gmail API Sending Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 mb-2">
                  <Mail className="w-3.5 h-3.5" />
                  Gmail API
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Kirim Laporan Resmi via Gmail
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Kirimkan notifikasi ringkasan presensi dan evaluasi belajar secara formal ke alamat email Kepala Sekolah, Wakil Kepala Sekolah Bidang Kurikulum, atau Wali Kelas.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendGmail} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Tujuan (Kepala Sekolah / Kurikulum / Orang Tua)
                  </label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    placeholder="kurikulum@smkmuhbawang.sch.id"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subjek Email
                  </label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pesan Pengantar dari Guru
                </label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none font-sans"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSendingGmail || !accessToken}
                  className="inline-flex items-center gap-2 py-2.5 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingGmail ? 'Mengirim Email...' : 'Kirim Laporan Resmi via Gmail'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 2: GOOGLE CALENDAR */}
      {activeSubTab === 'calendar' && (
        <GoogleCalendarPanel
          accessToken={accessToken}
          currentClass={currentClass}
          sessions={sessions}
          teacher={teacher}
          onOpenConfirmModal={onOpenConfirmModal}
          onShowStatus={onShowStatus}
        />
      )}

      {/* SUBTAB 3: GOOGLE TASKS */}
      {activeSubTab === 'tasks' && (
        <GoogleTasksPanel
          accessToken={accessToken}
          currentClass={currentClass}
          teacher={teacher}
          onOpenConfirmModal={onOpenConfirmModal}
          onShowStatus={onShowStatus}
        />
      )}

      {/* SUBTAB 4: CLOUDSQL & FIREBASE */}
      {activeSubTab === 'cloudsql_firebase' && (
        <CloudSqlFirebasePanel
          currentClass={currentClass}
          students={students}
          teacher={teacher}
          onShowStatus={onShowStatus}
        />
      )}
    </div>
  );
};
