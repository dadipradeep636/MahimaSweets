CREATE TABLE `shop_images` (
	`id` text PRIMARY KEY NOT NULL,
	`mime` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `images_created` ON `shop_images` (`created_at`);--> statement-breakpoint
CREATE TABLE `shop_products` (
	`id` text PRIMARY KEY NOT NULL,
	`custom` integer DEFAULT 0 NOT NULL,
	`hidden` integer DEFAULT 0 NOT NULL,
	`data` text NOT NULL,
	`image_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
