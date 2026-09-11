import React, { useState } from 'react';
import { Share2, Send, Copy, Check, X, MessageSquare, AlertCircle } from 'lucide-react';
import { Student, AttendanceSession } from '../types';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  className: string;
  mataPelajaran: string;
  teacherName: string;
  schoolName: string;
  session: AttendanceSession | null;
  students: Student[];
  onClose: () => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  className,
  mataPelajaran,
  teacherName,
  schoolName,
  session,
  students,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [targetPhone, setTargetPhone] = useState('');

  if (!isOpen || !session) return null;

  // Calculate stats
  const total = students.length;
  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let alfa = 0;
  let belum = 0;

  const sakitList: { nama: string; catatan: string }[] = [];
  const izinList: { nama: string; catatan: string }[] = [];
  const alfaList: { nama: string; catatan: string }[] = [];

  students.forEach((s) => {
    const rec = session.records[s.id];
    const st = rec?.status;
    const cat = rec?.catatan ? ` (${rec.catatan})` : '';

    if (st === 'H') hadir++;
    else if (st === 'S') {
      sakit++;
      sakitList.push({ nama: s.nama, catatan: cat });
    } else if (st === 'I') {
      izin++;
      izinList.push({ nama: s.nama, catatan: cat });
    } else if (st === 'A') {
      alfa++;
      alfaList.push({ nama: s.nama, catatan: cat });
    } else {
      belum++;
    }
  });

  const percent = total > 0 ? Math.round((hadir / total) * 100) : 0;

  // Format the WhatsApp message text with markdown
  const generateMessageText = () => {
    let msg = `*📢 REKAP PRESENSI HARIAN SISWA*\n`;
    msg += `🏫 *${schoolName.toUpperCase()}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📖 *Kelas:* ${className}\n`;
    msg += `📚 *Mata Pelajaran:* ${mataPelajaran}\n`;
    msg += `📅 *Hari / Tanggal:* ${session.tanggal}\n`;
    msg += `⏰ *Pertemuan Ke:* ${session.pertemuanKe}\n`;
    msg += `📝 *Topik/Materi:* ${session.topikMateri}\n`;
    msg += `👨‍🏫 *Guru Pengampu:* ${teacherName}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📊 *STATISTIK KEHADIRAN:*\n`;
    msg += `👥 Total Siswa: ${total} orang\n`;
    msg += `✅ Hadir (H): ${hadir} siswa (${percent}%)\n`;
    msg += `🟡 Sakit (S): ${sakit} siswa\n`;
    msg += `🔵 Izin (I): ${izin} siswa\n`;
    msg += `🔴 Alfa (A): ${alfa} siswa\n`;
    if (belum > 0) {
      msg += `⚪ Belum diabsen: ${belum} siswa\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📋 *DETAIL KETERANGAN SISWA:*\n`;

    if (sakit === 0 && izin === 0 && alfa === 0) {
      msg += `✨ *Alhamdulillah seluruh siswa hadir (Nihil).* ✨\n`;
    } else {
      if (sakitList.length > 0) {
        msg += `\n*Sakit (${sakitList.length}):*\n`;
        sakitList.forEach((it, idx) => {
          msg += `${idx + 1}. ${it.nama}${it.catatan}\n`;
        });
      }
      if (izinList.length > 0) {
        msg += `\n*Izin (${izinList.length}):*\n`;
        izinList.forEach((it, idx) => {
          msg += `${idx + 1}. ${it.nama}${it.catatan}\n`;
        });
      }
      if (alfaList.length > 0) {
        msg += `\n*Alfa / Tanpa Keterangan (${alfaList.length}):*\n`;
        alfaList.forEach((it, idx) => {
          msg += `${idx + 1}. ${it.nama}${it.catatan}\n`;
        });
      }
    }

    if (customNote.trim()) {
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `📌 *Catatan Guru / Pesan untuk Wali Kelas:*\n${customNote.trim()}\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_Laporan otomatis dibuat melalui SIM Absensi ${schoolName}_`;

    return msg;
  };

  const messageText = generateMessageText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = messageText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    let url = `https://api.whatsapp.com/send?text=${encoded}`;
    
    // If target phone number is provided (e.g. 0812... or 62812...)
    if (targetPhone.trim()) {
      let cleanPhone = targetPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
      }
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header with WhatsApp brand styling */}
        <div className="bg-emerald-600 text-white p-5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Kirim Rekap Absen ke WhatsApp</h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Bagikan rekap kehadiran Pertemuan Ke-{session.pertemuanKe} ke Grup Guru, Wali Kelas, atau Orang Tua
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Quick Info Chip */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
            <div>
              <span className="font-bold">{className}</span> • {session.tanggal} (P{session.pertemuanKe})
            </div>
            <div className="font-bold">
              Hadir: <span className="text-emerald-700">{hadir}/{total} ({percent}%)</span>
              {alfa > 0 && <span className="text-rose-700 ml-2 font-extrabold">⚠️ Alfa: {alfa}</span>}
            </div>
          </div>

          {/* Optional Additional Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Tambahan untuk Wali Kelas / Orang Tua (Opsional)
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Contoh: Mohon wali kelas mengingatkan siswa yang alfa untuk membawa surat izin."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Optional Direct Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor WhatsApp Tujuan (Opsional, kosongkan jika ingin memilih grup di WhatsApp)
            </label>
            <input
              type="text"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              placeholder="Contoh: 081234567890 (Grup / Pribadi)"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Live Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Pratinjau Pesan WhatsApp
              </span>
              <span className="text-[11px] text-slate-400">Format teks siap kirim</span>
            </div>
            <div className="bg-slate-900 text-slate-100 font-mono text-[11px] p-3.5 rounded-xl max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-800 selection:bg-emerald-500 selection:text-white">
              {messageText}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Format Teks'}</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Buka WhatsApp & Kirim</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
