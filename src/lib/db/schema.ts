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

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id),
  plan: text('plan', { enum: ['free', 'pro_monthly', 'pro_yearly'] }).notNull(),
  status: text('status', { enum: ['active', 'inactive', 'canceled', 'past_due', 'pending'] }).notNull(),
  razorpaySubscriptionId: text('razorpaySubscriptionId'),
  stripeSubscriptionId: text('stripeSubscriptionId'),
  paymentGateway: text('paymentGateway', { enum: ['razorpay', 'stripe'] }),
  currentPeriodStart: timestamp('currentPeriodStart').notNull(),
  currentPeriodEnd: timestamp('currentPeriodEnd').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const usage = pgTable('usage', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id),
  model: text('model').notNull(),
  tokensUsed: integer('tokensUsed').default(0).notNull(),
  periodStart: timestamp('periodStart').notNull(),
  periodEnd: timestamp('periodEnd').notNull(),
});

export const blogExports = pgTable('blog_exports', {
  id: serial('id').primaryKey(),
  chatId: text('chatId').notNull().references(() => chats.id),
  messageId: text('messageId').notNull(),
  userId: text('userId'), // Can be null for guest users
  guestId: text('guestId'), // For tracking guest sessions
  title: text('title').notNull(),
  fileName: text('fileName').notNull(),
  htmlContent: text('htmlContent').notNull(),
  blogData: jsonb('blogData').notNull(), // Store the complete blog data JSON
  modelUsed: text('modelUsed'),
  wordCount: integer('wordCount'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});
