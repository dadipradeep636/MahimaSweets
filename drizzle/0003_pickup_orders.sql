CREATE TABLE `shop_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`status` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`pickup_at` integer NOT NULL,
	`total` integer NOT NULL,
	`pay_now` integer NOT NULL,
	`payment_ref` text,
	`refund` text,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `orders_created` ON `shop_orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `orders_status` ON `shop_orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_pickup` ON `shop_orders` (`pickup_at`);