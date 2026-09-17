ALTER TABLE "users" ADD COLUMN "birth_date" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "professional_id" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "responsible_therapist_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_responsible_therapist_id_users_id_fk" FOREIGN KEY ("responsible_therapist_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;