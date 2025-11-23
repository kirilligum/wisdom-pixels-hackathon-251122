CREATE TABLE `brands` (
	`brand_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`domain` text NOT NULL,
	`description` text,
	`url_slug` text NOT NULL,
	`content_sources` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brands_url_slug_unique` ON `brands` (`url_slug`);--> statement-breakpoint
CREATE TABLE `cards` (
	`card_id` text PRIMARY KEY NOT NULL,
	`brand_id` text NOT NULL,
	`influencer_id` text NOT NULL,
	`persona_id` text,
	`environment_id` text,
	`query` text NOT NULL,
	`response` text NOT NULL,
	`image_url` text NOT NULL,
	`image_brief` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`share_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`published_at` integer,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`brand_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`influencer_id`) REFERENCES `influencers`(`influencer_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`persona_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`environment_id`) REFERENCES `environments`(`environment_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `environments` (
	`environment_id` text PRIMARY KEY NOT NULL,
	`brand_id` text NOT NULL,
	`label` text NOT NULL,
	`description` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`brand_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `influencers` (
	`influencer_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`bio` text NOT NULL,
	`domain` text NOT NULL,
	`image_url` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `personas` (
	`persona_id` text PRIMARY KEY NOT NULL,
	`brand_id` text NOT NULL,
	`label` text NOT NULL,
	`description` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`brand_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workflow_runs` (
	`run_id` text PRIMARY KEY NOT NULL,
	`workflow_name` text NOT NULL,
	`brand_id` text,
	`status` text NOT NULL,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`completed_at` integer,
	`duration_ms` integer,
	`input` text,
	`output` text,
	`error` text,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`brand_id`) ON UPDATE no action ON DELETE cascade
);
