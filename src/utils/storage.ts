import {
  TeacherProfile,
  ClassRoom,
  Student,
  AttendanceSession,
  StudentGrade,
} from '../types';

const STORAGE_KEYS = {
  TEACHER: 'absensi_teacher_profile',
  CLASSES: 'absensi_classes',
  ACTIVE_CLASS: 'absensi_active_class_id',
  STUDENTS: 'absensi_students',
  ATTENDANCE: 'absensi_sessions',
  GRADES: 'absensi_grades',
};

// Initial Empty Teacher Profile (Clean state for real authentication)
const DEFAULT_TEACHER: TeacherProfile = {
  id: 'teacher-1',
  namaGuru: '',
  nip: '',
  namaSekolah: 'SMK Muhammadiyah Bawang',
  mataPelajaranUtama: '',
  tahunAjaran: '2025/2026',
  semester: 'Ganjil',
  isLoggedIn: false,
  email: '',
  avatarUrl: '',
};

const DEFAULT_CLASSES: ClassRoom[] = [
  {
    id: 'class-1',
    namaKelas: 'X PPLG 1 (RPL)',
    mataPelajaran: 'Dasar-Dasar Pemrograman & Informatika',
    kkm: 75,
    jurusan: 'Pengembangan Perangkat Lunak & Gim',
    keterangan: 'Ruang Lab Komputer 2 (Senin & Rabu)',
    createdAt: '2025-07-15',
  },
  {
    id: 'class-2',
    namaKelas: 'XI RPL 2',
    mataPelajaran: 'Pemrograman Web Client & Server',
    kkm: 78,
    jurusan: 'Rekayasa Perangkat Lunak',
    keterangan: 'Ruang Lab Multimedia 1 (Selasa & Kamis)',
    createdAt: '2025-07-15',
  },
  {
    id: 'class-3',
    namaKelas: 'XII RPL 1',
    mataPelajaran: 'Produk Kreatif & Aplikasi Mobile',
    kkm: 80,
    jurusan: 'Rekayasa Perangkat Lunak',
    keterangan: 'Lab IoT & Mobile (Jumat)',
    createdAt: '2025-07-15',
  },
];

const DEFAULT_STUDENTS_CLASS_1: Student[] = [
  { id: 'std-101', classId: 'class-1', no: 1, nisn: '0071234001', nama: 'Achmad Fauzan Pratama', gender: 'L', catatanUmum: 'Ketua Kelas, aktif' },
  { id: 'std-102', classId: 'class-1', no: 2, nisn: '0071234002', nama: 'Aisyah Putri Azzahra', gender: 'P', catatanUmum: 'Sekretaris' },
  { id: 'std-103', classId: 'class-1', no: 3, nisn: '0071234003', nama: 'Bayu Aditya Nugraha', gender: 'L', catatanUmum: 'Anggota OSIS' },
  { id: 'std-104', classId: 'class-1', no: 4, nisn: '0071234004', nama: 'Cantika Dewi Maharani', gender: 'P', catatanUmum: 'Bendahara kelas' },
  { id: 'std-105', classId: 'class-1', no: 5, nisn: '0071234005', nama: 'Dimas Bagus Saputra', gender: 'L', catatanUmum: 'Perlu bimbingan algoritma' },
  { id: 'std-106', classId: 'class-1', no: 6, nisn: '0071234006', nama: 'Fadilla Nur Hasanah', gender: 'P', catatanUmum: 'Sangat rajin' },
  { id: 'std-107', classId: 'class-1', no: 7, nisn: '0071234007', nama: 'Fajar Rizky Ramadhan', gender: 'L', catatanUmum: 'Bakat desain UI' },
  { id: 'std-108', classId: 'class-1', no: 8, nisn: '0071234008', nama: 'Gita Anindya Saraswati', gender: 'P', catatanUmum: 'Wakil ketua kelas' },
  { id: 'std-109', classId: 'class-1', no: 9, nisn: '0071234009', nama: 'Hafiz Danendra', gender: 'L', catatanUmum: 'Atlet futsal sekolah' },
  { id: 'std-110', classId: 'class-1', no: 10, nisn: '0071234010', nama: 'Indah Kusuma Wardani', gender: 'P', catatanUmum: 'Tertib & teliti' },
  { id: 'std-111', classId: 'class-1', no: 11, nisn: '0071234011', nama: 'Kevin Jonathan Siregar', gender: 'L', catatanUmum: 'Kompetensi logika bagus' },
  { id: 'std-112', classId: 'class-1', no: 12, nisn: '0071234012', nama: 'Larasati Wahyu Ningrum', gender: 'P', catatanUmum: 'Aktif bertanya' },
  { id: 'std-113', classId: 'class-1', no: 13, nisn: '0071234013', nama: 'Muhammad Ilham Arifin', gender: 'L', catatanUmum: 'Sering bantu teman' },
  { id: 'std-114', classId: 'class-1', no: 14, nisn: '0071234014', nama: 'Nadia Salsabila Putri', gender: 'P', catatanUmum: 'Kreatif' },
  { id: 'std-115', classId: 'class-1', no: 15, nisn: '0071234015', nama: 'Rafi Alamsyah Putra', gender: 'L', catatanUmum: 'Perlu pengawasan kehadiran' },
  { id: 'std-116', classId: 'class-1', no: 16, nisn: '0071234016', nama: 'Siti Rahmawati', gender: 'P', catatanUmum: 'Tuntas semua tugas' },
];

