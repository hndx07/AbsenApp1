import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { ClassRoom, AttendanceSession, TeacherProfile } from '../types';
import {
  listCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  CalendarEventItem,
} from '../utils/googleWorkspace';

interface GoogleCalendarPanelProps {
  accessToken: string | null;
  currentClass: ClassRoom;
  sessions: AttendanceSession[];
  teacher: TeacherProfile;
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

export const GoogleCalendarPanel: React.FC<GoogleCalendarPanelProps> = ({
  accessToken,
  currentClass,
  teacher,
  onOpenConfirmModal,
  onShowStatus,
}) => {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [summary, setSummary] = useState(
    `KBM: ${currentClass.mataPelajaran} - Kelas ${currentClass.namaKelas}`
  );
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTimeStr, setStartTimeStr] = useState('07:30');
  const [endTimeStr, setEndTimeStr] = useState('09:00');
  const [locationStr, setLocationStr] = useState('SMK Muhammadiyah Bawang, Batang');
  const [descStr, setDescStr] = useState(
    `Pertemuan pembelajaran tatap muka / KBM ${currentClass.mataPelajaran} bersama guru ${teacher.namaGuru}.`
  );

  const fetchEvents = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await listCalendarEvents(accessToken);
      setEvents(data);
    } catch (err: any) {
      console.error('Error fetching calendar events:', err);
      onShowStatus({
        type: 'error',
        message: err.message || 'Gagal memuat agenda Google Calendar.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchEvents();
    }
  }, [accessToken]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!summary.trim() || !dateStr) return;

    setIsSubmitting(true);
    try {
      const startIso = `${dateStr}T${startTimeStr}:00+07:00`;
      const endIso = `${dateStr}T${endTimeStr}:00+07:00`;

      const newEvent = await createCalendarEvent(accessToken, {
        summary: summary.trim(),
        description: descStr.trim(),
        location: locationStr.trim(),
        startTime: startIso,
        endTime: endIso,
      });

      onShowStatus({
        type: 'success',
        message: `Acara "${newEvent.summary}" berhasil ditambahkan ke Google Calendar!`,
        linkUrl: newEvent.htmlLink,
        linkLabel: 'Buka di Google Calendar',
      });

      fetchEvents();
    } catch (err: any) {
      console.error('Error creating calendar event:', err);
      onShowStatus({
        type: 'error',
        message: err.message || 'Gagal menambahkan acara ke Google Calendar.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = (event: CalendarEventItem) => {
    if (!accessToken) return;

    onOpenConfirmModal({
      title: 'Hapus Acara Kalender',
      description: `Apakah Anda yakin ingin menghapus agenda "${event.summary}" dari Google Calendar Anda? Tindakan ini tidak dapat dibatalkan.`,
      actionLabel: 'Hapus Acara',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteCalendarEvent(accessToken, event.id);
          onShowStatus({
            type: 'success',
            message: `Acara "${event.summary}" telah dihapus dari Google Calendar.`,
          });
          setEvents((prev) => prev.filter((e) => e.id !== event.id));
        } catch (err: any) {
          onShowStatus({
            type: 'error',
            message: err.message || 'Gagal menghapus acara kalender.',
          });
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <CalendarIcon className="w-3.5 h-3.5" />
            Google Calendar API
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Jadwal Mengajar & Acara Akademik
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Sinkronisasi jadwal KBM kelas {currentClass.namaKelas}, ujian semester, dan agenda evaluasi siswa langsung ke Google Calendar Anda.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchEvents}
          disabled={isLoading || !accessToken}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang Acara</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Tambah Acara */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Buat Agenda / Jadwal Baru</span>
          </div>

          <form onSubmit={handleCreateEvent} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Agenda / KBM
              </label>
              <input
                type="text"
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Contoh: KBM Matematika Kelas X TKR"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Acara
              </label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mulai (WIB)
                </label>
                <input
                  type="time"
                  required
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selesai (WIB)
                </label>
                <input
                  type="time"
                  required
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi
              </label>
              <input
                type="text"
                value={locationStr}
                onChange={(e) => setLocationStr(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="SMK Muhammadiyah Bawang"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi / Catatan Tambahan
              </label>
              <textarea
                rows={3}
                value={descStr}
                onChange={(e) => setDescStr(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                placeholder="Topik materi, perlengkapan belajar..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !accessToken}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan ke Google Calendar'}</span>
            </button>
          </form>
        </div>

        {/* Daftar Acara Kalender */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              <span>Agenda Mendatang di Google Calendar</span>
            </h4>
            <span className="text-xs text-slate-500">{events.length} Acara Ditemukan</span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-xs">Mengambil agenda dari Google Calendar...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-slate-600">Belum ada agenda Google Calendar yang tercatat</p>
              <p className="text-[11px] text-slate-400 mt-1">Buat agenda KBM atau ujian melalui formulir di samping</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {events.map((evt) => {
                const startTime = evt.start.dateTime || evt.start.date;
                const formattedDate = startTime
                  ? new Date(startTime).toLocaleString('id-ID', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-';

                return (
                  <div
                    key={evt.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {evt.summary}
                      </h5>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {formattedDate}
                        </span>
                        {evt.location && (
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {evt.location}
                          </span>
                        )}
                      </div>
                      {evt.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                          {evt.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {evt.htmlLink && (
                        <a
                          href={evt.htmlLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Buka di Google Calendar"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(evt)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Acara"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
