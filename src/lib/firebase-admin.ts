import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let adminAuthInstance: Auth | null = null;

export const getAdminAuth = (): Auth | null => {
  try {
    if (!adminAuthInstance) {
      if (!getApps().length) {
        initializeApp({
          projectId: firebaseConfig.projectId,
        });
      }
      adminAuthInstance = getAuth();
    }
    return adminAuthInstance;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin Auth:', error);
    return null;
  }
};
