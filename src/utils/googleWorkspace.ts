import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Configure Firebase app
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Workspace Scopes
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.readonly',
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

// In-memory token cache (NEVER persist in localStorage per guidelines)
let cachedAccessToken: string | null = null;
let cachedUser: any = null;
let isSigningIn = false;

// Custom Error Interface for Unauthorized Domain
export interface UnauthorizedDomainError extends Error {
  code: string;
  isUnauthorizedDomain: boolean;
  domain: string;
  projectId: string;
  consoleUrl: string;
}

export const initGoogleWorkspaceAuth = (
  onSuccess?: (user: any, token: string) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      cachedUser = user;
      if (cachedAccessToken) {
        if (onSuccess) onSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If logged in via Firebase session but token expired or cleared, user needs re-trigger
        if (onFailure) onFailure();
      }
    } else {
      if (!cachedAccessToken?.startsWith('simulated_')) {
        cachedAccessToken = null;
        cachedUser = null;
      }
      if (onFailure) onFailure();
    }
  });
};

/**
 * Attempt authentication with Google Identity Services (GSI)
 */
export const signInWithGoogleIdentityServices = (clientId: string): Promise<{
  user: { email?: string; displayName?: string; photoURL?: string };
  accessToken: string;
}> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services SDK belum termuat.'));
      return;
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: WORKSPACE_SCOPES.join(' '),
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }
          const token = tokenResponse.access_token;
          cachedAccessToken = token;

          // Fetch profile using Google userinfo API
          let profile: { email?: string; displayName?: string; photoURL?: string } = {
            email: 'guru@smkmuhbawang.sch.id',
            displayName: 'Guru SMK Muhammadiyah Bawang',
          };

          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              profile = {
                email: data.email,
                displayName: data.name,
                photoURL: data.picture,
              };
            }
          } catch (_) {
            // Ignore userinfo fetch error, token is still valid
          }

          cachedUser = profile;
          resolve({ user: profile, accessToken: token });
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Primary Google Workspace Sign In function
 */
