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

/* Product content edited from /admin: changes to built-in items, and items the owner adds. */
export const productsTable = sqliteTable('shop_products', {
  id:text('id').primaryKey(), custom:integer('custom').notNull().default(0), hidden:integer('hidden').notNull().default(0),
  data:text('data').notNull(), imageId:text('image_id'), createdAt:integer('created_at').notNull(), updatedAt:integer('updated_at').notNull(),
});
/* Product photos uploaded from /admin (already cropped and resized in the browser), stored as base64. */
export const images = sqliteTable('shop_images', {
  id:text('id').primaryKey(), mime:text('mime').notNull(), data:text('data').notNull(), createdAt:integer('created_at').notNull(),
},t=>[index('images_created').on(t.createdAt)]);

/* Pickup orders placed on the website. Prices and totals are calculated on the server. */
export const orders = sqliteTable('shop_orders', {
  id:text('id').primaryKey(), tokenHash:text('token_hash').notNull(), status:text('status').notNull(),
  name:text('name').notNull(), phone:text('phone').notNull(), pickupAt:integer('pickup_at').notNull(),
  total:integer('total').notNull(), payNow:integer('pay_now').notNull(), paymentRef:text('payment_ref'),
  refund:text('refund'), data:text('data').notNull(), createdAt:integer('created_at').notNull(), updatedAt:integer('updated_at').notNull(),
},t=>[index('orders_created').on(t.createdAt),index('orders_status').on(t.status),index('orders_pickup').on(t.pickupAt)]);
