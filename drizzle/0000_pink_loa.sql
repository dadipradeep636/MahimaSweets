CREATE TABLE `shop_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`pin_hash` text NOT NULL,
	`salt` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shop_accounts_phone_unique` ON `shop_accounts` (`phone`);--> statement-breakpoint
CREATE TABLE `shop_auth_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `limits_expiry` ON `shop_auth_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `shop_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `shop_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_account` ON `shop_sessions` (`account_id`);--> statement-breakpoint
CREATE INDEX `sessions_expiry` ON `shop_sessions` (`expires_at`);