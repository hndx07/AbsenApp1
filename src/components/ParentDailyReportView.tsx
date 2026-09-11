import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  Users,
  User,
  Calendar,
  BookOpen,
  Phone,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
  Smartphone,
  Save,
} from 'lucide-react';
import {
  Student,
  AttendanceSession,
  TeacherProfile,
  ClassRoom,
  AttendanceStatus,
} from '../types';

interface ParentDailyReportViewProps {
  teacher: TeacherProfile;
  classRoom: ClassRoom;
  students: Student[];
  sessions: AttendanceSession[];
}

type ReportMode = 'individual' | 'group_broadcast' | 'contacts_table';
type MessageTemplateType = 'standar' | 'tugas' | 'perhatian' | 'apresiasi';

export const ParentDailyReportView: React.FC<ParentDailyReportViewProps> = ({
  teacher,
  classRoom,
  students = [],
  sessions = [],
}) => {
  // Active session selector (default to the most recent session or fallback)
  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    return (sessions?.length || 0) > 0 ? sessions[(sessions?.length || 0) - 1].id : '';
  });

  // Ensure valid session is selected
  const activeSession = useMemo(() => {
    return (
      (sessions || []).find((s) => s.id === selectedSessionId) ||
      (sessions || [])[(sessions?.length || 0) - 1] ||
      null
    );
  }, [sessions, selectedSessionId]);

  // Active student for individual messaging
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    return (students?.length || 0) > 0 ? students[0].id : '';
  });

  // Report view mode: individual or group broadcast
  const [reportMode, setReportMode] = useState<ReportMode>('individual');

  // Filter for students in individual mode
  const [studentFilter, setStudentFilter] = useState<'all' | 'absent_only' | 'present_only'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Message template type
  const [templateType, setTemplateType] = useState<MessageTemplateType>('standar');

  // Custom inputs for parent communication
  const [customTeacherNote, setCustomTeacherNote] = useState('');
  const [homeworkNote, setHomeworkNote] = useState('');
  const [copied, setCopied] = useState(false);

  // Stored parent phone numbers (in localStorage)
  const [parentPhones, setParentPhones] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('smk_parent_phones_' + classRoom.id);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [inputPhone, setInputPhone] = useState('');
  const [phoneSavedNotification, setPhoneSavedNotification] = useState(false);

  // Group broadcast custom note
  const [groupCustomNote, setGroupCustomNote] = useState(
    'Mohon Bapak/Ibu wali murid berkenan mendampingi ananda mengulang materi dan menyelesaikan tugas mandiri di rumah.'
  );

  // Sync phone input when selected student changes
  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0] || null;
  }, [students, selectedStudentId]);

  useEffect(() => {
    if (activeStudent) {
      setInputPhone(parentPhones[activeStudent.id] || activeStudent.noHpOrangTua || '');
      // If student is absent, default template to 'perhatian'
      const status = activeSession?.records[activeStudent.id]?.status;
      if (status === 'S' || status === 'I' || status === 'A') {
        setTemplateType('perhatian');
      } else {
        setTemplateType('standar');
      }
    }
  }, [selectedStudentId, activeStudent, activeSession, parentPhones]);

  // Save phone number handler
  const handleSavePhone = (studentId: string, phone: string) => {
    const updated = { ...parentPhones, [studentId]: phone.trim() };
    setParentPhones(updated);
    try {
      localStorage.setItem('smk_parent_phones_' + classRoom.id, JSON.stringify(updated));
      setPhoneSavedNotification(true);
      setTimeout(() => setPhoneSavedNotification(false), 2000);
    } catch {
      // ignore
    }
  };

  // Helper to calculate student semester attendance summary
  const getStudentCumulativeStats = (studentId: string) => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alfa = 0;
    (sessions || []).forEach((s) => {
      const st = s.records?.[studentId]?.status;
      if (st === 'H') hadir++;
      else if (st === 'S') sakit++;
      else if (st === 'I') izin++;
      else if (st === 'A') alfa++;
    });
    return { hadir, sakit, izin, alfa, total: (sessions || []).length };
  };

  // Calculate session summary for the whole class
  const classSummary = useMemo(() => {
    if (!activeSession) return { hadir: 0, sakit: 0, izin: 0, alfa: 0, total: 0 };
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alfa = 0;
    const sakitList: { nama: string; note: string }[] = [];
    const izinList: { nama: string; note: string }[] = [];
    const alfaList: { nama: string; note: string }[] = [];

    (students || []).forEach((s) => {
      const rec = activeSession.records?.[s.id];
      const st = rec?.status;
      const note = rec?.catatan ? ` (${rec.catatan})` : '';

      if (st === 'H') hadir++;
      else if (st === 'S') {
        sakit++;
        sakitList.push({ nama: s.nama, note });
      } else if (st === 'I') {
        izin++;
        izinList.push({ nama: s.nama, note });
      } else if (st === 'A') {
        alfa++;
        alfaList.push({ nama: s.nama, note });
      }
    });

    return {
      hadir,
      sakit,
      izin,
      alfa,
      total: (students || []).length,
      sakitList,
      izinList,
      alfaList,
    };
  }, [activeSession, students]);

  // Generate Individual WhatsApp Message Text
  const generateIndividualMessage = () => {
    if (!activeStudent || !activeSession) return '';
    const rec = activeSession.records[activeStudent.id];
    const status = rec?.status || 'H';
    const statusNote = rec?.catatan ? ` (${rec.catatan})` : '';
    const stats = getStudentCumulativeStats(activeStudent.id);

    let statusLabel = '✅ HADIR DI KELAS';
    let statusAdvice = 'Alhamdulillah ananda mengikuti kegiatan belajar mengajar dengan tertib.';
    if (status === 'S') {
      statusLabel = '🟡 SAKIT';
      statusAdvice = 'Semoga ananda lekas diberikan kesembuhan dan dapat kembali beraktivitas di sekolah.';
    } else if (status === 'I') {
      statusLabel = '🔵 IZIN';
      statusAdvice = 'Terima kasih Bapak/Ibu telah memberikan pemberitahuan izin ketidakhadiran ananda.';
    } else if (status === 'A') {
      statusLabel = '🔴 ALFA (TANPA KETERANGAN)';
      statusAdvice =
        'Mohon Bapak/Ibu segera mengonfirmasi alasan ketidakhadiran ananda kepada wali kelas atau guru piket demi keamanan dan ketertiban ananda.';
    }

    // Format Date nicely
    const dateObj = new Date(activeSession.tanggal);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    const formattedDate = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('id-ID', options)
      : activeSession.tanggal;

    let msg = `*Assalamu'alaikum Warahmatullahi Wabarakatuh*\n\n`;
    msg += `Yth. *Bapak/Ibu Orang Tua / Wali Murid*\n`;
    msg += `Dari ananda: *${activeStudent.nama.toUpperCase()}* (NISN: ${activeStudent.nisn})\n\n`;
    msg += `Kami dari *SMK MUHAMMADIYAH BAWANG* menyampaikan laporan perkembangan presensi harian ananda pada:\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📅 *Hari, Tanggal:* ${formattedDate}\n`;
    msg += `🏫 *Kelas:* ${classRoom.namaKelas}\n`;
    msg += `📚 *Mata Pelajaran:* ${classRoom.mataPelajaran}\n`;
    msg += `📝 *Materi/Topik:* ${activeSession.topikMateri}\n`;
    msg += `👨‍🏫 *Guru Pengampu:* ${teacher.namaGuru}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `📌 *STATUS PRESENSI HARI INI:*\n`;
    msg += `👉 *${statusLabel}*${statusNote}\n`;
    msg += `_${statusAdvice}_\n\n`;

    // Cumulative stats
    msg += `📊 *Rekap Kehadiran Semester Ini:* (${stats.total} pertemuan)\n`;
    msg += `• Hadir: ${stats.hadir} kali\n`;
    msg += `• Sakit: ${stats.sakit} kali\n`;
    msg += `• Izin: ${stats.izin} kali\n`;
    msg += `• Alfa: ${stats.alfa} kali\n\n`;

    // Optional teacher notes
    if (customTeacherNote.trim()) {
      msg += `💬 *Catatan / Pesan Guru untuk Orang Tua:*\n`;
      msg += `"${customTeacherNote.trim()}"\n\n`;
    }

    // Homework / Assignment
    if (homeworkNote.trim()) {
      msg += `📖 *Tugas Rumah / PR Hari Ini:*\n`;
      msg += `"${homeworkNote.trim()}"\n`;
      msg += `_Mohon didampingi dan dipastikan ananda menyelesaikannya sebelum pertemuan berikutnya._\n\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `Demikian laporan harian ini kami sampaikan demi sinergi yang baik antara pihak sekolah dan orang tua murid.\n`;
    msg += `Terima kasih atas perhatian dan kerja sama Bapak/Ibu.\n\n`;
    msg += `*Wassalamu'alaikum Warahmatullahi Wabarakatuh*\n\n`;
    msg += `_Layanan Komunikasi Guru & Wali Murid - SMK Muhammadiyah Bawang_\n`;
    msg += `_Kabupaten Batang, Jawa Tengah_`;

    return msg;
  };

  // Generate Group Broadcast Message Text
  const generateGroupBroadcastMessage = () => {
    if (!activeSession) return '';
    const dateObj = new Date(activeSession.tanggal);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    const formattedDate = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('id-ID', options)
      : activeSession.tanggal;

    let msg = `*Assalamu'alaikum Warahmatullahi Wabarakatuh*\n\n`;
    msg += `Yth. *Bapak/Ibu Orang Tua / Wali Murid Kelas ${classRoom.namaKelas}*\n`;
    msg += `*SMK MUHAMMADIYAH BAWANG*\n\n`;
    msg += `Berikut kami sampaikan laporan kegiatan belajar mengajar dan presensi kelas hari ini:\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📅 *Hari, Tanggal:* ${formattedDate}\n`;
    msg += `⏰ *Pertemuan Ke:* ${activeSession.pertemuanKe}\n`;
    msg += `📚 *Mata Pelajaran:* ${classRoom.mataPelajaran}\n`;
    msg += `📝 *Materi / Topik:* ${activeSession.topikMateri}\n`;
    msg += `👨‍🏫 *Guru Pengampu:* ${teacher.namaGuru}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `📊 *RINGKASAN KEHADIRAN KELAS:*\n`;
    msg += `👥 Total Siswa: ${classSummary.total} anak\n`;
    msg += `✅ Hadir: ${classSummary.hadir} anak (${
      classSummary.total > 0
        ? Math.round((classSummary.hadir / classSummary.total) * 100)
        : 0
    }%)\n`;
    msg += `🟡 Sakit: ${classSummary.sakit} anak\n`;
    msg += `🔵 Izin: ${classSummary.izin} anak\n`;
    msg += `🔴 Alfa: ${classSummary.alfa} anak\n\n`;

    if (classSummary.sakit === 0 && classSummary.izin === 0 && classSummary.alfa === 0) {
      msg += `✨ *Alhamdulillah seluruh siswa hadir lengkap (Nihil ketidakhadiran).* Terima kasih atas kedisiplinan putra-putri Bapak/Ibu.\n\n`;
    } else {
      if (classSummary.sakitList.length > 0) {
        msg += `*Siswa Sakit:*\n`;
        classSummary.sakitList.forEach((s, idx) => {
          msg += `${idx + 1}. ${s.nama}${s.note}\n`;
        });
        msg += `_Mari kita doakan ananda lekas sehat wal'afiat._\n\n`;
      }
      if (classSummary.izinList.length > 0) {
        msg += `*Siswa Izin:*\n`;
        classSummary.izinList.forEach((s, idx) => {
          msg += `${idx + 1}. ${s.nama}${s.note}\n`;
        });
        msg += `\n`;
      }
      if (classSummary.alfaList.length > 0) {
        msg += `⚠️ *Siswa Perlu Konfirmasi (Alfa):*\n`;
        classSummary.alfaList.forEach((s, idx) => {
          msg += `${idx + 1}. ${s.nama}${s.note}\n`;
        });
        msg += `_Bagi orang tua ananda di atas, mohon konfirmasi ke pihak sekolah/wali kelas._\n\n`;
      }
    }

    if (homeworkNote.trim()) {
      msg += `📖 *Tugas Rumah / PR Siswa:*\n`;
      msg += `"${homeworkNote.trim()}"\n\n`;
    }

    if (groupCustomNote.trim()) {
      msg += `📌 *Pesan / Pengumuman Guru:*\n`;
      msg += `"${groupCustomNote.trim()}"\n\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `Terima kasih atas dukungan dan kerja sama Bapak/Ibu sekalian dalam mendampingi putra-putri kita.\n\n`;
    msg += `*Wassalamu'alaikum Warahmatullahi Wabarakatuh*\n\n`;
    msg += `Salam hormat,\n`;
    msg += `*${teacher.namaGuru}*\n`;
    msg += `_SMK Muhammadiyah Bawang_`;

    return msg;
  };

  const activeMessageText =
    reportMode === 'group_broadcast'
      ? generateGroupBroadcastMessage()
      : generateIndividualMessage();

  // Copy to clipboard handler
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(activeMessageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = activeMessageText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Send WhatsApp handler
  const handleSendWhatsApp = (customPhone?: string) => {
    const encoded = encodeURIComponent(activeMessageText);
    const target = (customPhone !== undefined ? customPhone : inputPhone).trim();
    let url = `https://api.whatsapp.com/send?text=${encoded}`;
    if (target) {
      let clean = target.replace(/[^0-9]/g, '');
      if (clean.startsWith('0')) {
        clean = '62' + clean.slice(1);
      }
      url = `https://api.whatsapp.com/send?phone=${clean}&text=${encoded}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search
      const matchSearch =
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.includes(searchQuery);
      if (!matchSearch) return false;

      if (!activeSession) return true;
      const st = activeSession.records[s.id]?.status;
      if (studentFilter === 'absent_only') {
        return st === 'S' || st === 'I' || st === 'A';
      }
      if (studentFilter === 'present_only') {
        return st === 'H';
      }
      return true;
    });
  }, [students, searchQuery, studentFilter, activeSession]);

  // Preset Template loader
  const handleApplyTemplate = (type: MessageTemplateType) => {
    setTemplateType(type);
    if (type === 'standar') {
      setCustomTeacherNote('Ananda mengikuti pembelajaran dengan baik dan tertib hari ini.');
      setHomeworkNote('');
    } else if (type === 'tugas') {
      setCustomTeacherNote('Mohon pastikan ananda menyelesaikan tugas mandiri sebelum pertemuan depan.');
      setHomeworkNote('Mengerjakan latihan soal materi yang telah dipelajari hari ini.');
    } else if (type === 'perhatian') {
      setCustomTeacherNote(
        'Mohon Bapak/Ibu segera mengonfirmasi dan mendampingi ananda agar ketertiban belajar tetap terjaga.'
      );
    } else if (type === 'apresiasi') {
      setCustomTeacherNote(
        'Alhamdulillah, ananda hari ini sangat aktif, disiplin, dan berpartisipasi antusias dalam pembelajaran!'
      );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-3xl p-6 shadow-md border border-emerald-600/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-bold backdrop-blur-xs">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
              <span>Komunikasi Presensi Orang Tua / Wali Murid</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Laporan Harian WhatsApp untuk Orang Tua
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              Kirimkan laporan kehadiran, catatan guru, dan ringkasan pembelajaran hari ini langsung ke nomor WhatsApp orang tua murid atau grup paguyuban kelas secara santun, resmi, dan mudah.
            </p>
          </div>

          {/* Quick Session Selector */}
          <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30 shrink-0">
            <label className="block text-[11px] font-bold text-emerald-200 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
              <span>Pilih Sesi Presensi:</span>
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-emerald-900/80 border border-emerald-500/50 text-white text-xs font-bold rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  P{s.pertemuanKe} • {s.tanggal} ({s.topikMateri.slice(0, 24)}...)
                </option>
              ))}
            </select>
            {activeSession && (
              <div className="text-[11px] text-emerald-200/80 mt-1 truncate">
                Materi: <span className="font-semibold text-white">{activeSession.topikMateri}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setReportMode('individual')}
          className={`flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            reportMode === 'individual'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Kirim Japri Per Siswa</span>
        </button>

        <button
          type="button"
          onClick={() => setReportMode('group_broadcast')}
          className={`flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            reportMode === 'group_broadcast'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Siaran Grup Paguyuban Kelas</span>
        </button>

        <button
          type="button"
          onClick={() => setReportMode('contacts_table')}
          className={`flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            reportMode === 'contacts_table'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Buku Kontak & 1-Klik Kirim</span>
        </button>
      </div>

      {/* MODE 1: LAPORAN JAPRI PER SISWA */}
      {reportMode === 'individual' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student Selector & Filters (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Pilih Siswa ({students.length})</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  {filteredStudents.length} ditampilkan
                </span>
              </div>

              {/* Search & Filter chips */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Cari nama siswa atau NISN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setStudentFilter('all')}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      studentFilter === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentFilter('absent_only')}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      studentFilter === 'absent_only'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    Tidak Hadir (S/I/A)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentFilter('present_only')}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      studentFilter === 'present_only'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    Hadir (H)
                  </button>
                </div>
              </div>

              {/* Student List */}
              <div className="max-h-[480px] overflow-y-auto space-y-1.5 pr-1">
                {filteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    Tidak ada siswa yang sesuai filter.
                  </div>
                ) : (
                  filteredStudents.map((s) => {
                    const st = activeSession?.records[s.id]?.status || 'H';
                    const isSelected = s.id === selectedStudentId;
                    const savedPhone = parentPhones[s.id] || s.noHpOrangTua;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400">
                              #{s.no}
                            </span>
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {s.nama}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                            {savedPhone ? (
                              <span className="text-emerald-700 font-medium">WA: {savedPhone}</span>
                            ) : (
                              <span className="text-amber-600">Belum ada no WA</span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {st === 'H' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Hadir
                            </span>
                          )}
                          {st === 'S' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              Sakit
                            </span>
                          )}
                          {st === 'I' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Izin
                            </span>
                          )}
                          {st === 'A' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Alfa
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Center & Right Column: Form, Templates & Live Preview (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {activeStudent ? (
              <>
                {/* Active Student Quick Bar & Phone Number Input */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">
                          {activeStudent.nama}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          NISN: {activeStudent.nisn}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Status hari ini:{' '}
                        <span className="font-bold text-slate-800">
                          {activeSession?.records[activeStudent.id]?.status === 'H' && 'Hadir'}
                          {activeSession?.records[activeStudent.id]?.status === 'S' && 'Sakit'}
                          {activeSession?.records[activeStudent.id]?.status === 'I' && 'Izin'}
                          {activeSession?.records[activeStudent.id]?.status === 'A' && 'Alfa (Tanpa Keterangan)'}
                        </span>
                        {activeSession?.records[activeStudent.id]?.catatan && (
                          <span className="italic text-slate-600">
                            {' '}
                            - &quot;{activeSession.records[activeStudent.id].catatan}&quot;
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Phone Number Input Form */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Phone className="w-4 h-4 text-emerald-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={inputPhone}
                          onChange={(e) => setInputPhone(e.target.value)}
                          placeholder="Nomor WA Ortu (08...)"
                          className="text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-52"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSavePhone(activeStudent.id, inputPhone)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        title="Simpan nomor WA orang tua untuk siswa ini"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{phoneSavedNotification ? 'Tersimpan!' : 'Simpan'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Preset Template Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Pilih Gaya & Template Pesan:</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate('standar')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                          templateType === 'standar'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Standar & Santun</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                          Laporan presensi umum & resmi
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyTemplate('tugas')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                          templateType === 'tugas'
                            ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                          <span>Presensi + Tugas/PR</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                          Ada penugasan mandiri di rumah
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyTemplate('perhatian')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                          templateType === 'perhatian'
                            ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Perhatian & Alfa</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                          Panggilan konfirmasi izin/alfa
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyTemplate('apresiasi')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                          templateType === 'apresiasi'
                            ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Apresiasi Siswa</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                          Pujian keaktifan & ketertiban
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Input Catatan Khusus & PR */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Pesan Khusus Guru untuk Orang Tua (Opsional):
                      </label>
                      <textarea
                        rows={2}
                        value={customTeacherNote}
                        onChange={(e) => setCustomTeacherNote(e.target.value)}
                        placeholder="Contoh: Ananda hari ini sangat aktif bertanya saat materi praktek."
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tugas Rumah / PR untuk Dicek Orang Tua (Opsional):
                      </label>
                      <textarea
                        rows={2}
                        value={homeworkNote}
                        onChange={(e) => setHomeworkNote(e.target.value)}
                        placeholder="Contoh: Mengerjakan latihan soal halaman 25 di buku tugas."
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp Live Preview Box (Realistic Chat Bubble) */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg text-white space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                        WA
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Pratinjau Pesan WhatsApp Orang Tua</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            Siap Kirim
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Tujuan:{' '}
                          {inputPhone ? (
                            <span className="text-emerald-400 font-semibold">{inputPhone}</span>
                          ) : (
                            <span className="text-amber-400">(Nomor belum diisi, akan memilih kontak di WhatsApp)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        copied
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
                    </button>
                  </div>

                  {/* Chat bubble */}
                  <div className="bg-[#0b141a] p-4 rounded-xl border border-slate-800 max-h-[360px] overflow-y-auto">
                    <div className="max-w-xl bg-[#005c4b] text-[#e9edef] text-xs p-3.5 rounded-2xl rounded-tl-xs shadow-md whitespace-pre-wrap font-sans leading-relaxed selection:bg-emerald-300 selection:text-slate-900">
                      {activeMessageText}
                      <div className="text-right text-[10px] text-emerald-200/80 mt-2 flex items-center justify-end gap-1">
                        <span>Hari ini</span>
                        <span className="text-blue-300">✓✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-slate-400">
                      Klik tombol untuk langsung membuka WhatsApp Web atau aplikasi WhatsApp di perangkat Anda.
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={handleCopyMessage}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Salin Pesan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp()}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Kirim ke WhatsApp Orang Tua</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                Pilih siswa terlebih dahulu dari daftar di sebelah kiri.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: SIARAN GRUP PAGUYUBAN KELAS */}
      {reportMode === 'group_broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Settings & Additional Notes (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Pengaturan Siaran Grup WhatsApp Kelas</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Format siaran resmi untuk dikirimkan ke grup WhatsApp Paguyuban Orang Tua / Wali Murid Kelas {classRoom.namaKelas}.
                </p>
              </div>

              {/* Attendance Quick Stats Overview */}
              <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-xs text-emerald-700 font-semibold">Hadir</div>
                  <div className="text-lg font-black text-emerald-800">{classSummary.hadir}</div>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-700 font-semibold">Sakit</div>
                  <div className="text-lg font-black text-blue-800">{classSummary.sakit}</div>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-xs text-amber-700 font-semibold">Izin</div>
                  <div className="text-lg font-black text-amber-800">{classSummary.izin}</div>
                </div>
                <div className="p-2 bg-rose-50 rounded-lg border border-rose-200">
                  <div className="text-xs text-rose-700 font-semibold">Alfa</div>
                  <div className="text-lg font-black text-rose-800">{classSummary.alfa}</div>
                </div>
              </div>

              {/* Group Custom Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pesan Himbauan Guru untuk Seluruh Wali Murid:
                </label>
                <textarea
                  rows={4}
                  value={groupCustomNote}
                  onChange={(e) => setGroupCustomNote(e.target.value)}
                  placeholder="Ketikkan pesan, himbauan tugas, atau jadwal ulangan untuk diketahui para wali murid..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Homework note for group */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Informasi Tugas Mandiri / PR di Rumah:
                </label>
                <input
                  type="text"
                  value={homeworkNote}
                  onChange={(e) => setHomeworkNote(e.target.value)}
                  placeholder="Contoh: Belajar Bab 3 persiapan ujian minggu depan"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Tips for WhatsApp Group */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Tips Komunikasi Wali Murid:</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Mengirimkan rekap ini secara rutin setelah jam pelajaran selesai meningkatkan kepedulian orang tua murid dan menekan angka ketidakhadiran tanpa izin secara signifikan.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Broadcast Preview & Send (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg text-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    📢
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      Pratinjau Pesan Grup Paguyuban Kelas
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Grup WhatsApp Wali Murid Kelas {classRoom.namaKelas}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Format'}</span>
                </button>
              </div>

              {/* Chat bubble */}
              <div className="bg-[#0b141a] p-4 rounded-xl border border-slate-800 max-h-[420px] overflow-y-auto">
                <div className="max-w-2xl bg-[#005c4b] text-[#e9edef] text-xs p-4 rounded-2xl rounded-tl-xs shadow-md whitespace-pre-wrap font-sans leading-relaxed selection:bg-emerald-300 selection:text-slate-900">
                  {activeMessageText}
                  <div className="text-right text-[10px] text-emerald-200/80 mt-2 flex items-center justify-end gap-1">
                    <span>Hari ini</span>
                    <span className="text-blue-300">✓✓</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-400">
                  Klik tombol untuk membuka WhatsApp dan memilih Grup Paguyuban kelas Anda.
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Salin Pesan Siaran</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp()}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Bagikan ke Grup WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: BUKU KONTAK & 1-KLIK KIRIM */}
      {reportMode === 'contacts_table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Buku Kontak Nomor WhatsApp Orang Tua & Akses Cepat</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simpan nomor kontak wali murid sekali saja, selanjutnya Anda dapat langsung klik &apos;Kirim WA&apos; kapan saja tanpa perlu input ulang.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-3">NISN</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-3 text-center">Presensi Hari Ini</th>
                  <th className="py-3 px-3 text-center">Rekap (H/S/I/A)</th>
                  <th className="py-3 px-4">Nomor WhatsApp Orang Tua</th>
                  <th className="py-3 px-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.map((s) => {
                  const rec = activeSession?.records[s.id];
                  const st = rec?.status || 'H';
                  const stats = getStudentCumulativeStats(s.id);
                  const currentSavedPhone = parentPhones[s.id] || s.noHpOrangTua || '';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-medium text-slate-500">
                        {s.no}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {s.nisn}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {s.nama}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {st === 'H' && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Hadir
                          </span>
                        )}
                        {st === 'S' && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Sakit
                          </span>
                        )}
                        {st === 'I' && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Izin
                          </span>
                        )}
                        {st === 'A' && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Alfa
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600">
                        <span className="text-emerald-700 font-bold">{stats.hadir}H</span> /{' '}
                        <span className="text-blue-700 font-bold">{stats.sakit}S</span> /{' '}
                        <span className="text-amber-700 font-bold">{stats.izin}I</span> /{' '}
                        <span className="text-rose-700 font-bold">{stats.alfa}A</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            defaultValue={currentSavedPhone}
                            placeholder="08xxxxxxxxxx"
                            onBlur={(e) => handleSavePhone(s.id, e.target.value)}
                            className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg w-36 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                          />
                          <span className="text-[10px] text-slate-400">auto-save</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentId(s.id);
                              setReportMode('individual');
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Sesuaikan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentId(s.id);
                              handleSendWhatsApp(currentSavedPhone);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Kirim WA</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
