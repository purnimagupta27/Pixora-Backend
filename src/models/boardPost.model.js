import { pgTable, uuid } from "drizzle-orm/pg-core";
import { boardsTable } from "./boards.model.js";
import { postsTable } from "./posts.model.js";

export const boardPostTable = pgTable("boardPost", {
    id: uuid().primaryKey().defaultRandom(),
    boardId: uuid().notNull().references(() => boardsTable.id, {
        onDelete: "cascade"
    }),
    postId: uuid().notNull().references(() => postsTable.id, {
        onDelete: "cascade"
    })
})