import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDb } from './src/db/index.ts';
import { cloudClasses, cloudActivityLogs } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      cloudSqlConfigured: Boolean(process.env.SQL_HOST),
      timestamp: new Date().toISOString(),
    });
  });

  // Cloud SQL instance status
  app.get('/api/cloudsql/status', (req, res) => {
    const isConfigured = Boolean(process.env.SQL_HOST);
    res.json({
      configured: isConfigured,
      host: process.env.SQL_HOST ? '***.***.***.***' : null,
      database: process.env.SQL_DB_NAME || 'postgres',
      message: isConfigured
        ? 'Cloud SQL terhubung aktif'
        : 'Cloud SQL instance ai-studio-09636d11 telah di-provision di asia-southeast1. Menunggu konfigurasi credential lingkungan.',
    });
  });

  // Cloud SQL API - Sync Class
  app.post('/api/cloudsql/sync-class', requireAuth, async (req: AuthRequest, res) => {
    try {
      const db = getDb();
      if (!db) {
        return res.status(503).json({
          error: 'Cloud SQL database belum dikonfigurasi pada environment runtime ini',
        });
      }

      const userUid = req.user?.uid || 'anonymous';
      const { classId, namaKelas, mataPelajaran, kkm, totalStudents } = req.body;

      if (!classId || !namaKelas || !mataPelajaran) {
        return res.status(400).json({ error: 'Data kelas tidak lengkap' });
      }

      await db
        .insert(cloudClasses)
        .values({
          classId,
          userUid,
          namaKelas,
          mataPelajaran,
          kkm: kkm || 75,
          totalStudents: totalStudents || 0,
        })
        .onConflictDoUpdate({
          target: cloudClasses.classId,
          set: {
            namaKelas,
            mataPelajaran,
            kkm: kkm || 75,
            totalStudents: totalStudents || 0,
          },
        });

      await db.insert(cloudActivityLogs).values({
        userUid,
        action: 'SYNC_CLASS',
        details: `Sinkronisasi kelas ${namaKelas} (${classId})`,
      });

      return res.json({ success: true, message: 'Kelas berhasil disinkronkan ke Cloud SQL' });
    } catch (error: any) {
      console.error('Error syncing class to Cloud SQL:', error);
      return res.status(500).json({ error: error.message || 'Internal database error' });
    }
  });

  // Cloud SQL API - List Classes
  app.get('/api/cloudsql/classes', requireAuth, async (req: AuthRequest, res) => {
    try {
      const db = getDb();
      if (!db) {
        return res.status(503).json({
          error: 'Cloud SQL database belum dikonfigurasi',
        });
      }

      const userUid = req.user?.uid;
      if (!userUid) {
        return res.status(401).json({ error: 'User tidak teridentifikasi' });
      }

      const results = await db
        .select()
        .from(cloudClasses)
        .where(eq(cloudClasses.userUid, userUid));

      return res.json({ classes: results });
    } catch (error: any) {
      console.error('Error querying classes from Cloud SQL:', error);
      return res.status(500).json({ error: error.message || 'Internal database error' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
