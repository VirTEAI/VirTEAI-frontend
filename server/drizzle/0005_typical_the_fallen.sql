CREATE TABLE "session_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"tag" varchar(60) NOT NULL,
	"time_seconds" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"world_id" varchar(80) NOT NULL,
	"duration_seconds" integer NOT NULL,
	"total_fixation_seconds" integer NOT NULL,
	"fixation_count" integer NOT NULL,
	"avg_fixation_seconds" real NOT NULL,
	"heatmap_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_access_code_id_unique" UNIQUE("access_code_id")
);
--> statement-breakpoint
ALTER TABLE "session_areas" ADD CONSTRAINT "session_areas_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;