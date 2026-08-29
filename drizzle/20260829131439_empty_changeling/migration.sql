CREATE TABLE "BoardPost" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"boardId" uuid NOT NULL,
	"postId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "BoardPost" ADD CONSTRAINT "BoardPost_boardId_boards_id_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "BoardPost" ADD CONSTRAINT "BoardPost_postId_posts_id_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE;