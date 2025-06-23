CREATE TABLE "blog_exports" (
	"id" serial PRIMARY KEY NOT NULL,
	"chatId" text NOT NULL,
	"messageId" text NOT NULL,
	"userId" text,
	"guestId" text,
	"title" text NOT NULL,
	"fileName" text NOT NULL,
	"htmlContent" text NOT NULL,
	"blogData" jsonb NOT NULL,
	"modelUsed" text,
	"wordCount" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blog_exports" ADD CONSTRAINT "blog_exports_chatId_chats_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;