const DEFAULT_SESSIONS_CLASS_1: AttendanceSession[] = [
  {
    id: 'ses-1',
    classId: 'class-1',
    tanggal: '2025-08-04',
    pertemuanKe: 1,
    topikMateri: 'Pengenalan Logika & Algoritma Pemrograman Dasar',
    records: {
      'std-101': { status: 'H', catatan: 'Hadir tepat waktu' },
      'std-102': { status: 'H', catatan: 'Hadir' },
      'std-103': { status: 'H', catatan: 'Hadir' },
      'std-104': { status: 'H', catatan: 'Hadir' },
      'std-105': { status: 'S', catatan: 'Demam, ada surat dokter' },
      'std-106': { status: 'H', catatan: 'Hadir' },
      'std-107': { status: 'H', catatan: 'Hadir' },
      'std-108': { status: 'H', catatan: 'Hadir' },
      'std-109': { status: 'I', catatan: 'Izin seleksi popda' },
      'std-110': { status: 'H', catatan: 'Hadir' },
      'std-111': { status: 'H', catatan: 'Hadir' },
      'std-112': { status: 'H', catatan: 'Hadir' },
      'std-113': { status: 'H', catatan: 'Hadir' },
      'std-114': { status: 'H', catatan: 'Hadir' },
      'std-115': { status: 'A', catatan: 'Tanpa kabar / konfirmasi' },
      'std-116': { status: 'H', catatan: 'Hadir' },
    },
  },
  {
    id: 'ses-2',
    classId: 'class-1',
    tanggal: '2025-08-11',
    pertemuanKe: 2,
    topikMateri: 'Variabel, Tipe Data, dan Struktur Percabangan (If-Else)',
    records: {
      'std-101': { status: 'H', catatan: 'Aktif saat sesi tanya jawab' },
      'std-102': { status: 'H', catatan: 'Hadir' },
      'std-103': { status: 'I', catatan: 'Izin urusan keluarga' },
      'std-104': { status: 'H', catatan: 'Hadir' },
      'std-105': { status: 'H', catatan: 'Sudah sembuh' },
      'std-106': { status: 'H', catatan: 'Hadir' },
      'std-107': { status: 'H', catatan: 'Hadir' },
      'std-108': { status: 'H', catatan: 'Hadir' },
      'std-109': { status: 'H', catatan: 'Hadir' },
      'std-110': { status: 'H', catatan: 'Hadir' },
      'std-111': { status: 'H', catatan: 'Hadir' },
      'std-112': { status: 'S', catatan: 'Flu batuk, orang tua telepon' },
      'std-113': { status: 'H', catatan: 'Hadir' },
      'std-114': { status: 'H', catatan: 'Hadir' },
      'std-115': { status: 'A', catatan: 'Tidak ada surat keterangan' },
      'std-116': { status: 'H', catatan: 'Hadir' },
    },
  },
  {
    id: 'ses-3',
    classId: 'class-1',
    tanggal: '2025-08-18',
    pertemuanKe: 3,
    topikMateri: 'Struktur Perulangan (For, While) dan Array 1 Dimensi',
    records: {
      'std-101': { status: 'H', catatan: 'Hadir' },
      'std-102': { status: 'H', catatan: 'Hadir' },
      'std-103': { status: 'H', catatan: 'Hadir' },
      'std-104': { status: 'H', catatan: 'Hadir' },
      'std-105': { status: 'H', catatan: 'Mengerjakan tugas lab' },
      'std-106': { status: 'H', catatan: 'Hadir' },
      'std-107': { status: 'H', catatan: 'Hadir' },
      'std-108': { status: 'H', catatan: 'Hadir' },
      'std-109': { status: 'H', catatan: 'Hadir' },
      'std-110': { status: 'H', catatan: 'Hadir' },
      'std-111': { status: 'H', catatan: 'Hadir' },
      'std-112': { status: 'H', catatan: 'Hadir' },
      'std-113': { status: 'H', catatan: 'Hadir' },
      'std-114': { status: 'I', catatan: 'Izin menghadiri pernikahan saudara' },
      'std-115': { status: 'H', catatan: 'Hadir, ditegur wali kelas' },
      'std-116': { status: 'H', catatan: 'Hadir' },
    },
  },
];

