import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  ClipboardPaste,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  FileDown,
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react';
import { Student, Gender } from '../types';
import {
  parseSpreadsheetText,
  parseExcelFile,
  downloadStudentTemplate,
  ParsedStudentRow,
} from '../utils/excel';

interface SpreadsheetImportModalProps {
  isOpen: boolean;
  classId: string;
  className: string;
  existingStudentsCount: number;
  onImportStudents: (newStudents: Student[], mode: 'replace' | 'append') => void;
  onClose: () => void;
}

export const SpreadsheetImportModal: React.FC<SpreadsheetImportModalProps> = ({
  isOpen,
  classId,
  className,
  existingStudentsCount,
  onImportStudents,
  onClose,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'paste' | 'upload'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Real-time parse when text changes
  const handleTextChange = (text: string) => {
    setPastedText(text);
    setErrorMessage('');
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }
    try {
      const rows = parseSpreadsheetText(text);
      setParsedRows(rows);
    } catch {
      setErrorMessage('Format spreadsheet tidak terbaca. Pastikan terdapat kolom Nama.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoadingFile(true);
    setErrorMessage('');

    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        setErrorMessage('Tidak ada data siswa yang valid ditemukan pada file tersebut.');
      } else {
        setParsedRows(rows);
      }
    } catch {
      setErrorMessage('Gagal membaca file spreadsheet. Pastikan format .xlsx, .xls, atau .csv valid.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleLoadSample = () => {
    const sample = `1\t0071234021\tAditya Pratama Putra\tL\tSiswa Pindahan dari Bandung
2\t0071234022\tAnisa Rahmawati\tP\tJuara 2 LKS Web Desain
3\t0071234023\tBagus Wicaksono\tL\tAktif ekstrakurikuler robotik
4\t0071234024\tDhea Amanda Putri\tP\tTertib & rajin
5\t0071234025\tEko Prasetyo\tL\tPerlu perhatian remedial
6\t0071234026\tFarah Diba Nurhaliza\tP\tBakat desain grafis
7\t0071234027\tGilang Ramadhan\tL\tKetua Pramuka
8\t0071234028\tHesti Purnamasari\tP\tSekretaris 2`;
    handleTextChange(sample);
  };

  const handleUpdateRow = (index: number, field: keyof ParsedStudentRow, value: string | number | Gender) => {
    setParsedRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const handleDeleteRow = (index: number) => {
    setParsedRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddBlankRow = () => {
    const nextIndex = parsedRows.length + 1;
    setParsedRows((prev) => [
      ...prev,
      {
        no: nextIndex,
        nisn: '00' + (71234000 + nextIndex),
        nama: '',
        gender: 'L',
        catatanUmum: '',
      },
    ]);
  };

  const handleApplyImport = () => {
    if (parsedRows.length === 0) {
      alert('Belum ada data siswa yang siap diimpor.');
      return;
    }

    const students: Student[] = parsedRows.map((r, idx) => ({
      id: 'std-' + Date.now() + '-' + idx,
      classId,
      no: importMode === 'append' ? existingStudentsCount + idx + 1 : idx + 1,
      nisn: r.nisn,
      nama: r.nama,
      gender: r.gender,
      catatanUmum: r.catatanUmum,
    }));

    onImportStudents(students, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-700 to-indigo-800 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Impor Siswa Dari Spreadsheet</h2>
              <p className="text-xs text-teal-100">
                Impor data siswa untuk kelas <span className="font-semibold text-white underline">{className}</span> via Copy-Paste atau File Excel/CSV
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Paste vs Upload */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 pt-3 flex items-center justify-between shrink-0">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setActiveSubTab('paste')}
              className={`inline-flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeSubTab === 'paste'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>Copy-Paste Langsung</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('upload')}
              className={`inline-flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeSubTab === 'upload'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload File (.xlsx / .csv)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              type="button"
              onClick={() => downloadStudentTemplate('xlsx')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md shadow-2xs transition-colors cursor-pointer"
              title="Download format spreadsheet kosong"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Template Excel</span>
            </button>
            <button
              type="button"
              onClick={() => downloadStudentTemplate('csv')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md shadow-2xs transition-colors cursor-pointer"
              title="Download format CSV"
            >
              <FileDown className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 grow">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tab 1: Paste Text */}
          {activeSubTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Tempel (Paste) baris tabel dari Google Sheets / Excel di bawah:
                </label>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline cursor-pointer"
                >
                  Gunakan Contoh Data
                </button>
              </div>

              <textarea
                rows={4}
                value={pastedText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Contoh format per baris:&#10;1 [TAB] 0071234001 [TAB] Ahmad Fauzan Pratama [TAB] L [TAB] Catatan siswa&#10;2 [TAB] 0071234002 [TAB] Aisyah Putri Azzahra [TAB] P [TAB] Catatan..."
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
              />

              <p className="text-[11px] text-slate-500">
                Tips: Cukup blok tabel di Excel/Spreadsheet Anda, tekan <b>Ctrl + C</b>, lalu klik di dalam kotak di atas dan tekan <b>Ctrl + V</b>. Sistem akan otomatis mendeteksi nama, jenis kelamin (L/P), NISN, dan catatan.
              </p>
            </div>
          )}

          {/* Tab 2: Upload File */}
          {activeSubTab === 'upload' && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/60 hover:bg-indigo-50/30 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {fileName ? fileName : 'Pilih atau Tarik File Spreadsheet Kesini'}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Mendukung file Microsoft Excel (.xlsx, .xls) dan CSV (.csv)
                </p>
                {isLoadingFile && (
                  <p className="text-xs font-semibold text-indigo-600 mt-2 animate-pulse">
                    Menganalisis isi berkas...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Preview Table of Parsed Students */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Hasil Deteksi Spreadsheet ({parsedRows.length} Siswa Terbaca)
                </h4>
                {parsedRows.length > 0 && (
                  <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
                    💡 Fitur Edit Manual: Anda dapat mengedit langsung NISN, Nama, dan Gender (klik L/P) pada tabel sebelum disimpan.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {parsedRows.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleAddBlankRow}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
                      title="Tambah baris kosong"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Baris</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPastedText('');
                        setParsedRows([]);
                        setFileName('');
                      }}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Bersihkan
                    </button>
                  </>
                )}
              </div>
            </div>

            {parsedRows.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                Belum ada data terbaca. Silakan paste teks tabel atau unggah berkas spreadsheet.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-64 overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse min-w-[620px]">
                  <thead className="bg-slate-100/90 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2 px-2.5 w-12 text-center">No</th>
                      <th className="py-2 px-2.5 w-28">NISN</th>
                      <th className="py-2 px-2.5">Nama Lengkap Siswa</th>
                      <th className="py-2 px-2.5 w-28 text-center">Gender</th>
                      <th className="py-2 px-2.5 min-w-[140px]">Catatan</th>
                      <th className="py-2 px-2 w-10 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="py-1 px-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={row.no}
                            onChange={(e) => handleUpdateRow(idx, 'no', Number(e.target.value))}
                            className="w-10 text-center text-xs py-0.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            value={row.nisn}
                            onChange={(e) => handleUpdateRow(idx, 'nisn', e.target.value)}
                            className="w-full font-mono text-[11px] px-2 py-1 border border-slate-200 rounded bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            placeholder="NISN..."
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            value={row.nama}
                            onChange={(e) => handleUpdateRow(idx, 'nama', e.target.value)}
                            className="w-full font-semibold text-xs px-2 py-1 border border-slate-200 rounded bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            placeholder="Nama Siswa..."
                          />
                        </td>
                        <td className="py-1 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleUpdateRow(idx, 'gender', row.gender === 'L' ? 'P' : 'L')}
                            title="Klik untuk beralih Jenis Kelamin L / P"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                              row.gender === 'L'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'
                            }`}
                          >
                            <span className="font-extrabold">{row.gender === 'L' ? '👦 Laki-laki' : '👧 Perempuan'}</span>
                          </button>
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            value={row.catatanUmum}
                            onChange={(e) => handleUpdateRow(idx, 'catatanUmum', e.target.value)}
                            className="w-full text-xs px-2 py-1 border border-slate-200 rounded bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            placeholder="Catatan khusus..."
                          />
                        </td>
                        <td className="py-1 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Import Mode Options */}
          {parsedRows.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-800 block">
                Opsi Penyimpanan ke Kelas:
              </span>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Ganti seluruh daftar siswa saat ini ({existingStudentsCount} siswa ada)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Tambahkan ke daftar siswa yang sudah ada</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 ? `${parsedRows.length} siswa siap dimasukkan` : 'Pilih data untuk mulai impor'}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={parsedRows.length === 0}
              onClick={handleApplyImport}
              className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                parsedRows.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Terapkan Impor Siswa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
