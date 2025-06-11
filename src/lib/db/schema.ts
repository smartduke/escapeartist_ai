import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable, int } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Supabase user ID
  email: text('email').notNull(),
  name: text('name'),
  createdAt: text('createdAt').notNull(),
  isGuest: int('isGuest').default(0), // 0 = false, 1 = true
});

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey(),
  content: text('content').notNull(),
  chatId: text('chatId').notNull(),
  messageId: text('messageId').notNull(),
  role: text('type', { enum: ['assistant', 'user'] }),
  metadata: text('metadata', {
    mode: 'json',
  }),
});

interface File {
  name: string;
  fileId: string;
}

export const chats = sqliteTable('chats', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: text('createdAt').notNull(),
  focusMode: text('focusMode').notNull(),
  userId: text('userId'), // Can be null for guest users, or reference users.id
  guestId: text('guestId'), // For tracking guest sessions
  files: text('files', { mode: 'json' })
    .$type<File[]>()
    .default(sql`'[]'`),
});
