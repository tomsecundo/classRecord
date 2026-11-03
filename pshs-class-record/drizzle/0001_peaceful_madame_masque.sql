CREATE TABLE `online_workspace_chunks` (
	`user_id` text NOT NULL,
	`slot` integer NOT NULL,
	`payload` text NOT NULL,
	PRIMARY KEY(`user_id`, `slot`)
);
--> statement-breakpoint
CREATE TABLE `online_workspaces` (
	`user_id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
