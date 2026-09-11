import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

// Cloud SQL schema for PostgreSQL
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cloudClasses = pgTable('cloud_classes', {
  id: serial('id').primaryKey(),
  classId: text('class_id').notNull().unique(),
  userUid: text('user_uid').notNull(),
  namaKelas: text('nama_kelas').notNull(),
  mataPelajaran: text('mata_pelajaran').notNull(),
  kkm: integer('kkm').default(75),
  totalStudents: integer('total_students').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cloudActivityLogs = pgTable('cloud_activity_logs', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
