import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const accounts = sqliteTable('shop_accounts', {
  id:text('id').primaryKey(), phone:text('phone').notNull().unique(),
  pinHash:text('pin_hash').notNull(), salt:text('salt').notNull(), createdAt:integer('created_at').notNull(),
});
export const sessions = sqliteTable('shop_sessions', {
  tokenHash:text('token_hash').primaryKey(), accountId:text('account_id').notNull().references(()=>accounts.id,{onDelete:'cascade'}), expiresAt:integer('expires_at').notNull(),
},t=>[index('sessions_account').on(t.accountId),index('sessions_expiry').on(t.expiresAt)]);
export const limits = sqliteTable('shop_auth_limits', {
  key:text('key').primaryKey(), attempts:integer('attempts').notNull(), expiresAt:integer('expires_at').notNull(),
},t=>[index('limits_expiry').on(t.expiresAt)]);

/* Owner controls: per-item availability and price changes, editable from /admin. */
export const items = sqliteTable('shop_items', {
  id:text('id').primaryKey(), soldOut:integer('sold_out').notNull().default(0), price:integer('price'), updatedAt:integer('updated_at').notNull(),
});
/* Simple key/value settings, e.g. the notice banner. */
export const settings = sqliteTable('shop_settings', {
  key:text('key').primaryKey(), value:text('value').notNull(), updatedAt:integer('updated_at').notNull(),
});
/* Owner sign-in sessions, kept apart from customer sessions. */
export const adminSessions = sqliteTable('shop_admin_sessions', {
  tokenHash:text('token_hash').primaryKey(), expiresAt:integer('expires_at').notNull(),
},t=>[index('admin_sessions_expiry').on(t.expiresAt)]);
