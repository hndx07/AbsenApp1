import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  TeacherProfile,
  ClassRoom,
  Student,
  AttendanceSession,
  StudentGrade,
} from '../types';
import { Storage } from '../utils/storage';

/**
 * Sanitize object to remove undefined values before sending to Firestore
 * (Firestore throws an error if any field is undefined)
 */
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (value === undefined ? null : value))
  );
}

export interface UserWorkspaceData {
  teacher: TeacherProfile;
  classes: ClassRoom[];
  activeClassId: string;
  students: Student[];
  sessions: AttendanceSession[];
  grades: StudentGrade[];
  isNewUser?: boolean;
}

export const FirestoreService = {
  /**
   * Load all teacher data isolated by UID from Cloud Firestore
   */
  async loadUserData(uid: string): Promise<UserWorkspaceData> {
    if (!uid) {
      throw new Error('User UID tidak valid untuk memuat data Firestore.');
    }

    try {
      // 1. Fetch Teacher Profile
      const teacherDocRef = doc(db, 'users', uid, 'profile', 'teacher');
      const teacherSnap = await getDoc(teacherDocRef);
      const teacherData = teacherSnap.exists()
        ? (teacherSnap.data() as TeacherProfile)
        : null;

      // 2. Fetch Classes
      const classesColRef = collection(db, 'users', uid, 'classes');
      const classesSnap = await getDocs(classesColRef);
      const classesData = classesSnap.docs.map((d) => d.data() as ClassRoom);

      // 3. Fetch Students
      const studentsColRef = collection(db, 'users', uid, 'students');
      const studentsSnap = await getDocs(studentsColRef);
      const studentsData = studentsSnap.docs.map((d) => d.data() as Student);

      // 4. Fetch Attendance Sessions
      const sessionsColRef = collection(db, 'users', uid, 'attendance_sessions');
      const sessionsSnap = await getDocs(sessionsColRef);
      const sessionsData = sessionsSnap.docs.map(
        (d) => d.data() as AttendanceSession
      );

      // 5. Fetch Grades
      const gradesColRef = collection(db, 'users', uid, 'grades');
      const gradesSnap = await getDocs(gradesColRef);
      const gradesData = gradesSnap.docs.map((d) => d.data() as StudentGrade);

      // Check if user has any existing classes in Firestore
      if (classesData.length === 0) {
        return {
          teacher: teacherData || {
            id: 't-' + uid,
            namaGuru: '',
            nip: '',
            namaSekolah: 'SMK Muhammadiyah Bawang',
            mataPelajaranUtama: 'Informatika & Pemrograman',
            tahunAjaran: '2025/2026',
            semester: 'Ganjil',
            isLoggedIn: true,
          },
          classes: [],
          activeClassId: '',
          students: [],
          sessions: [],
          grades: [],
          isNewUser: true,
        };
      }

      const activeClassId =
        teacherData?.activeClassId || classesData[0]?.id || '';

      return {
        teacher: teacherData || {
          id: 't-' + uid,
          namaGuru: 'Guru SMK',
          nip: '',
          namaSekolah: 'SMK Muhammadiyah Bawang',
          mataPelajaranUtama: classesData[0]?.mataPelajaran || 'Informatika',
          tahunAjaran: '2025/2026',
          semester: 'Ganjil',
          isLoggedIn: true,
          activeClassId,
        },
        classes: classesData,
        activeClassId,
        students: studentsData,
        sessions: sessionsData,
        grades: gradesData,
        isNewUser: false,
      };
    } catch (error) {
      console.error('[FirestoreService] Error loading user data:', error);
      throw error;
    }
  },

  /**
   * Seeds initial default dataset for a newly registered Google user
   */
  async seedInitialUserData(
    uid: string,
    googleUser: {
      displayName?: string | null;
      email?: string | null;
      photoURL?: string | null;
    }
  ): Promise<UserWorkspaceData> {
    const defaultClasses = Storage.getClasses();
    const defaultStudents = Storage.getAllStudents();
    const defaultSessions = Storage.getAllSessions();
    const defaultGrades = Storage.getAllGrades();

    const teacherProfile: TeacherProfile = {
      id: 't-' + uid,
      namaGuru: googleUser.displayName || 'Guru SMK',
      nip: '198507152010011005',
      namaSekolah: 'SMK Muhammadiyah Bawang',
      mataPelajaranUtama: defaultClasses[0]?.mataPelajaran || 'Informatika',
      tahunAjaran: '2025/2026',
      semester: 'Ganjil',
      isLoggedIn: true,
      email: googleUser.email || '',
      avatarUrl: googleUser.photoURL || '',
      activeClassId: defaultClasses[0]?.id || 'class-1',
    };

    const batch = writeBatch(db);

    // Save profile
    const profileRef = doc(db, 'users', uid, 'profile', 'teacher');
    batch.set(profileRef, sanitizeForFirestore(teacherProfile));

    // Save classes
    defaultClasses.forEach((cls) => {
      const classRef = doc(db, 'users', uid, 'classes', cls.id);
      batch.set(classRef, sanitizeForFirestore({ ...cls, teacherUid: uid }));
    });

    // Save students
    defaultStudents.forEach((std) => {
      const stdRef = doc(db, 'users', uid, 'students', std.id);
      batch.set(stdRef, sanitizeForFirestore({ ...std, teacherUid: uid }));
    });

    // Save sessions
    defaultSessions.forEach((ses) => {
      const sesRef = doc(db, 'users', uid, 'attendance_sessions', ses.id);
      batch.set(sesRef, sanitizeForFirestore({ ...ses, teacherUid: uid }));
    });

    // Save grades
    defaultGrades.forEach((grd) => {
      const grdRef = doc(db, 'users', uid, 'grades', grd.id);
      batch.set(grdRef, sanitizeForFirestore({ ...grd, teacherUid: uid }));
    });

    await batch.commit();
    console.log(`[FirestoreService] Seeded initial data for user ${uid}`);

    return {
      teacher: teacherProfile,
      classes: defaultClasses,
      activeClassId: defaultClasses[0]?.id || 'class-1',
      students: defaultStudents,
      sessions: defaultSessions,
      grades: defaultGrades,
      isNewUser: false,
    };
  },

  /**
   * Save or update Teacher Profile
   */
  async saveTeacherProfile(uid: string, profile: TeacherProfile): Promise<void> {
    const docRef = doc(db, 'users', uid, 'profile', 'teacher');
    await setDoc(docRef, sanitizeForFirestore(profile), { merge: true });
  },

  /**
   * Save or update a ClassRoom
   */
  async saveClass(uid: string, classItem: ClassRoom): Promise<void> {
    const docRef = doc(db, 'users', uid, 'classes', classItem.id);
    await setDoc(
      docRef,
      sanitizeForFirestore({ ...classItem, teacherUid: uid }),
      { merge: true }
    );
  },

  /**
   * Delete a ClassRoom and its related students, sessions, and grades
   */
  async deleteClass(uid: string, classId: string): Promise<void> {
    // 1. Delete class document
    await deleteDoc(doc(db, 'users', uid, 'classes', classId));

    // 2. Cascade delete students of this class
    const studentsRef = collection(db, 'users', uid, 'students');
    const studentsSnap = await getDocs(
      query(studentsRef, where('classId', '==', classId))
    );
    const batch = writeBatch(db);
    studentsSnap.docs.forEach((d) => batch.delete(d.ref));

    // 3. Cascade delete sessions of this class
    const sessionsRef = collection(db, 'users', uid, 'attendance_sessions');
    const sessionsSnap = await getDocs(
      query(sessionsRef, where('classId', '==', classId))
    );
    sessionsSnap.docs.forEach((d) => batch.delete(d.ref));

    // 4. Cascade delete grades of this class
    const gradesRef = collection(db, 'users', uid, 'grades');
    const gradesSnap = await getDocs(
      query(gradesRef, where('classId', '==', classId))
    );
    gradesSnap.docs.forEach((d) => batch.delete(d.ref));

    await batch.commit();
  },

  /**
   * Save or update a Student
   */
  async saveStudent(uid: string, student: Student): Promise<void> {
    const docRef = doc(db, 'users', uid, 'students', student.id);
    await setDoc(
      docRef,
      sanitizeForFirestore({ ...student, teacherUid: uid }),
      { merge: true }
    );
  },

  /**
   * Delete a Student and their grade record
   */
  async deleteStudent(uid: string, studentId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'students', studentId));
    const gradesRef = collection(db, 'users', uid, 'grades');
    const gradesSnap = await getDocs(
      query(gradesRef, where('studentId', '==', studentId))
    );
    if (!gradesSnap.empty) {
      const batch = writeBatch(db);
      gradesSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  },

  /**
   * Save multiple students (e.g. from Excel/Spreadsheet import)
   */
  async importStudentsBatch(
    uid: string,
    students: Student[],
    newGrades: StudentGrade[],
    mode: 'replace' | 'append',
    targetClassId: string
  ): Promise<void> {
    const batch = writeBatch(db);

    if (mode === 'replace') {
      // Delete existing students for this class
      const studentsRef = collection(db, 'users', uid, 'students');
      const existingSnap = await getDocs(
        query(studentsRef, where('classId', '==', targetClassId))
      );
      existingSnap.docs.forEach((d) => batch.delete(d.ref));

      // Delete existing grades for this class
      const gradesRef = collection(db, 'users', uid, 'grades');
      const existingGradesSnap = await getDocs(
        query(gradesRef, where('classId', '==', targetClassId))
      );
      existingGradesSnap.docs.forEach((d) => batch.delete(d.ref));
    }

    // Insert new students
    students.forEach((s) => {
      const sRef = doc(db, 'users', uid, 'students', s.id);
      batch.set(sRef, sanitizeForFirestore({ ...s, teacherUid: uid }));
    });

    // Insert new grades
    newGrades.forEach((g) => {
      const gRef = doc(db, 'users', uid, 'grades', g.id);
      batch.set(gRef, sanitizeForFirestore({ ...g, teacherUid: uid }));
    });

    await batch.commit();
  },

  /**
   * Save or update Attendance Session
   */
  async saveAttendanceSession(
    uid: string,
    session: AttendanceSession
  ): Promise<void> {
    const docRef = doc(db, 'users', uid, 'attendance_sessions', session.id);
    await setDoc(
      docRef,
      sanitizeForFirestore({ ...session, teacherUid: uid }),
      { merge: true }
    );
  },

  /**
   * Delete an Attendance Session
   */
  async deleteAttendanceSession(
    uid: string,
    sessionId: string
  ): Promise<void> {
    const docRef = doc(db, 'users', uid, 'attendance_sessions', sessionId);
    await deleteDoc(docRef);
  },

  /**
   * Save or update Student Grade
   */
  async saveGrade(uid: string, grade: StudentGrade): Promise<void> {
    const docRef = doc(db, 'users', uid, 'grades', grade.id);
    await setDoc(
      docRef,
      sanitizeForFirestore({ ...grade, teacherUid: uid }),
      { merge: true }
    );
  },

  /**
   * Batch save or update multiple student grades
   */
  async saveAllGrades(uid: string, grades: StudentGrade[]): Promise<void> {
    if (!grades || grades.length === 0) return;
    const batch = writeBatch(db);
    grades.forEach((grade) => {
      const docRef = doc(db, 'users', uid, 'grades', grade.id);
      batch.set(
        docRef,
        sanitizeForFirestore({ ...grade, teacherUid: uid }),
        { merge: true }
      );
    });
    await batch.commit();
  },

  /**
   * Reset all user data back to default SMK demo dataset
   */
  async resetUserData(
    uid: string,
    googleUser: {
      displayName?: string | null;
      email?: string | null;
      photoURL?: string | null;
    }
  ): Promise<UserWorkspaceData> {
    // 1. Delete all current documents in user's subcollections
    const collectionsToClear = [
      'classes',
      'students',
      'attendance_sessions',
      'grades',
    ];
    for (const colName of collectionsToClear) {
      const colRef = collection(db, 'users', uid, colName);
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }

    // 2. Re-seed default
    return await this.seedInitialUserData(uid, googleUser);
  },
};