const DEFAULT_GRADES_CLASS_1: StudentGrade[] = [
  { id: 'grd-101', studentId: 'std-101', classId: 'class-1', formatif1: 88, formatif2: 92, formatif3: 90, formatif4: 95, formatif5: 90, formatif6: 92, formatif7: 94, formatif8: 96, sumatifTengah: 89, sumatifAkhir: 94, tugas1: 88, tugas2: 92, tugas3: 90, uts: 89, uas: 94, praktik: 95, catatan: 'Sangat memuaskan, calon asisten lab' },
  { id: 'grd-102', studentId: 'std-102', classId: 'class-1', formatif1: 85, formatif2: 88, formatif3: 86, formatif4: 90, formatif5: 87, formatif6: 89, formatif7: 86, formatif8: 88, sumatifTengah: 84, sumatifAkhir: 88, tugas1: 85, tugas2: 88, tugas3: 86, uts: 84, uas: 88, praktik: 90, catatan: 'Tugas rapi & sistematis' },
  { id: 'grd-103', studentId: 'std-103', classId: 'class-1', formatif1: 80, formatif2: 78, formatif3: 82, formatif4: 85, formatif5: 80, formatif6: 82, formatif7: 84, formatif8: 83, sumatifTengah: 80, sumatifAkhir: 82, tugas1: 80, tugas2: 78, tugas3: 82, uts: 80, uas: 82, praktik: 85, catatan: 'Perlu latihan algoritma loop' },
  { id: 'grd-104', studentId: 'std-104', classId: 'class-1', formatif1: 86, formatif2: 84, formatif3: 88, formatif4: 88, formatif5: 85, formatif6: 87, formatif7: 86, formatif8: 88, sumatifTengah: 85, sumatifAkhir: 87, tugas1: 86, tugas2: 84, tugas3: 88, uts: 85, uas: 87, praktik: 88, catatan: 'Hasil belajar stabil' },
  { id: 'grd-105', studentId: 'std-105', classId: 'class-1', formatif1: 72, formatif2: 74, formatif3: 75, formatif4: 76, formatif5: 74, formatif6: 75, formatif7: 76, formatif8: 78, sumatifTengah: 70, sumatifAkhir: 74, tugas1: 72, tugas2: 74, tugas3: 75, uts: 70, uas: 74, praktik: 76, catatan: 'Perlu remidi materi array' },
  { id: 'grd-106', studentId: 'std-106', classId: 'class-1', formatif1: 90, formatif2: 92, formatif3: 94, formatif4: 96, formatif5: 92, formatif6: 94, formatif7: 95, formatif8: 97, sumatifTengah: 92, sumatifAkhir: 95, tugas1: 90, tugas2: 92, tugas3: 94, uts: 92, uas: 95, praktik: 96, catatan: 'Prestasi istimewa' },
  { id: 'grd-107', studentId: 'std-107', classId: 'class-1', formatif1: 84, formatif2: 86, formatif3: 88, formatif4: 92, formatif5: 85, formatif6: 88, formatif7: 87, formatif8: 89, sumatifTengah: 82, sumatifAkhir: 85, tugas1: 84, tugas2: 86, tugas3: 88, uts: 82, uas: 85, praktik: 92, catatan: 'Karya antarmuka sangat apik' },
  { id: 'grd-108', studentId: 'std-108', classId: 'class-1', formatif1: 85, formatif2: 87, formatif3: 85, formatif4: 89, formatif5: 86, formatif6: 88, formatif7: 87, formatif8: 90, sumatifTengah: 84, sumatifAkhir: 86, tugas1: 85, tugas2: 87, tugas3: 85, uts: 84, uas: 86, praktik: 89, catatan: 'Komunikatif dan teliti' },
  { id: 'grd-109', studentId: 'std-109', classId: 'class-1', formatif1: 78, formatif2: 76, formatif3: 80, formatif4: 84, formatif5: 79, formatif6: 81, formatif7: 82, formatif8: 83, sumatifTengah: 76, sumatifAkhir: 78, tugas1: 78, tugas2: 76, tugas3: 80, uts: 76, uas: 78, praktik: 84, catatan: 'Bagus di praktik mandiri' },
  { id: 'grd-110', studentId: 'std-110', classId: 'class-1', formatif1: 88, formatif2: 86, formatif3: 89, formatif4: 90, formatif5: 87, formatif6: 88, formatif7: 89, formatif8: 91, sumatifTengah: 86, sumatifAkhir: 88, tugas1: 88, tugas2: 86, tugas3: 89, uts: 86, uas: 88, praktik: 90, catatan: 'Tuntas memuaskan' },
  { id: 'grd-111', studentId: 'std-111', classId: 'class-1', formatif1: 92, formatif2: 90, formatif3: 95, formatif4: 98, formatif5: 94, formatif6: 96, formatif7: 97, formatif8: 99, sumatifTengah: 94, sumatifAkhir: 96, tugas1: 92, tugas2: 90, tugas3: 95, uts: 94, uas: 96, praktik: 98, catatan: 'Peringkat 1 penguasaan kode' },
  { id: 'grd-112', studentId: 'std-112', classId: 'class-1', formatif1: 82, formatif2: 80, formatif3: 84, formatif4: 85, formatif5: 82, formatif6: 83, formatif7: 84, formatif8: 86, sumatifTengah: 81, sumatifAkhir: 83, tugas1: 82, tugas2: 80, tugas3: 84, uts: 81, uas: 83, praktik: 85, catatan: 'Tuntas' },
  { id: 'grd-113', studentId: 'std-113', classId: 'class-1', formatif1: 86, formatif2: 88, formatif3: 87, formatif4: 90, formatif5: 87, formatif6: 89, formatif7: 88, formatif8: 91, sumatifTengah: 85, sumatifAkhir: 89, tugas1: 86, tugas2: 88, tugas3: 87, uts: 85, uas: 89, praktik: 90, catatan: 'Kerja tim solid' },
  { id: 'grd-114', studentId: 'std-114', classId: 'class-1', formatif1: 84, formatif2: 82, formatif3: 86, formatif4: 87, formatif5: 84, formatif6: 85, formatif7: 86, formatif8: 88, sumatifTengah: 82, sumatifAkhir: 85, tugas1: 84, tugas2: 82, tugas3: 86, uts: 82, uas: 85, praktik: 87, catatan: 'Tuntas' },
  { id: 'grd-115', studentId: 'std-115', classId: 'class-1', formatif1: 65, formatif2: 68, formatif3: 70, formatif4: 72, formatif5: 68, formatif6: 70, formatif7: 71, formatif8: 72, sumatifTengah: 62, sumatifAkhir: 66, tugas1: 65, tugas2: 68, tugas3: 70, uts: 62, uas: 66, praktik: 72, catatan: 'Remedial wajib UTS & UAS' },
  { id: 'grd-116', studentId: 'std-116', classId: 'class-1', formatif1: 88, formatif2: 89, formatif3: 90, formatif4: 92, formatif5: 89, formatif6: 91, formatif7: 90, formatif8: 93, sumatifTengah: 87, sumatifAkhir: 91, tugas1: 88, tugas2: 89, tugas3: 90, uts: 87, uas: 91, praktik: 92, catatan: 'Prestasi baik' },
];