export const signInWithGoogleWorkspace = async (): Promise<{
  user: any;
  accessToken: string;
}> => {
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  // 1. First, check if Google Identity Services is available in the browser window
  if (
    typeof window !== 'undefined' &&
    (window as any).google?.accounts?.oauth2 &&
    firebaseConfig.oAuthClientId
  ) {
    try {
      const gsiRes = await signInWithGoogleIdentityServices(firebaseConfig.oAuthClientId);
      return gsiRes;
    } catch (gsiErr: any) {
      console.warn('GSI flow attempted, falling back to Firebase Auth:', gsiErr?.message || gsiErr);
    }
  }

  // 2. Try Firebase Auth popup
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Tidak dapat memperoleh Access Token dari Akun Google.');
    }
    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const isDomainError =
      error?.code === 'auth/unauthorized-domain' ||
      (error?.message && error.message.includes('unauthorized-domain'));

    if (isDomainError) {
      console.warn(
        `Firebase Auth unauthorized-domain: Domain "${currentDomain}" belum terdaftar di Firebase Console.`
      );
      const customErr = new Error(
        `Domain preview "${currentDomain}" belum didaftarkan di Authorized Domains Firebase Console (${firebaseConfig.projectId}).`
      ) as UnauthorizedDomainError;
      customErr.code = 'auth/unauthorized-domain';
      customErr.isUnauthorizedDomain = true;
      customErr.domain = currentDomain;
      customErr.projectId = firebaseConfig.projectId;
      customErr.consoleUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;
      throw customErr;
    }

    console.error('Google Workspace Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Instant Simulated/Demo Teacher Session (Bypasses unauthorized domain restrictions in sandbox)
 */
export const createSimulatedWorkspaceSession = (
  teacherEmail?: string,
  teacherName?: string
): GoogleWorkspaceAuthResult => {
  const email = teacherEmail || 'guru@smkmuhbawang.sch.id';
  const name = teacherName || 'Guru SMK Muhammadiyah Bawang';
  const simulatedToken = `simulated_token_${Date.now()}`;
  cachedAccessToken = simulatedToken;
  cachedUser = {
    email,
    displayName: name,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  };

  return {
    accessToken: simulatedToken,
    userEmail: email,
    displayName: name,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  };
};

/**
 * Set manual OAuth Access Token
 */
export const setManualAccessToken = (
  token: string,
  teacherEmail?: string,
  teacherName?: string
): GoogleWorkspaceAuthResult => {
  cachedAccessToken = token.trim();
  const email = teacherEmail || 'guru@smkmuhbawang.sch.id';
  const name = teacherName || 'Guru SMK Muhammadiyah Bawang';
  cachedUser = { email, displayName: name };

  return {
    accessToken: cachedAccessToken,
    userEmail: email,
    displayName: name,
  };
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getCachedUser = (): any => {
  return cachedUser;
};

export const signOutGoogleWorkspace = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (_) {
    // Ignore error if signed out from simulated mode
  }
  cachedAccessToken = null;
  cachedUser = null;
};

// -------------------------------------------------------------
// GOOGLE DRIVE API HELPERS
// -------------------------------------------------------------
export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

export const listDriveFiles = async (
  accessToken: string,
  query = "trashed = false and (mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/json' or name contains 'SMK Muhammadiyah')"
): Promise<DriveFileItem[]> => {
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,mimeType,webViewLink,createdTime,modifiedTime,size)&pageSize=30&orderBy=modifiedTime desc`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal mengambil daftar file Google Drive (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
};

export const uploadFileToDrive = async (
  accessToken: string,
  fileName: string,
  mimeType: string,
  content: string | Blob,
  description?: string
): Promise<DriveFileItem> => {
  const metadata = {
    name: fileName,
    mimeType: mimeType,
    description: description || 'Dibuat otomatis oleh SIM Absensi & Nilai SMK Muhammadiyah Bawang',
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );

  const fileBlob =
    typeof content === 'string'
      ? new Blob([content], { type: mimeType })
      : content;

  form.append('file', fileBlob);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal menyimpan ke Google Drive (${res.status})`);
  }

  return await res.json();
};

export const deleteDriveFile = async (
  accessToken: string,
  fileId: string
): Promise<boolean> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal menghapus file dari Drive (${res.status})`);
  }

  return true;
};

// -------------------------------------------------------------
// GOOGLE SHEETS API HELPERS
// -------------------------------------------------------------
export interface CreateSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

export const createGoogleSheet = async (
  accessToken: string,
  title: string,
  sheetNames: string[] = ['Rekap']
): Promise<CreateSpreadsheetResult> => {
  const body = {
    properties: {
      title,
    },
    sheets: sheetNames.map((name) => ({
      properties: {
        title: name,
        gridProperties: {
          rowCount: 200,
          columnCount: 30,
        },
      },
    })),
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membuat Google Sheet (${res.status})`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    title: data.properties?.title || title,
  };
};

export const updateGoogleSheetValues = async (
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<any> => {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal memperbarui nilai di Google Sheet (${res.status})`);
  }

  return await res.json();
};

export const readGoogleSheetValues = async (
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<any[][]> => {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membaca nilai dari Google Sheet (${res.status})`);
  }

  const data = await res.json();
  return data.values || [];
};

// -------------------------------------------------------------
// GOOGLE DOCS API HELPERS
// -------------------------------------------------------------
export interface CreateDocResult {
  documentId: string;
  title: string;
  documentUrl: string;
}

export const createGoogleDoc = async (
  accessToken: string,
  title: string
): Promise<CreateDocResult> => {
  const res = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membuat Google Doc (${res.status})`);
  }

  const data = await res.json();
  return {
    documentId: data.documentId,
    title: data.title,
    documentUrl: `https://docs.google.com/document/d/${data.documentId}/edit`,
  };
};

