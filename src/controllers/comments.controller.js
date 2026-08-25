import { validate as isUUID } from 'uuid'
import ApiError from '../utils/api-error.js'
import db from '../index.js'
import { commentsTable } from '../models/comments.model.js'
import { postsTable } from '../models/posts.model.js'
import { usersTable } from '../models/users.model.js'
import { eq, and } from 'drizzle-orm'
import ApiResponse from '../utils/api-response.js'

const createComment = async (req, res) => {
    const { message } = req.body
    const { postId } = req.params

    if (!isUUID(postId)) {
        throw ApiError.badRequest("Invalid id")
    }

    const [post] = await db
        .select()
        .from(postsTable)
        .where(and(
            eq(postsTable.id, postId),
            eq(postsTable.isPrivate, false)
        ))

    if (!post) {
        throw ApiError.notFound("Post not found")
    }

    if (!message || message.trim() === "") {
        throw ApiError.badRequest("Message is required to comment")
    }

    const [comment] = await db
        .insert(commentsTable)
        .values({
            message,
            userId: req.user.id,
            postId
        }).returning()

    const [user] = await db
        .select({ username: usersTable.username })
        .from(usersTable)
        .where(eq(usersTable.id, req.user.id));

    res.json(ApiResponse.created("Comment created", {
        ...comment,
        username: user?.username
    }))
}

const deleteComment = async (req, res) => {
    const { commentId } = req.params

    if (!isUUID(commentId)) {
        throw ApiError.badRequest("Invalid id")
    }

    const [comment] = await db
        .select()
        .from(commentsTable)
        .where(and(
            eq(commentsTable.id, commentId),
            eq(commentsTable.userId, req.user.id)
        ))

    if (!comment) {
        throw ApiError.notFound("Comment not found")
    }

    await db.delete(commentsTable)
        .where(eq(commentsTable.id, commentId))
        .returning()

    res.json(ApiResponse.ok("Comment deleted"))
}

const getComments = async (req, res) => {
    const { postId } = req.params

    if (!isUUID(postId)) {
        throw ApiError.badRequest("Invalid id")
    }

    const [post] = await db
        .select()
        .from(postsTable)
        .where(and(
            eq(postsTable.id, postId),
            eq(postsTable.isPrivate, false)
        ))

    if (!post) {
        throw ApiError.notFound("Post not found")
    }

    const comments = await db.select({
        id: commentsTable.id,
        message: commentsTable.message,
        username: usersTable.username,
        userId: usersTable.id
    })
        .from(commentsTable)
        .where(eq(commentsTable.postId, postId))
        .innerJoin(usersTable,
            eq(commentsTable.userId, usersTable.id)
        )

    res.json(ApiResponse.ok("Comments", comments))
}

export {
    createComment,
    deleteComment,
    getComments
}