export const Storage = {
  getTeacher(): TeacherProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEACHER);
      if (!data) return DEFAULT_TEACHER;
      const parsed = JSON.parse(data);
      // Migrate old default school name to SMK Muhammadiyah Bawang if needed
      if (!parsed.namaSekolah || parsed.namaSekolah.includes('Teladan Nusantara')) {
        parsed.namaSekolah = 'SMK Muhammadiyah Bawang';
      }
      if (!parsed.email) {
        parsed.email = '';
      }
      return parsed;
    } catch {
      return DEFAULT_TEACHER;
    }
  },

  setTeacher(teacher: TeacherProfile): void {
    localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(teacher));
  },

  getClasses(): ClassRoom[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      return data ? JSON.parse(data) : DEFAULT_CLASSES;
    } catch {
      return DEFAULT_CLASSES;
    }
  },

  setClasses(classes: ClassRoom[]): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  },

  getActiveClassId(): string {
    const classes = this.getClasses();
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_CLASS);
    if (stored && classes.some((c) => c.id === stored)) {
      return stored;
    }
    return classes[0]?.id || '';
  },

  setActiveClassId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS, id);
  },

  getAllStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return data ? JSON.parse(data) : DEFAULT_STUDENTS_CLASS_1;
    } catch {
      return DEFAULT_STUDENTS_CLASS_1;
    }
  },

  setAllStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  getStudentsByClass(classId: string): Student[] {
    const all = this.getAllStudents();
    return all.filter((s) => s.classId === classId).sort((a, b) => a.no - b.no);
  },

  getAllSessions(): AttendanceSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return data ? JSON.parse(data) : DEFAULT_SESSIONS_CLASS_1;
    } catch {
      return DEFAULT_SESSIONS_CLASS_1;
    }
  },

  setAllSessions(sessions: AttendanceSession[]): void {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(sessions));
  },

  getSessionsByClass(classId: string): AttendanceSession[] {
    const all = this.getAllSessions();
    return all.filter((s) => s.classId === classId).sort((a, b) => a.pertemuanKe - b.pertemuanKe);
  },

  getAllGrades(): StudentGrade[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GRADES);
      const rawList: StudentGrade[] = data ? JSON.parse(data) : DEFAULT_GRADES_CLASS_1;
      // Ensure every grade item has the 10 assessment columns initialized
      return rawList.map((g) => ({
        ...g,
        formatif1: g.formatif1 ?? g.tugas1 ?? null,
        formatif2: g.formatif2 ?? g.tugas2 ?? null,
        formatif3: g.formatif3 ?? g.tugas3 ?? null,
        formatif4: g.formatif4 ?? g.praktik ?? null,
        formatif5: g.formatif5 ?? null,
        formatif6: g.formatif6 ?? null,
        formatif7: g.formatif7 ?? null,
        formatif8: g.formatif8 ?? null,
        sumatifTengah: g.sumatifTengah ?? g.uts ?? null,
        sumatifAkhir: g.sumatifAkhir ?? g.uas ?? null,
      }));
    } catch {
      return DEFAULT_GRADES_CLASS_1;
    }
  },

  setAllGrades(grades: StudentGrade[]): void {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
  },

  getGradesByClass(classId: string): StudentGrade[] {
    const all = this.getAllGrades();
    return all.filter((g) => g.classId === classId);
  },

  // Reset to default demo data
  resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(DEFAULT_TEACHER));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS, DEFAULT_CLASSES[0].id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS_CLASS_1));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(DEFAULT_SESSIONS_CLASS_1));
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(DEFAULT_GRADES_CLASS_1));
  },
};
