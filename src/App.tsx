import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActiveTab,
  ClassRoom,
  Student,
  AttendanceSession,
  StudentGrade,
  TeacherProfile,
  AttendanceStatus,
} from './types';
import { Storage } from './utils/storage';
import { CloudStorage } from './services/cloudStorage';
import { FirestoreService } from './services/firestoreService';
import { GoogleWorkspaceAuthResult, signOutGoogleWorkspace } from './utils/googleWorkspace';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

// Components
import { Navbar } from './components/Navbar';
import { Toast, ToastType } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { ClassModal } from './components/ClassModal';
import { DeleteClassModal } from './components/DeleteClassModal';
import { StudentModal } from './components/StudentModal';
import { AttendanceSessionModal } from './components/AttendanceSessionModal';
import { SpreadsheetImportModal } from './components/SpreadsheetImportModal';
import { LoginModal } from './components/LoginModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { LoginPage } from './components/LoginPage';
import { CloudLoadingScreen } from './components/CloudLoadingScreen';

// Views
import { AttendanceView } from './components/AttendanceView';
import { GradebookView } from './components/GradebookView';
import { StatisticsView } from './components/StatisticsView';
import { StudentManagementView } from './components/StudentManagementView';
import { GoogleWorkspaceView } from './components/GoogleWorkspaceView';
import { SchoolMapView } from './components/SchoolMapView';
import { ParentDailyReportView } from './components/ParentDailyReportView';

