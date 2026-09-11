import React from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { ClassRoom } from '../types';

interface DeleteClassModalProps {
  isOpen: boolean;
  classRoom: ClassRoom | null;
  studentsCount: number;
  sessionsCount: number;
  totalClassesCount: number;
  onConfirmDelete: (classId: string) => void;
  onClose: () => void;
}

export const DeleteClassModal: React.FC<DeleteClassModalProps> = ({
  isOpen,
  classRoom,
  studentsCount,
  sessionsCount,
  totalClassesCount,
  onConfirmDelete,
  onClose,
}) => {
  if (!isOpen || !classRoom) return null;

  const isLastClass = totalClassesCount <= 1;

  const handleDelete = () => {
    if (isLastClass) return;
    onConfirmDelete(classRoom.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-rose-600 text-white p-5 relative">
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
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Hapus Kelas</h2>
              <p className="text-xs text-rose-100">
                Konfirmasi penghapusan kelas dan seluruh datanya
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isLastClass ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Tidak Dapat Menghapus Kelas Ini</span>
              </div>
              <p>
                Kelas <b>{classRoom.namaKelas}</b> adalah satu-satunya kelas aktif di sistem Anda.
                Untuk menghapus kelas ini, silakan buat kelas baru terlebih dahulu melalui menu <b>+ Kelas Baru</b>.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-xs text-slate-600">
              <p className="text-slate-800 text-sm">
                Apakah Anda yakin ingin menghapus kelas <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border">{classRoom.namaKelas}</span> ({classRoom.mataPelajaran})?
              </p>

              <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-800">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Dampak Penghapusan:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-800 pl-1">
                  <li><b>{studentsCount} data siswa</b> di kelas ini akan dihapus</li>
                  <li><b>{sessionsCount} sesi absensi pertemuan</b> akan dihapus</li>
                  <li>Seluruh rekapitulasi nilai tugas, UTS, UAS kelas ini akan dihapus</li>
                </ul>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            {!isLastClass && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Kelas Ini</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
