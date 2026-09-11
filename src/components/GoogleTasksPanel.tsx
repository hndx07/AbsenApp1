import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { ClassRoom, TeacherProfile } from '../types';
import {
  listTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  GoogleTaskItem,
} from '../utils/googleWorkspace';

interface GoogleTasksPanelProps {
  accessToken: string | null;
  currentClass: ClassRoom;
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

export const GoogleTasksPanel: React.FC<GoogleTasksPanelProps> = ({
  accessToken,
  currentClass,
  onOpenConfirmModal,
  onShowStatus,
}) => {
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchTasks = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await listTasks(accessToken);
      setTasks(data);
    } catch (err: any) {
      console.error('Error fetching Google Tasks:', err);
      onShowStatus({
        type: 'error',
        message: err.message || 'Gagal memuat tugas dari Google Tasks.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchTasks();
    }
  }, [accessToken]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const dueIso = dueDate ? `${dueDate}T23:59:59.000Z` : undefined;
      const created = await createTask(accessToken, {
        title: title.trim(),
        notes: notes.trim() || `Tugas kelas ${currentClass.namaKelas}`,
        due: dueIso,
      });

      onShowStatus({
        type: 'success',
        message: `Tugas "${created.title}" berhasil ditambahkan ke Google Tasks!`,
      });

      setTitle('');
      setNotes('');
      setDueDate('');
      fetchTasks();
    } catch (err: any) {
      console.error('Error creating Google Task:', err);
      onShowStatus({
        type: 'error',
        message: err.message || 'Gagal menambahkan tugas ke Google Tasks.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (task: GoogleTaskItem) => {
    if (!accessToken) return;
    const nextCompleted = task.status !== 'completed';

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: nextCompleted ? 'completed' : 'needsAction' } : t
      )
    );

    try {
      await updateTaskStatus(accessToken, task.id, nextCompleted);
      onShowStatus({
        type: 'info',
        message: nextCompleted
          ? `Tugas "${task.title}" ditandai selesai.`
          : `Tugas "${task.title}" ditandai belum selesai.`,
      });
    } catch (err: any) {
      console.error('Error updating task status:', err);
      // Revert on error
      fetchTasks();
      onShowStatus({
        type: 'error',
        message: err.message || 'Gagal mengubah status tugas di Google Tasks.',
      });
    }
  };

  const handleDeleteTask = (task: GoogleTaskItem) => {
    if (!accessToken) return;

    onOpenConfirmModal({
      title: 'Hapus Tugas Google Tasks',
      description: `Apakah Anda yakin ingin menghapus tugas "${task.title}" dari daftar Google Tasks Anda?`,
      actionLabel: 'Hapus Tugas',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteTask(accessToken, task.id);
          onShowStatus({
            type: 'success',
            message: `Tugas "${task.title}" berhasil dihapus.`,
          });
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
        } catch (err: any) {
          onShowStatus({
            type: 'error',
            message: err.message || 'Gagal menghapus tugas dari Google Tasks.',
          });
        }
      },
    });
  };

  const applyPreset = (presetTitle: string, presetNotes: string) => {
    setTitle(presetTitle);
    setNotes(presetNotes);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setDueDate(tomorrow);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 mb-2">
            <CheckSquare className="w-3.5 h-3.5" />
            Google Tasks API
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Catatan Tugas & Tindak Lanjut Guru
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Kelola daftar pekerjaan guru: koreksi tugas siswa, tindak lanjut absensi alfa, dan persiapan penilaian semester di Google Tasks resmi.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchTasks}
          disabled={isLoading || !accessToken}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang Tugas</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Buat Tugas */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Plus className="w-4 h-4 text-teal-600" />
            <span>Tambah Tugas Guru Baru</span>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Template Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    `Koreksi Tugas 1 Kelas ${currentClass.namaKelas}`,
                    `Memeriksa lembar kerja peserta didik mata pelajaran ${currentClass.mataPelajaran}.`
                  )
                }
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
              >
                Koreksi Tugas
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    `Tindak Lanjut Absensi Alfa Kelas ${currentClass.namaKelas}`,
                    `Koordinasi dengan Guru BK / Wali Kelas untuk panggilan orang tua atau home visit.`
                  )
                }
                className="text-[11px] px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium rounded-lg transition-colors cursor-pointer"
              >
                Tindak Lanjut Alfa
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    `Input Nilai UTS Kelas ${currentClass.namaKelas}`,
                    `Entri nilai ujian tengah semester ke spreadsheet resmi madrasah/sekolah.`
                  )
                }
                className="text-[11px] px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-medium rounded-lg transition-colors cursor-pointer"
              >
                Input Nilai UTS
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateTask} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Tugas
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                placeholder="Misal: Buat Soal Ulangan Harian"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tenggat Waktu (Opsional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / Detail Pekerjaan
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                placeholder="Petunjuk tugas, daftar siswa remedial..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !accessToken}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan ke Google Tasks'}</span>
            </button>
          </form>
        </div>

        {/* List of Tasks */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-teal-600" />
              <span>Daftar Pekerjaan di Google Tasks</span>
            </h4>
            <span className="text-xs text-slate-500">{tasks.length} Pekerjaan</span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
              <p className="text-xs">Memuat tugas dari Google Tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-slate-600">Belum ada tugas di Google Tasks</p>
              <p className="text-[11px] text-slate-400 mt-1">Tambahkan rencana kerja atau tugas koreksi guru</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {tasks.map((task) => {
                const isDone = task.status === 'completed';
                const formattedDue = task.due
                  ? new Date(task.due).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : null;

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isDone
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task)}
                        className="mt-0.5 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-teal-600 fill-teal-100" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                      <div className="space-y-0.5 min-w-0">
                        <h5
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {task.title}
                        </h5>
                        {task.notes && (
                          <p className="text-xs text-slate-500 line-clamp-2">{task.notes}</p>
                        )}
                        {formattedDue && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-700 font-medium pt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>Tenggat: {formattedDue}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Hapus Tugas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
