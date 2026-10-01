ALTER TABLE "access_codes" DROP CONSTRAINT "access_codes_world_id_worlds_id_fk";
--> statement-breakpoint
ALTER TABLE "access_codes" ADD CONSTRAINT "access_codes_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;