export default function App() {
  // Core State
  const [teacher, setTeacher] = useState<TeacherProfile>(() => Storage.getTeacher());
  const [classes, setClasses] = useState<ClassRoom[]>(() => Storage.getClasses());
  const [activeClassId, setActiveClassId] = useState<string>(() => Storage.getActiveClassId());
  const [allStudents, setAllStudents] = useState<Student[]>(() => Storage.getAllStudents());
  const [allSessions, setAllSessions] = useState<AttendanceSession[]>(() => Storage.getAllSessions());
  const [allGrades, setAllGrades] = useState<StudentGrade[]>(() => Storage.getAllGrades());

  const [activeTab, setActiveTab] = useState<ActiveTab>('absensi');
  const [isCloudSaving, setIsCloudSaving] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudStatusMessage, setCloudStatusMessage] = useState('Menghubungkan ke Cloud Firestore...');

  // Google Workspace & Auth State
  const [workspaceAuth, setWorkspaceAuth] = useState<GoogleWorkspaceAuthResult | null>(null);

  // Front Page Mode (Active when logged out or when user requests front page)
  const [isFrontPageMode, setIsFrontPageMode] = useState<boolean>(
    () => !Storage.getTeacher().isLoggedIn
  );

  // Toast Notification State
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    linkUrl?: string;
    linkLabel?: string;
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', linkUrl?: string, linkLabel?: string) => {
      setToast({ message, type, linkUrl, linkLabel });
    },
    []
  );

  // Modals State
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isDeleteClassModalOpen, setIsDeleteClassModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassRoom | null>(null);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<AttendanceSession | null>(null);

  const [isSpreadsheetImportModalOpen, setIsSpreadsheetImportModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [isWhatsAppShareModalOpen, setIsWhatsAppShareModalOpen] = useState(false);
  const [whatsAppShareSession, setWhatsAppShareSession] = useState<AttendanceSession | null>(null);

  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: '',
    onConfirm: () => {},
  });

  // Current Active Class
  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === activeClassId) || classes[0] || {
      id: 'default',
      namaKelas: 'X TKR 1',
      mataPelajaran: 'Pemeliharaan Mesin Kendaraan',
      kkm: 75,
      createdAt: new Date().toISOString(),
    };
  }, [classes, activeClassId]);

  // Filtered Students for Current Class
  const currentClassStudents = useMemo(() => {
    return allStudents
      .filter((s) => s.classId === currentClass.id)
      .sort((a, b) => a.no - b.no);
  }, [allStudents, currentClass.id]);

  // Filtered Sessions for Current Class
  const currentClassSessions = useMemo(() => {
    return allSessions
      .filter((s) => s.classId === currentClass.id)
      .sort((a, b) => a.pertemuanKe - b.pertemuanKe);
  }, [allSessions, currentClass.id]);

  // Grades Map for Current Class
  const currentClassGradesMap = useMemo(() => {
    const map: Record<string, StudentGrade> = {};
    allGrades
      .filter((g) => g.classId === currentClass.id)
      .forEach((g) => {
        map[g.studentId] = g;
      });
    return map;
  }, [allGrades, currentClass.id]);

  // Listen to Firebase Auth state for automatic Google authentication and cloud data pull
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setIsLoadingCloud(true);
        setCloudStatusMessage(`Menghubungkan akun Google ${firebaseUser.email}...`);
        try {
          let userData = await FirestoreService.loadUserData(firebaseUser.uid);
          if (!userData.classes || userData.classes.length === 0) {
            setCloudStatusMessage('Menyiapkan data sekolah SMK Muhammadiyah Bawang...');
            userData = await FirestoreService.seedInitialUserData(firebaseUser.uid, {
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
            });
          }

          setClasses(userData.classes);
          setActiveClassId(userData.activeClassId || userData.classes[0]?.id || '');
          setAllStudents(userData.students);
          setAllSessions(userData.sessions);
          setAllGrades(userData.grades);

          const syncedTeacher: TeacherProfile = {
            ...userData.teacher,
            id: firebaseUser.uid,
            namaGuru: firebaseUser.displayName || userData.teacher.namaGuru || 'Guru SMK',
            email: firebaseUser.email || userData.teacher.email || '',
            avatarUrl: firebaseUser.photoURL || userData.teacher.avatarUrl || '',
            isLoggedIn: true,
          };
          setTeacher(syncedTeacher);
          Storage.setTeacher(syncedTeacher);
          setIsFrontPageMode(false);
          showToast(`Berhasil masuk sebagai ${syncedTeacher.namaGuru} (${firebaseUser.email}).`, 'success');
        } catch (err: any) {
          console.error('Error fetching Firestore user data:', err);
          showToast(`Gagal mengunduh data Firestore: ${err.message || 'Koneksi lambat'}. Menggunakan cache offline.`, 'error');
        } finally {
          setIsLoadingCloud(false);
        }
      }
    });

    return () => unsubscribe();
  }, [showToast]);

  // Auto-Persist to LocalStorage
  useEffect(() => {
    Storage.setTeacher(teacher);
  }, [teacher]);

  useEffect(() => {
    Storage.setClasses(classes);
  }, [classes]);

  useEffect(() => {
    Storage.setActiveClassId(activeClassId);
  }, [activeClassId]);

  useEffect(() => {
    Storage.setAllStudents(allStudents);
  }, [allStudents]);

  useEffect(() => {
    Storage.setAllSessions(allSessions);
  }, [allSessions]);

  useEffect(() => {
    Storage.setAllGrades(allGrades);
  }, [allGrades]);

  // Auto-sync with Cloud Storage (Firestore) if logged in with Firebase Auth
  const syncToCloud = useCallback(async () => {
    if (!teacher.isLoggedIn || !auth.currentUser) return;
    setIsCloudSaving(true);
    try {
      const currentUid = auth.currentUser.uid;
      const currentEmail = auth.currentUser.email || teacher.email || '';
      await CloudStorage.saveWorkspace({
        teacherUid: currentUid,
        email: currentEmail,
        teacher: { ...teacher, id: currentUid, email: currentEmail },
        classes,
        activeClassId,
        students: allStudents,
        sessions: allSessions,
        grades: allGrades,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Cloud auto-sync background error:', err);
    } finally {
      setIsCloudSaving(false);
    }
  }, [teacher, classes, activeClassId, allStudents, allSessions, allGrades]);

  // Debounced cloud sync on data change
  useEffect(() => {
    if (teacher.isLoggedIn) {
      const timer = setTimeout(() => {
        syncToCloud();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [classes, allStudents, allSessions, allGrades, teacher.isLoggedIn, syncToCloud]);

  // Class Management Handlers
  const handleSelectClass = (classId: string) => {
    setActiveClassId(classId);
  };

  const handleSaveClass = (classData: {
    namaKelas: string;
    mataPelajaran: string;
    kkm: number;
    jurusan?: string;
    keterangan?: string;
  }) => {
    const newClass: ClassRoom = {
      id: 'class-' + Date.now(),
      namaKelas: classData.namaKelas.trim(),
      mataPelajaran: classData.mataPelajaran.trim(),
      kkm: classData.kkm,
      jurusan: classData.jurusan?.trim(),
      keterangan: classData.keterangan?.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    setClasses((prev) => [...prev, newClass]);
    setActiveClassId(newClass.id);
    showToast(`Kelas ${newClass.namaKelas} berhasil dibuat!`, 'success');
  };

  const handleDeleteClassPrompt = (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return;
    setClassToDelete(cls);
    setIsDeleteClassModalOpen(true);
  };

  const handleConfirmDeleteClass = () => {
    if (!classToDelete) return;
    const deletedId = classToDelete.id;
    const remaining = classes.filter((c) => c.id !== deletedId);

    setClasses(remaining);
    // Remove students, sessions, and grades of this class
    setAllStudents((prev) => prev.filter((s) => s.classId !== deletedId));
    setAllSessions((prev) => prev.filter((s) => s.classId !== deletedId));
    setAllGrades((prev) => prev.filter((g) => g.classId !== deletedId));

    if (activeClassId === deletedId) {
      setActiveClassId(remaining[0]?.id || '');
    }

    setIsDeleteClassModalOpen(false);
    setClassToDelete(null);
    showToast(`Kelas ${classToDelete.namaKelas} telah dihapus.`, 'info');
  };

  // Student Management Handlers
  const handleOpenStudentModal = (student?: Student) => {
    setEditingStudent(student || null);
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (studentData: {
    no: number;
    nisn: string;
    nama: string;
    gender: 'L' | 'P';
    catatanUmum?: string;
    noHpOrangTua?: string;
  }) => {
    if (editingStudent) {
      // Edit existing
      setAllStudents((prev) =>
        prev.map((s) =>
          s.id === editingStudent.id
            ? {
                ...s,
                ...studentData,
                catatanUmum: studentData.catatanUmum || '',
              }
            : s
        )
      );
      showToast(`Data ${studentData.nama} berhasil diperbarui.`, 'success');
    } else {
      // Add new
      const newStudent: Student = {
        id: 'std-' + Date.now(),
        classId: currentClass.id,
        ...studentData,
        catatanUmum: studentData.catatanUmum || '',
      };
      setAllStudents((prev) => [...prev, newStudent]);
      showToast(`Siswa ${studentData.nama} ditambahkan ke kelas ${currentClass.namaKelas}.`, 'success');
    }
  };

  const handleDeleteStudent = (student: Student) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Hapus Siswa',
      description: `Apakah Anda yakin ingin menghapus siswa "${student.nama}" (NISN: ${student.nisn})? Data presensi dan nilai siswa ini juga akan dihapus.`,
      actionLabel: 'Hapus Siswa',
      isDestructive: true,
      onConfirm: () => {
        setAllStudents((prev) => prev.filter((s) => s.id !== student.id));
        setAllGrades((prev) => prev.filter((g) => g.studentId !== student.id));
        setAllSessions((prev) =>
          prev.map((sess) => {
            const nextRecords = { ...sess.records };
            delete nextRecords[student.id];
            return { ...sess, records: nextRecords };
          })
        );
        showToast(`Siswa ${student.nama} berhasil dihapus.`, 'info');
      },
    });
  };

  const handleImportStudents = (newStudents: Student[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setAllStudents((prev) => [
        ...prev.filter((s) => s.classId !== currentClass.id),
        ...newStudents,
      ]);
    } else {
      setAllStudents((prev) => [...prev, ...newStudents]);
    }
    showToast(`Berhasil mengimpor ${newStudents.length} siswa ke kelas ${currentClass.namaKelas}!`, 'success');
  };

  // Attendance Session Handlers
  const handleOpenSessionModal = (session?: AttendanceSession) => {
    setEditingSession(session || null);
    setIsSessionModalOpen(true);
  };

  const handleSaveSession = (sessionData: {
    tanggal: string;
    pertemuanKe: number;
    topikMateri: string;
  }) => {
    if (editingSession) {
      setAllSessions((prev) =>
        prev.map((s) =>
          s.id === editingSession.id
            ? {
                ...s,
                ...sessionData,
              }
            : s
        )
      );
      showToast(`Sesi Pertemuan Ke-${sessionData.pertemuanKe} berhasil diperbarui.`, 'success');
    } else {
      // Build initial default records: all current students mark 'H'
      const initialRecords: Record<string, { status: AttendanceStatus; catatan: string }> = {};
      currentClassStudents.forEach((st) => {
        initialRecords[st.id] = { status: 'H', catatan: '' };
      });

      const newSession: AttendanceSession = {
        id: 'ses-' + Date.now(),
        classId: currentClass.id,
        ...sessionData,
        records: initialRecords,
      };

      setAllSessions((prev) => [...prev, newSession]);
      showToast(`Pertemuan Ke-${sessionData.pertemuanKe} (${sessionData.tanggal}) berhasil dibuat!`, 'success');
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    const sess = allSessions.find((s) => s.id === sessionId);
    setConfirmModalConfig({
      isOpen: true,
      title: 'Hapus Sesi Presensi',
      description: `Apakah Anda yakin ingin menghapus sesi Pertemuan Ke-${sess?.pertemuanKe || ''} (${sess?.tanggal || ''})? Tindakan ini tidak dapat dibatalkan.`,
      actionLabel: 'Hapus Sesi',
      isDestructive: true,
      onConfirm: () => {
        setAllSessions((prev) => prev.filter((s) => s.id !== sessionId));
        showToast('Sesi presensi telah dihapus.', 'info');
      },
    });
  };

  const handleUpdateAttendanceRecord = (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus,
    catatan: string = ''
  ) => {
    setAllSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          records: {
            ...s.records,
            [studentId]: {
              status,
              catatan: catatan !== undefined ? catatan : s.records[studentId]?.catatan || '',
            },
          },
        };
      })
    );
  };

  const handleMarkAllPresent = (sessionId: string) => {
    setAllSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const updatedRecords = { ...s.records };
        currentClassStudents.forEach((st) => {
          updatedRecords[st.id] = {
            status: 'H',
            catatan: updatedRecords[st.id]?.catatan || '',
          };
        });
        return { ...s, records: updatedRecords };
      })
    );
    showToast('Seluruh siswa berhasil ditandai Hadir (H).', 'success');
  };

  // WhatsApp Share Modal
  const handleOpenWhatsAppShare = (session: AttendanceSession) => {
    setWhatsAppShareSession(session);
    setIsWhatsAppShareModalOpen(true);
  };

  // Grade Handlers
  const handleUpdateGrade = (
    studentId: string,
    field: keyof StudentGrade,
    value: number | null
  ) => {
    setAllGrades((prev) => {
      const existing = prev.find(
        (g) => g.studentId === studentId && g.classId === currentClass.id
      );

      if (existing) {
        return prev.map((g) =>
          g.id === existing.id ? { ...g, [field]: value } : g
        );
      } else {
        const newGrade: StudentGrade = {
          id: 'grd-' + Date.now() + '-' + studentId,
          studentId,
          classId: currentClass.id,
          catatan: '',
          [field]: value,
        };
        return [...prev, newGrade];
      }
    });
  };

  const handleAutoFillGrades = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Isi Contoh Simulasi Nilai Siswa',
      description: `Sistem akan mengisi contoh nilai asesmen formatif (F1-F8) dan sumatif (STS, SAS) yang realistis untuk siswa kelas ${currentClass.namaKelas}. Nilai yang sudah ada akan disesuaikan. Lanjutkan?`,
      actionLabel: 'Isi Simulasi Nilai',
      onConfirm: () => {
        const updated = [...allGrades.filter((g) => g.classId !== currentClass.id)];
        currentClassStudents.forEach((st, idx) => {
          const base = 75 + (idx % 22);
          const f1 = Math.min(98, Math.max(65, base + ((idx * 3) % 10) - 2));
          const f2 = Math.min(98, Math.max(65, base + ((idx * 7) % 8) - 1));
          const f3 = Math.min(98, Math.max(65, base + ((idx * 5) % 12) - 3));
          const f4 = Math.min(98, Math.max(65, base + ((idx * 2) % 6)));
          const f5 = Math.min(98, Math.max(65, base + ((idx * 4) % 9) - 2));
          const f6 = Math.min(98, Math.max(65, base + ((idx * 6) % 7)));
          const f7 = Math.min(98, Math.max(65, base + ((idx * 8) % 11) - 4));
          const f8 = Math.min(98, Math.max(65, base + ((idx * 9) % 8) - 1));
          const sts = Math.min(96, Math.max(60, base + ((idx * 4) % 10) - 3));
          const sas = Math.min(98, Math.max(65, base + ((idx * 5) % 9) - 1));

          updated.push({
            id: 'grd-sim-' + st.id,
            studentId: st.id,
            classId: currentClass.id,
            formatif1: f1,
            formatif2: f2,
            formatif3: f3,
            formatif4: f4,
            formatif5: f5,
            formatif6: f6,
            formatif7: f7,
            formatif8: f8,
            sumatifTengah: sts,
            sumatifAkhir: sas,
            catatan: f1 >= currentClass.kkm ? 'Kompeten' : 'Perlu penguatan konsep dasar',
          });
        });

        setAllGrades(updated);
        showToast('Simulasi nilai siswa berhasil diterapkan!', 'success');
      },
    });
  };

  // Reset Data to Default
  const handleResetData = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Reset ke Data Standar SMK Muhammadiyah Bawang',
      description: 'Apakah Anda yakin ingin mengembalikan seluruh data ke data bawaan awal? Semua perubahan lokal sesi ini akan direset.',
      actionLabel: 'Reset Data',
      isDestructive: true,
      onConfirm: () => {
        Storage.resetToDefault();
        setTeacher(Storage.getTeacher());
        setClasses(Storage.getClasses());
        setActiveClassId(Storage.getActiveClassId());
        setAllStudents(Storage.getAllStudents());
        setAllSessions(Storage.getAllSessions());
        setAllGrades(Storage.getAllGrades());
        showToast('Data aplikasi berhasil dikembalikan ke standar awal.', 'info');
      },
    });
  };

  // Logout Handler
  const handleLogout = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Konfirmasi Keluar',
      description: 'Apakah Anda yakin ingin keluar dari akun Google? Anda akan dialihkan ke halaman login.',
      actionLabel: 'Keluar',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await signOutGoogleWorkspace();
        } catch (err) {
          console.warn('Sign out warning:', err);
        }
        const loggedOutTeacher: TeacherProfile = {
          ...teacher,
          isLoggedIn: false,
        };
        setTeacher(loggedOutTeacher);
        Storage.setTeacher(loggedOutTeacher);
        setWorkspaceAuth(null);
        setIsFrontPageMode(true);
        showToast('Anda telah berhasil keluar dari akun Google.', 'info');
      },
    });
  };

  // Cloud Loading Screen while data is syncing from Firestore
  if (isLoadingCloud) {
    return (
      <CloudLoadingScreen
        userEmail={teacher.email || 'Akun Google'}
        userName={teacher.namaGuru || 'Guru SMK'}
        statusMessage={cloudStatusMessage}
      />
    );
  }

  // Dedicated Front Page / Landing Page for Login (Google Only & Minimalist)
  if (isFrontPageMode || !teacher.isLoggedIn) {
    return (
      <>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            linkUrl={toast.linkUrl}
            linkLabel={toast.linkLabel}
            onClose={() => setToast(null)}
          />
        )}
        <LoginPage
          currentTeacher={teacher}
          onLoginSuccess={(updatedTeacher, authResult) => {
            setTeacher(updatedTeacher);
            Storage.setTeacher(updatedTeacher);
            if (authResult) {
              setWorkspaceAuth(authResult);
            }
            setIsFrontPageMode(false);
            showToast(
              `Selamat datang di SIM Guru, ${updatedTeacher.namaGuru || 'Bapak/Ibu Guru'}!`,
              'success'
            );
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          linkUrl={toast.linkUrl}
          linkLabel={toast.linkLabel}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Navbar */}
      <Navbar
        teacher={teacher}
        classes={classes}
        activeClassId={activeClassId}
        activeTab={activeTab}
        isCloudSaving={isCloudSaving}
        onSelectClass={handleSelectClass}
        onSelectTab={setActiveTab}
        onOpenClassModal={() => setIsClassModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onResetData={handleResetData}
        onDeleteClass={handleDeleteClassPrompt}
        onLogout={handleLogout}
        onOpenFrontPage={() => setIsFrontPageMode(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {activeTab === 'absensi' && (
          <AttendanceView
            currentClass={currentClass}
            students={currentClassStudents}
            sessions={currentClassSessions}
            teacher={teacher}
            onOpenSessionModal={handleOpenSessionModal}
            onDeleteSession={handleDeleteSession}
            onUpdateAttendanceRecord={handleUpdateAttendanceRecord}
            onMarkAllPresent={handleMarkAllPresent}
            onOpenWhatsAppShare={handleOpenWhatsAppShare}
          />
        )}

        {activeTab === 'nilai' && (
          <GradebookView
            currentClass={currentClass}
            students={currentClassStudents}
            grades={currentClassGradesMap}
            teacher={teacher}
            onUpdateGrade={handleUpdateGrade}
            onAutoFillGrades={handleAutoFillGrades}
          />
        )}

        {activeTab === 'statistik' && (
          <StatisticsView
            currentClass={currentClass}
            students={currentClassStudents}
            sessions={currentClassSessions}
            grades={currentClassGradesMap}
            teacher={teacher}
          />
        )}

        {activeTab === 'impor' && (
          <StudentManagementView
            currentClass={currentClass}
            students={currentClassStudents}
            onOpenStudentModal={handleOpenStudentModal}
            onOpenSpreadsheetImportModal={() => setIsSpreadsheetImportModalOpen(true)}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {activeTab === 'workspace' && (
          <GoogleWorkspaceView
            currentClass={currentClass}
            students={currentClassStudents}
            sessions={currentClassSessions}
            grades={currentClassGradesMap}
            teacher={teacher}
            workspaceAuth={workspaceAuth}
            onConnectGoogle={() => setIsLoginModalOpen(true)}
            onOpenConfirmModal={setConfirmModalConfig}
            onShowStatus={({ type, message, linkUrl, linkLabel }) => {
              showToast(message, type, linkUrl, linkLabel);
            }}
          />
        )}

        {activeTab === 'peta' && (
          <SchoolMapView
            students={currentClassStudents}
            sessions={currentClassSessions}
          />
        )}

        {activeTab === 'laporan-ortu' && (
          <ParentDailyReportView
            teacher={teacher}
            classRoom={currentClass}
            students={currentClassStudents}
            sessions={currentClassSessions}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} <strong>SMK Muhammadiyah Bawang</strong>, Kab. Batang, Jawa Tengah.
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Google Workspace & Maps Platform</span>
            <span>•</span>
            <span>Cloud SQL PostgreSQL</span>
            <span>•</span>
            <span>Firebase Firestore</span>
          </div>
        </div>
      </footer>

      {/* Modals Container */}
      <ClassModal
        isOpen={isClassModalOpen}
        onSaveClass={handleSaveClass}
        onClose={() => setIsClassModalOpen(false)}
      />

      {classToDelete && (
        <DeleteClassModal
          isOpen={isDeleteClassModalOpen}
          targetClass={classToDelete}
          onConfirmDelete={handleConfirmDeleteClass}
          onClose={() => {
            setIsDeleteClassModalOpen(false);
            setClassToDelete(null);
          }}
        />
      )}

      <StudentModal
        isOpen={isStudentModalOpen}
        nextNumber={(currentClassStudents?.length || 0) + 1}
        initialStudent={editingStudent}
        onSaveStudent={handleSaveStudent}
        onClose={() => {
          setIsStudentModalOpen(false);
          setEditingStudent(null);
        }}
      />

      <AttendanceSessionModal
        isOpen={isSessionModalOpen}
        classId={currentClass.id}
        nextMeetingNumber={(currentClassSessions?.length || 0) + 1}
        initialSession={editingSession}
        onSaveSession={handleSaveSession}
        onClose={() => {
          setIsSessionModalOpen(false);
          setEditingSession(null);
        }}
      />

      <SpreadsheetImportModal
        isOpen={isSpreadsheetImportModalOpen}
        classId={currentClass.id}
        className={currentClass.namaKelas}
        existingStudentsCount={currentClassStudents?.length || 0}
        onImportStudents={handleImportStudents}
        onClose={() => setIsSpreadsheetImportModalOpen(false)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        teacher={teacher}
        classes={classes}
        onSave={(updatedTeacher, newClasses) => {
          setTeacher(updatedTeacher);
          if (newClasses && newClasses.length > 0) {
            setClasses(newClasses);
          }
          showToast('Profil guru & kelas berhasil diperbarui.', 'success');
        }}
        onSaveProfile={(updated) => {
          setTeacher(updated);
          showToast('Profil guru berhasil diperbarui.', 'success');
        }}
        onGoogleAuthSuccess={(authResult) => {
          setWorkspaceAuth(authResult);
          setTeacher((prev) => ({
            ...prev,
            isLoggedIn: true,
            email: authResult.userEmail || prev.email,
            namaGuru: authResult.displayName || prev.namaGuru || 'Guru SMK',
            avatarUrl: authResult.photoUrl || prev.avatarUrl,
          }));
          showToast(`Akun Google terhubung (${authResult.userEmail || 'Sukses'})!`, 'success');
        }}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {whatsAppShareSession && (
        <WhatsAppShareModal
          isOpen={isWhatsAppShareModalOpen}
          teacher={teacher}
          classRoom={currentClass}
          session={whatsAppShareSession}
          students={currentClassStudents}
          onClose={() => {
            setIsWhatsAppShareModalOpen(false);
            setWhatsAppShareSession(null);
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        description={confirmModalConfig.description}
        actionLabel={confirmModalConfig.actionLabel}
        isDestructive={confirmModalConfig.isDestructive}
        onConfirm={confirmModalConfig.onConfirm}
        onClose={() =>
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </div>
  );
}
