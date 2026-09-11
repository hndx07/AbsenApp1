import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  TeacherProfile,
  ClassRoom,
  Student,
  AttendanceSession,
  StudentGrade,
  TeacherWorkspaceData,
} from '../types';

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


    // 1. Save to email-isolated local cache immediately
    try {
      const cacheKey = this.getEmailCacheKey(email || teacherUid);
      localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to cache workspace locally:', e);
    }

    // 2. Persist to Firestore cloud database so data is accessible across devices
    if (!teacherUid) {
      console.warn('No teacher UID provided for cloud storage save');
      return false;
    }

    try {
      const docRef = doc(db, 'teacher_workspaces', teacherUid);
      await setDoc(docRef, payload, { merge: true });
      console.log(`[CloudStorage] Successfully saved workspace for ${email} to Firestore`);
      return true;
    } catch (error) {
      console.error('[CloudStorage] Error saving workspace to Firestore:', error);
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

    // 1. Try reading from Firestore (cross-device truth)
    if (teacherUid) {
      try {
        const docRef = doc(db, 'teacher_workspaces', teacherUid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const cloudData = snapshot.data() as TeacherWorkspaceData;
          console.log(`[CloudStorage] Retrieved cloud workspace for ${email} from Firestore`);
          // Update local cache
          try {
            localStorage.setItem(cacheKey, JSON.stringify(cloudData));
          } catch (e) {
            console.warn('Failed to update local cache:', e);
          }
          return cloudData;
        } else {
          console.log(`[CloudStorage] No existing cloud workspace document for ${email} yet.`);
        }
      } catch (error) {
        console.warn('[CloudStorage] Firestore read error, checking local cache:', error);
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
