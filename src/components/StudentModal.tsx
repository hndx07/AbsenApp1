import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, X } from 'lucide-react';
import { Student, Gender } from '../types';

interface StudentModalProps {
  isOpen: boolean;
  editingStudent: Student | null;
  nextNo: number;
  classId: string;
  onSave: (student: Student) => void;
  onClose: () => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  editingStudent,
  nextNo,
  classId,
  onSave,
  onClose,
}) => {
  const [no, setNo] = useState<number>(nextNo);
  const [nisn, setNisn] = useState('');
  const [nama, setNama] = useState('');
  const [gender, setGender] = useState<Gender>('L');
  const [catatanUmum, setCatatanUmum] = useState('');

  useEffect(() => {
    if (editingStudent) {
      setNo(editingStudent.no);
      setNisn(editingStudent.nisn);
      setNama(editingStudent.nama);
      setGender(editingStudent.gender);
      setCatatanUmum(editingStudent.catatanUmum || '');
    } else {
      setNo(nextNo);
      setNisn('');
      setNama('');
      setGender('L');
      setCatatanUmum('');
    }
  }, [editingStudent, nextNo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama siswa harus diisi.');
      return;
    }

    const studentToSave: Student = {
      id: editingStudent ? editingStudent.id : 'std-' + Date.now(),
      classId,
      no: Number(no) || nextNo,
      nisn: nisn.trim() || '00' + (71234000 + nextNo),
      nama: nama.trim(),
      gender,
      catatanUmum: catatanUmum.trim(),
    };

    onSave(studentToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
              {editingStudent ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {editingStudent ? 'Edit Data Siswa' : 'Input Manual Siswa Baru'}
              </h2>
              <p className="text-xs text-slate-300">
                Isi identitas siswa, gender, dan catatan per siswa
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. Urut
              </label>
              <input
                type="number"
                min="1"
                required
                value={no}
                onChange={(e) => setNo(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NISN / NIS
              </label>
              <input
                type="text"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                placeholder="Contoh: 0071234001"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Siswa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Achmad Fauzan Pratama"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Gender Selector with Visual Icons and Badges */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilihan Gender (Jenis Kelamin)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('L')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  gender === 'L'
                    ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  ♂
                </span>
                <span>Laki-laki (L)</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('P')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  gender === 'P'
                    ? 'border-pink-500 bg-pink-50 text-pink-800 ring-2 ring-pink-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-7 h-7 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">
                  ♀
                </span>
                <span>Perempuan (P)</span>
              </button>
            </div>
          </div>

          {/* Catatan per siswa */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Siswa
            </label>
            <textarea
              rows={2}
              value={catatanUmum}
              onChange={(e) => setCatatanUmum(e.target.value)}
              placeholder="Contoh: Pengurus OSIS, Butuh pendampingan khusus, dll."
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {editingStudent ? 'Perbarui Siswa' : 'Simpan Siswa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