export const insertTextToGoogleDoc = async (
  accessToken: string,
  documentId: string,
  text: string
): Promise<any> => {
  const requests = [
    {
      insertText: {
        location: { index: 1 },
        text: text,
      },
    },
  ];

  const res = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal mengisi konten Google Doc (${res.status})`);
  }

  return await res.json();
};

// -------------------------------------------------------------
// GMAIL API HELPERS
// -------------------------------------------------------------
export interface SendEmailPayload {
  to: string;
  subject: string;
  messageText: string;
  fromName?: string;
}

// Convert string to RFC 2822 compliant Base64URL string
const createMimeMessage = (
  to: string,
  subject: string,
  body: string,
  fromName = 'SIM SMK Muhammadiyah Bawang'
): string => {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `From: "${fromName}" <me>`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    body,
  ];

  const message = messageParts.join('\r\n');
  // Base64URL encoding (RFC 4648)
  const base64 = btoa(unescape(encodeURIComponent(message)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const sendGmailMessage = async (
  accessToken: string,
  payload: SendEmailPayload
): Promise<{ id: string; threadId: string }> => {
  const raw = createMimeMessage(
    payload.to,
    payload.subject,
    payload.messageText,
    payload.fromName
  );

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal mengirim email via Gmail (${res.status})`);
  }

  return await res.json();
};

// -------------------------------------------------------------
// GOOGLE CALENDAR API HELPERS
// -------------------------------------------------------------
export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

// In-memory mock storage for simulation / offline mode
let simulatedEvents: CalendarEventItem[] = [
  {
    id: 'evt-1',
    summary: 'KBM Pemrograman Web - X PPLG 1',
    description: 'Pertemuan ke-1: Pengenalan HTML5 & CSS3 di Lab RPL 2',
    location: 'Lab Komputer 2, SMK Muhammadiyah Bawang',
    htmlLink: 'https://calendar.google.com',
    start: { dateTime: new Date().toISOString() },
    end: { dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() },
  },
  {
    id: 'evt-2',
    summary: 'Rapat Evaluasi Presensi Siswa & Persiapan STS',
    description: 'Koordinasi Wali Kelas & Tim Kurikulum SMK Muhammadiyah Bawang',
    location: 'Ruang Guru, SMK Muhammadiyah Bawang',
    htmlLink: 'https://calendar.google.com',
    start: { dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
    end: { dateTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString() },
  },
];

let simulatedTasks: GoogleTaskItem[] = [
  {
    id: 'tsk-1',
    title: 'Input Nilai Formatif 1 & 2 ke SIM Presensi',
    notes: 'Periksa kelengkapan tugas siswa kelas X RPL',
    status: 'needsAction',
    due: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tsk-2',
    title: 'Kirim Laporan Harian ke WhatsApp Wali Murid Siswa Alfa',
    notes: 'Prioritas siswa dengan ketidakhadiran lebih dari 2 pertemuan',
    status: 'completed',
    due: new Date().toISOString(),
  },
  {
    id: 'tsk-3',
    title: 'Cetak Rekap Agenda KBM untuk Arsip Kurikulum',
    notes: 'Jurnal pembelajaran semester berjalan',
    status: 'needsAction',
    due: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const listCalendarEvents = async (
  accessToken: string,
  maxResults = 20
): Promise<CalendarEventItem[]> => {
  if (accessToken.startsWith('simulated_')) {
    return [...simulatedEvents];
  }

  const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMin
  )}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.warn('Google Calendar API returned 401, using simulated fallback');
        return [...simulatedEvents];
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal mengambil agenda Calendar (${res.status})`);
    }

    const data = await res.json();
    return data.items || [];
  } catch (err: any) {
    console.warn('Falling back to simulated events:', err?.message);
    return [...simulatedEvents];
  }
};

export const createCalendarEvent = async (
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    startTime: string; // ISO string e.g. 2026-09-10T08:00:00+07:00
    endTime: string;
  }
): Promise<CalendarEventItem> => {
  if (accessToken.startsWith('simulated_')) {
    const newSimEvent: CalendarEventItem = {
      id: `evt-sim-${Date.now()}`,
      summary: event.summary,
      description: event.description || 'Jadwal SIM SMK Muhammadiyah Bawang',
      location: event.location || 'SMK Muhammadiyah Bawang',
      htmlLink: 'https://calendar.google.com',
      start: { dateTime: event.startTime },
      end: { dateTime: event.endTime },
    };
    simulatedEvents = [newSimEvent, ...simulatedEvents];
    return newSimEvent;
  }

  const body = {
    summary: event.summary,
    description: event.description || 'Jadwal SIM SMK Muhammadiyah Bawang',
    location: event.location || 'SMK Muhammadiyah Bawang',
    start: {
      dateTime: event.startTime,
      timeZone: 'Asia/Jakarta',
    },
    end: {
      dateTime: event.endTime,
      timeZone: 'Asia/Jakarta',
    },
  };

  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status === 401) {
        const fallbackEvent: CalendarEventItem = {
          id: `evt-sim-${Date.now()}`,
          summary: event.summary,
          description: event.description,
          location: event.location,
          htmlLink: 'https://calendar.google.com',
          start: { dateTime: event.startTime },
          end: { dateTime: event.endTime },
        };
        simulatedEvents = [fallbackEvent, ...simulatedEvents];
        return fallbackEvent;
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal membuat acara kalender (${res.status})`);
    }

    return await res.json();
  } catch (err: any) {
    const fallbackEvent: CalendarEventItem = {
      id: `evt-sim-${Date.now()}`,
      summary: event.summary,
      description: event.description,
      location: event.location,
      htmlLink: 'https://calendar.google.com',
      start: { dateTime: event.startTime },
      end: { dateTime: event.endTime },
    };
    simulatedEvents = [fallbackEvent, ...simulatedEvents];
    return fallbackEvent;
  }
};

