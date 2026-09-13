import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import {
  TeacherProfile,
  ClassRoom,
  Student,
  AttendanceSession,
  StudentGrade,
  TeacherWorkspaceData,
} from '../types';

/**
 * Sanitize object to remove undefined values before sending to Firestore
 */
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (value === undefined ? null : value))
  );
}

/**
 * Cloud Storage Service for Multi-Device Persistence
 * Ensures: "Semua data yang diunggah otomatis tersimpan di tiap email yang login. Satu email satu data."
 */
export const CloudStorage = {
  /**
   * Generates a safe storage key for local cache per email
   */
  getEmailCacheKey(emailOrUid: string): string {
    const cleanKey = (emailOrUid || 'anonymous')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    return `absensi_workspace_${cleanKey}`;
  },

  /**
   * Saves complete teacher workspace to Firestore under the teacher's UID
   * and also caches locally under that specific email key.
   */
  async saveWorkspace(
    arg1: string | TeacherWorkspaceData,
    arg2?: string,
    arg3?: {
      teacher: TeacherProfile;
      classes: ClassRoom[];
      activeClassId: string;
      students: Student[];
      sessions: AttendanceSession[];
      grades: StudentGrade[];
    }
  ): Promise<boolean> {
    let payload: TeacherWorkspaceData;

    if (typeof arg1 === 'object') {
      payload = arg1;
    } else {
      const teacherUid = arg1;
      const email = arg2 || '';
      const data = arg3!;
      payload = {
        teacherUid,
        email: email.toLowerCase().trim(),
        teacher: data.teacher,
        classes: data.classes,
        activeClassId: data.activeClassId,
        students: data.students,
        sessions: data.sessions,
        grades: data.grades,
        updatedAt: new Date().toISOString(),
      };
    }

    const { teacherUid, email } = payload;

    // 1. Save to email-isolated local cache immediately (always reliable offline)
    try {
      const cacheKey = this.getEmailCacheKey(email || teacherUid);
      localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to cache workspace locally:', e);
    }

    // 2. Persist to Firestore cloud database only if authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      // User is not signed in to Firebase Auth yet, local cache is preserved
      return true;
    }

    const targetUid = currentUser.uid;
    const sanitizedPayload = sanitizeForFirestore({
      ...payload,
      teacherUid: targetUid,
      email: currentUser.email || email,
    });

    const path = `teacher_workspaces/${targetUid}`;
    try {
      const docRef = doc(db, 'teacher_workspaces', targetUid);
      await setDoc(docRef, sanitizedPayload, { merge: true });

      // Also mirror to user-isolated collection
      const userDocRef = doc(db, 'users', targetUid, 'workspace', 'current');
      await setDoc(userDocRef, sanitizedPayload, { merge: true });

      return true;
    } catch (error: any) {
      console.error('[CloudStorage] Error saving workspace to Firestore:', error);
      // If permission error occurs, route through handleFirestoreError for diagnostic tracing
      if (
        error?.code === 'permission-denied' ||
        error?.message?.includes('permission')
      ) {
        try {
          handleFirestoreError(error, OperationType.WRITE, path);
        } catch (thrownErr) {
          // Keep failure non-fatal to the client UI so the user can continue working offline
          console.warn('[CloudStorage] Diagnostic error report:', thrownErr);
        }
      }
      return false;
    }
  },

  /**
   * Loads teacher workspace from Firestore for the given user.
   * If Firestore is slow or offline, falls back to the email-isolated local cache.
   */
  async loadWorkspace(
    teacherUid: string,
    email: string
  ): Promise<TeacherWorkspaceData | null> {
    const cacheKey = this.getEmailCacheKey(email || teacherUid);

    // 1. Try reading from Firestore if authenticated
    const currentUser = auth.currentUser;
    const targetUid = currentUser ? currentUser.uid : teacherUid;

    if (currentUser && targetUid) {
      const path = `teacher_workspaces/${targetUid}`;
      try {
        const docRef = doc(db, 'teacher_workspaces', targetUid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const cloudData = snapshot.data() as TeacherWorkspaceData;
          // Update local cache
          try {
            localStorage.setItem(cacheKey, JSON.stringify(cloudData));
          } catch (e) {
            console.warn('Failed to update local cache:', e);
          }
          return cloudData;
        }
      } catch (error: any) {
        console.warn('[CloudStorage] Firestore read error, checking local cache:', error);
        if (
          error?.code === 'permission-denied' ||
          error?.message?.includes('permission')
        ) {
          try {
            handleFirestoreError(error, OperationType.GET, path);
          } catch (thrownErr) {
            console.warn('[CloudStorage] Diagnostic error report:', thrownErr);
          }
        }
      }
    }

    // 2. Fallback to email-isolated local cache
    try {
      const localCached = localStorage.getItem(cacheKey);
      if (localCached) {
        return JSON.parse(localCached) as TeacherWorkspaceData;
      }
    } catch (e) {
      console.warn('Failed to parse cached workspace:', e);
    }

    return null;
  },
};
