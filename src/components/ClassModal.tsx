import React, { useState } from 'react';
import { Layers, X, BookOpen, Target, FileText } from 'lucide-react';
import { ClassRoom } from '../types';

interface ClassModalProps {
  isOpen: boolean;
  defaultMapel: string;
  onSaveClass: (newClass: ClassRoom) => void;
  onClose: () => void;
}

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  defaultMapel,
  onSaveClass,
  onClose,
}) => {
  const [namaKelas, setNamaKelas] = useState('');
  const [mataPelajaran, setMataPelajaran] = useState(defaultMapel);
  const [kkm, setKkm] = useState(75);
  const [jurusan, setJurusan] = useState('');
  const [keterangan, setKeterangan] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKelas.trim()) {
      alert('Nama kelas harus diisi.');
      return;
    }

    const created: ClassRoom = {
      id: 'class-' + Date.now(),
      namaKelas: namaKelas.trim(),
      mataPelajaran: mataPelajaran.trim() || defaultMapel || 'Mata Pelajaran',
      kkm: Number(kkm) || 75,
      jurusan: jurusan.trim() || undefined,
      keterangan: keterangan.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSaveClass(created);
    setNamaKelas('');
    setJurusan('');
    setKeterangan('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Buat Kelas Baru</h2>
              <p className="text-xs text-indigo-200">
                Tambahkan kelas baru untuk absensi dan rekap penilaian Anda
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Kelas <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={namaKelas}
              onChange={(e) => setNamaKelas(e.target.value)}
              placeholder="Contoh: X RPL 2, XI MIPA 1, XII TKJ"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Mata Pelajaran
            </label>
            <input
              type="text"
              value={mataPelajaran}
              onChange={(e) => setMataPelajaran(e.target.value)}
              placeholder="Contoh: Pemrograman Web / Bahasa Indonesia"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                KKM (Kriteria Ketuntasan)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={kkm}
                onChange={(e) => setKkm(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kompetensi Keahlian / Jurusan
              </label>
              <input
                type="text"
                value={jurusan}
                onChange={(e) => setJurusan(e.target.value)}
                placeholder="Contoh: PPLG / TKJ / IPA"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Keterangan / Jadwal Ruang (Opsional)
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Lab Komputer 3, Setiap Selasa & Kamis"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
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
              <Layers className="w-4 h-4" />
              Simpan Kelas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