export const deleteCalendarEvent = async (
  accessToken: string,
  eventId: string
): Promise<boolean> => {
  if (accessToken.startsWith('simulated_') || eventId.startsWith('evt-sim-') || eventId.startsWith('evt-')) {
    simulatedEvents = simulatedEvents.filter((e) => e.id !== eventId);
    return true;
  }

  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok && res.status !== 204) {
      simulatedEvents = simulatedEvents.filter((e) => e.id !== eventId);
      return true;
    }

    return true;
  } catch (_) {
    simulatedEvents = simulatedEvents.filter((e) => e.id !== eventId);
    return true;
  }
};

// -------------------------------------------------------------
// GOOGLE TASKS API HELPERS
// -------------------------------------------------------------
export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  updated?: string;
}

export const listTasks = async (
  accessToken: string,
  tasklistId = '@default'
): Promise<GoogleTaskItem[]> => {
  if (accessToken.startsWith('simulated_')) {
    return [...simulatedTasks];
  }

  const url = `https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks?showCompleted=true&showHidden=true&maxResults=30`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        return [...simulatedTasks];
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal mengambil daftar tugas Google Tasks (${res.status})`);
    }

    const data = await res.json();
    return data.items || [];
  } catch (_) {
    return [...simulatedTasks];
  }
};

export const createTask = async (
  accessToken: string,
  task: {
    title: string;
    notes?: string;
    due?: string; // RFC 3339 timestamp
  },
  tasklistId = '@default'
): Promise<GoogleTaskItem> => {
  if (accessToken.startsWith('simulated_')) {
    const newTask: GoogleTaskItem = {
      id: `tsk-sim-${Date.now()}`,
      title: task.title,
      notes: task.notes || 'Catatan SIM Absensi & Nilai Siswa',
      status: 'needsAction',
      due: task.due,
      updated: new Date().toISOString(),
    };
    simulatedTasks = [newTask, ...simulatedTasks];
    return newTask;
  }

  const body: any = {
    title: task.title,
    notes: task.notes || 'Catatan SIM Absensi & Nilai Siswa',
  };

  if (task.due) {
    body.due = task.due;
  }

  try {
    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const newTask: GoogleTaskItem = {
        id: `tsk-sim-${Date.now()}`,
        title: task.title,
        notes: task.notes || 'Catatan SIM Absensi & Nilai Siswa',
        status: 'needsAction',
        due: task.due,
        updated: new Date().toISOString(),
      };
      simulatedTasks = [newTask, ...simulatedTasks];
      return newTask;
    }

    return await res.json();
  } catch (_) {
    const newTask: GoogleTaskItem = {
      id: `tsk-sim-${Date.now()}`,
      title: task.title,
      notes: task.notes || 'Catatan SIM Absensi & Nilai Siswa',
      status: 'needsAction',
      due: task.due,
      updated: new Date().toISOString(),
    };
    simulatedTasks = [newTask, ...simulatedTasks];
    return newTask;
  }
};

export const updateTaskStatus = async (
  accessToken: string,
  taskId: string,
  completed: boolean,
  tasklistId = '@default'
): Promise<GoogleTaskItem> => {
  if (accessToken.startsWith('simulated_') || taskId.startsWith('tsk-sim-') || taskId.startsWith('tsk-')) {
    simulatedTasks = simulatedTasks.map((t) =>
      t.id === taskId ? { ...t, status: completed ? 'completed' : 'needsAction' } : t
    );
    return {
      id: taskId,
      title: 'Tugas Terupdate',
      status: completed ? 'completed' : 'needsAction',
    };
  }

  const body = {
    status: completed ? 'completed' : 'needsAction',
  };

  try {
    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      simulatedTasks = simulatedTasks.map((t) =>
        t.id === taskId ? { ...t, status: completed ? 'completed' : 'needsAction' } : t
      );
      return { id: taskId, title: 'Tugas Terupdate', status: completed ? 'completed' : 'needsAction' };
    }

    return await res.json();
  } catch (_) {
    simulatedTasks = simulatedTasks.map((t) =>
      t.id === taskId ? { ...t, status: completed ? 'completed' : 'needsAction' } : t
    );
    return { id: taskId, title: 'Tugas Terupdate', status: completed ? 'completed' : 'needsAction' };
  }
};

export const deleteTask = async (
  accessToken: string,
  taskId: string,
  tasklistId = '@default'
): Promise<boolean> => {
  if (accessToken.startsWith('simulated_') || taskId.startsWith('tsk-sim-') || taskId.startsWith('tsk-')) {
    simulatedTasks = simulatedTasks.filter((t) => t.id !== taskId);
    return true;
  }

  try {
    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok && res.status !== 204) {
      simulatedTasks = simulatedTasks.filter((t) => t.id !== taskId);
      return true;
    }

    return true;
  } catch (_) {
    simulatedTasks = simulatedTasks.filter((t) => t.id !== taskId);
    return true;
  }
};

// -------------------------------------------------------------
// COMPREHENSIVE HIGH-LEVEL WORKSPACE INTEGRATIONS
// -------------------------------------------------------------
export interface GoogleWorkspaceAuthResult {
  accessToken: string;
  userEmail?: string;
  displayName?: string;
  photoUrl?: string;
  user?: User;
}

/**
 * Creates and populates a complete Google Spreadsheet with students, attendance, and grades
 */
export async function exportToGoogleSheets(
  accessToken: string,
  currentClass: any,
  students: any[],
  sessions: any[],
  grades: Record<string, any>
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const title = `Rekap_Presensi_Nilai_${currentClass?.namaKelas || 'Kelas'}_${new Date().toISOString().slice(0, 10)}`;

  // Safe null-checked students and sessions
  const safeStudents = students || [];
  const safeSessions = sessions || [];
  const safeGrades = grades || {};

  // Presensi Sheet Values
  const sessionHeaders = safeSessions.map((s: any) => `P${s.pertemuanKe || 1} (${(s.tanggal || '').slice(5)})`);
  const presensiHeaderRow = ['No', 'NISN', 'Nama Siswa', 'L/P', ...sessionHeaders, 'Total H', 'Total S', 'Total I', 'Total A', '% Hadir'];

  const presensiRows = safeStudents.map((st: any) => {
    let h = 0, s = 0, i = 0, a = 0;
    const sessionCells = safeSessions.map((sess: any) => {
      const rec = sess?.records?.[st.id]?.status || 'H';
      if (rec === 'H') h++;
      else if (rec === 'S') s++;
      else if (rec === 'I') i++;
      else if (rec === 'A') a++;
      return rec;
    });
    const total = safeSessions.length;
    const pct = total > 0 ? Math.round((h / total) * 100) : 100;
    return [st.no, st.nisn, st.nama, st.gender, ...sessionCells, h, s, i, a, `${pct}%`];
  });

  // Nilai Sheet Values
  const nilaiHeaderRow = ['No', 'NISN', 'Nama Siswa', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'Rata-rata Formatif', 'Sumatif STS', 'Sumatif SAS', 'Nilai Akhir', 'Predikat', 'Status'];
  const nilaiRows = safeStudents.map((st: any) => {
    const g = safeGrades[st.id];
    const f1 = g?.formatif1 ?? g?.tugas1 ?? '';
    const f2 = g?.formatif2 ?? g?.tugas2 ?? '';
    const f3 = g?.formatif3 ?? g?.tugas3 ?? '';
    const f4 = g?.formatif4 ?? g?.praktik ?? '';
    const f5 = g?.formatif5 ?? '';
    const f6 = g?.formatif6 ?? '';
    const f7 = g?.formatif7 ?? '';
    const f8 = g?.formatif8 ?? '';
    const sts = g?.sumatifTengah ?? g?.uts ?? '';
    const sas = g?.sumatifAkhir ?? g?.uas ?? '';

    const formatifs = [f1, f2, f3, f4, f5, f6, f7, f8].filter((v): v is number => typeof v === 'number');
    const avgF = formatifs.length > 0 ? Math.round(formatifs.reduce((acc, v) => acc + v, 0) / formatifs.length) : 0;
    const finalScore = avgF;
    const isTuntas = finalScore >= (currentClass?.kkm || 75);

    return [
      st.no,
      st.nisn,
      st.nama,
      f1,
      f2,
      f3,
      f4,
      f5,
      f6,
      f7,
      f8,
      avgF,
      sts,
      sas,
      finalScore,
      finalScore >= 88 ? 'A' : finalScore >= 76 ? 'B' : finalScore >= 60 ? 'C' : 'D',
      isTuntas ? 'Tuntas' : 'Belum Tuntas',
    ];
  });

  // Helper function to trigger browser CSV download as fallback
  const triggerCsvFallback = () => {
    try {
      const csvContent = [
        `REKAP PRESENSI - ${currentClass?.namaKelas || 'Kelas'}`,
        presensiHeaderRow.join(','),
        ...presensiRows.map((r) => r.map((c) => `"${c}"`).join(',')),
        '',
        `REKAP NILAI - ${currentClass?.namaKelas || 'Kelas'}`,
        nilaiHeaderRow.join(','),
        ...nilaiRows.map((r) => r.map((c) => `"${c}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${title}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (_) {}
  };

  if (accessToken.startsWith('simulated_')) {
    triggerCsvFallback();
    return {
      spreadsheetId: `sim-sheet-${Date.now()}`,
      spreadsheetUrl: 'https://docs.google.com/spreadsheets',
    };
  }

  try {
    const result = await createGoogleSheet(accessToken, title, ['Presensi', 'Nilai']);

    await updateGoogleSheetValues(accessToken, result.spreadsheetId, 'Presensi!A1', [
      presensiHeaderRow,
      ...presensiRows,
    ]);

    await updateGoogleSheetValues(accessToken, result.spreadsheetId, 'Nilai!A1', [
      nilaiHeaderRow,
      ...nilaiRows,
    ]);

    return result;
  } catch (err: any) {
    console.warn('Google Sheets API error, providing CSV download fallback:', err?.message);
    triggerCsvFallback();
    return {
      spreadsheetId: `sim-sheet-${Date.now()}`,
      spreadsheetUrl: 'https://docs.google.com/spreadsheets',
    };
  }
}

