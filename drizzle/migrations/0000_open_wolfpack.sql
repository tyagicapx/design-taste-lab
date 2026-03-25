CREATE TABLE `api_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`module` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`cost_estimate` real,
	`duration_ms` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `probe_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`probe_id` text NOT NULL,
	`session_id` text NOT NULL,
	`rating_type` text NOT NULL,
	`notes` text,
	`is_escape_hatch` integer DEFAULT false,
	`escape_feedback` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`probe_id`) REFERENCES `probes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `probes` (
	`id` text PRIMARY KEY NOT NULL,
	`round_id` text NOT NULL,
	`session_id` text NOT NULL,
	`label` text NOT NULL,
	`description` text NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`probe_type` text NOT NULL,
	`generation_prompt` text,
	`design_tokens` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `references` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`filename` text NOT NULL,
	`path` text NOT NULL,
	`analysis` text,
	`annotations` text,
	`is_outlier` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`round_number` integer NOT NULL,
	`questionnaire` text,
	`answers` text,
	`preference_deltas` text,
	`refinement_notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'uploading' NOT NULL,
	`taste_map` text,
	`contradictions` text,
	`confidence_scores` text,
	`critic_output` text,
	`final_markdown` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
