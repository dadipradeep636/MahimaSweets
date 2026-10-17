CREATE TABLE `shop_admin_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_sessions_expiry` ON `shop_admin_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `shop_items` (
	`id` text PRIMARY KEY NOT NULL,
	`sold_out` integer DEFAULT 0 NOT NULL,
	`price` integer,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shop_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
