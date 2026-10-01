CREATE TYPE "public"."registration_request_status" AS ENUM('pendente', 'aprovado', 'rejeitado');--> statement-breakpoint
CREATE TABLE "registration_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'terapeuta' NOT NULL,
	"status" "registration_request_status" DEFAULT 'pendente' NOT NULL,
	"decided_by_id" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;