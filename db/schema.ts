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
