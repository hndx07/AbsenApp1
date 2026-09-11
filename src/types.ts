export type Gender = 'L' | 'P';
export type AttendanceStatus = 'H' | 'S' | 'I' | 'A';

export interface TeacherProfile {
  id: string;
  namaGuru: string;
  nip: string;
  namaSekolah: string;
  mataPelajaranUtama: string;
  tahunAjaran: string;
  semester: 'Ganjil' | 'Genap';
  isLoggedIn: boolean;
  email?: string;
  avatarUrl?: string;
  googleId?: string;
  activeClassId?: string;
}

export interface ClassRoom {
  id: string;
  namaKelas: string;
  mataPelajaran: string;
  kkm: number;
  jurusan?: string;
  keterangan?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  classId: string;
  no: number;
  nisn: string;
  nama: string;
  gender: Gender;
  catatanUmum: string;
  noHpOrangTua?: string;
}

export interface AttendanceRecordItem {
  status: AttendanceStatus;
  catatan: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  tanggal: string; // YYYY-MM-DD
  pertemuanKe: number;
  topikMateri: string;
  records: Record<string, AttendanceRecordItem>; // studentId -> { status, catatan }
}

export type StudentGrade = {
  id: string;
  studentId: string;
  classId: string;
  // 10 Kolom Penilaian: 8 Asesmen Formatif + 2 Asesmen Sumatif
  formatif1?: number | null;
  formatif2?: number | null;
  formatif3?: number | null;
  formatif4?: number | null;
  formatif5?: number | null;
  formatif6?: number | null;
  formatif7?: number | null;
  formatif8?: number | null;
  formatif9?: number | null;
  formatif10?: number | null;
  sumatifTengah?: number | null; // Asesmen Sumatif Tengah Semester (STS / Pengganti UTS)
  sumatifAkhir?: number | null;  // Asesmen Sumatif Akhir Semester (SAS / Pengganti UAS)
  // Backward compatibility aliases
  tugas1?: number | null;
  tugas2?: number | null;
  tugas3?: number | null;
  uts?: number | null;
  uas?: number | null;
  praktik?: number | null;
  catatan: string;
};

export type GradeRecord = StudentGrade;


export interface CalculatedGrade {
  studentId: string;
  rataFormatif: number;
  rataTugas?: number; // compat alias
  nilaiAkhir: number;
  predikat: 'A' | 'B' | 'C' | 'D';
  status: 'Tuntas' | 'Belum Tuntas';
  sumatifTengah?: number | null;
  sumatifAkhir?: number | null;
}

export interface TeacherWorkspaceData {
  teacherUid: string;
  email: string;
  teacher: TeacherProfile;
  classes: ClassRoom[];
  activeClassId: string;
  students: Student[];
  sessions: AttendanceSession[];
  grades: StudentGrade[];
  updatedAt: string;
}

export type ActiveTab = 'absensi' | 'nilai' | 'statistik' | 'impor' | 'laporan-ortu' | 'workspace' | 'peta';
