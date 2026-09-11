import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, BookOpen, Clock, Tag } from 'lucide-react';
import { AttendanceSession } from '../types';

interface AttendanceSessionModalProps {
  isOpen: boolean;
  classId: string;
  nextMeetingNumber: number;
  initialSession?: AttendanceSession | null;
  onSaveSession: (sessionData: {
    tanggal: string;
    pertemuanKe: number;
    topikMateri: string;
  }) => void;
  onClose: () => void;
}

export const AttendanceSessionModal: React.FC<AttendanceSessionModalProps> = ({
  isOpen,
  classId,
  nextMeetingNumber,
  initialSession,
  onSaveSession,
  onClose,
}) => {
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split('T')[0]);
  const [pertemuanKe, setPertemuanKe] = useState(nextMeetingNumber);
  const [topikMateri, setTopikMateri] = useState('');

  useEffect(() => {
    if (initialSession) {
      setTanggal(initialSession.tanggal);
      setPertemuanKe(initialSession.pertemuanKe);
      setTopikMateri(initialSession.topikMateri);
    } else {
      setTanggal(new Date().toISOString().split('T')[0]);
      setPertemuanKe(nextMeetingNumber);
      setTopikMateri('');
    }
  }, [initialSession, nextMeetingNumber, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal || pertemuanKe < 1) return;

    onSaveSession({
      tanggal,
      pertemuanKe,
      topikMateri: topikMateri.trim() || `Pertemuan KBM Ke-${pertemuanKe}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden my-8 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span>{initialSession ? 'Edit Sesi Presensi' : 'Tambah Pertemuan KBM'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal KBM
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pertemuan Ke-
              </label>
              <input
                type="number"
                min="1"
                required
                value={pertemuanKe}
                onChange={(e) => setPertemuanKe(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Topik / Materi Pembelajaran Hari Ini
            </label>
            <input
              type="text"
              required
              value={topikMateri}
              onChange={(e) => setTopikMateri(e.target.value)}
              placeholder="Contoh: Pengenalan Komponen Motor Bakar 4 Langkah"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {initialSession ? 'Perbarui Sesi' : 'Buat Sesi KBM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
