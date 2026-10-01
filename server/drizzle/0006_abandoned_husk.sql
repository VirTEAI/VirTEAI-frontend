CREATE TYPE "public"."world_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "world_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" varchar(80) NOT NULL,
	"author_id" uuid NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "status" "world_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "world_comments" ADD CONSTRAINT "world_comments_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "world_comments" ADD CONSTRAINT "world_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;