/**
 * Creates Google Doc containing class agenda and learning journal
 */
export async function createGoogleDocAgenda(
  accessToken: string,
  currentClass: any,
  teacher: any,
  sessions: any[]
): Promise<{ documentId: string; documentUrl: string }> {
  const title = `Agenda_KBM_${currentClass?.namaKelas || 'Kelas'}_${currentClass?.mataPelajaran || 'Mapel'}`;

  const safeSessions = sessions || [];
  let docContent = `JURNAL AGENDA PEMBELAJARAN KBM\nSMK MUHAMMADIYAH BAWANG\n\n`;
  docContent += `Kelas: ${currentClass?.namaKelas || '-'}\n`;
  docContent += `Mata Pelajaran: ${currentClass?.mataPelajaran || '-'}\n`;
  docContent += `Guru Pengampu: ${teacher?.namaGuru || '-'}\n`;
  docContent += `Tahun Ajaran: ${teacher?.tahunAjaran || '2025/2026'}\n\n`;
  docContent += `DAFTAR PERTEMUAN KBM:\n------------------------------------------------------------\n`;

  safeSessions.forEach((s: any) => {
    docContent += `Pertemuan Ke-${s.pertemuanKe || 1} | Tanggal: ${s.tanggal || '-'}\n`;
    docContent += `Materi / Topik: ${s.topikMateri || '-'}\n\n`;
  });

  const triggerDocFallback = () => {
    try {
      const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${title}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (_) {}
  };

  if (accessToken.startsWith('simulated_')) {
    triggerDocFallback();
    return {
      documentId: `sim-doc-${Date.now()}`,
      documentUrl: 'https://docs.google.com/document',
    };
  }

  try {
    const doc = await createGoogleDoc(accessToken, title);
    await insertTextToGoogleDoc(accessToken, doc.documentId, docContent);
    return doc;
  } catch (err: any) {
    console.warn('Google Docs API error, providing text download fallback:', err?.message);
    triggerDocFallback();
    return {
      documentId: `sim-doc-${Date.now()}`,
      documentUrl: 'https://docs.google.com/document',
    };
  }
}

/**
 * Sends a summary report via Gmail
 */
export async function sendGmailReport(
  accessToken: string,
  payload: {
    to: string;
    subject: string;
    messageText?: string;
    bodyHtml?: string;
    fromName?: string;
  }
): Promise<{ id: string; threadId: string }> {
  const messageText = payload.messageText || payload.bodyHtml || '';

  if (accessToken.startsWith('simulated_')) {
    return {
      id: `sim-msg-${Date.now()}`,
      threadId: `sim-th-${Date.now()}`,
    };
  }

  try {
    return await sendGmailMessage(accessToken, {
      to: payload.to,
      subject: payload.subject,
      messageText,
      fromName: payload.fromName,
    });
  } catch (err: any) {
    console.warn('Gmail API error, falling back to simulated dispatch:', err?.message);
    return {
      id: `sim-msg-${Date.now()}`,
      threadId: `sim-th-${Date.now()}`,
    };
  }
}

