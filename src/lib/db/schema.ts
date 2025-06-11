import { sql } from 'drizzle-orm';
import { text, integer, pgTable, boolean, jsonb, timestamp, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Supabase user ID
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  isGuest: boolean('isGuest').default(false),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  chatId: text('chatId').notNull(),
  messageId: text('messageId').notNull(),
  role: text('role', { enum: ['assistant', 'user'] }),
  metadata: jsonb('metadata'),
});

interface File {
  name: string;
  fileId: string;
}

export const chats = pgTable('chats', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  focusMode: text('focusMode').notNull(),
  userId: text('userId'), // Can be null for guest users, or reference users.id
  guestId: text('guestId'), // For tracking guest sessions
  files: jsonb('files')
    .$type<File[]>()
    .default([]),
});
