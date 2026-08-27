import { validate as isUUID } from 'uuid'
import db from "../index.js"
import { likesTable } from '../models/likes.model.js'
import { postsTable } from '../models/posts.model.js'
import ApiError from '../utils/api-error.js'
import ApiResponse from '../utils/api-response.js'
import { and, eq, sql } from 'drizzle-orm'

const createLike = async (req, res) => {
    const { postId } = req.params

    if (!isUUID(postId)) {
        throw ApiError.badRequest("Invalid id")
    }

    const [post] = await db
        .select({ id: postsTable.id })
        .from(postsTable)
        .where(and(
            eq(postsTable.id, postId),
            eq(postsTable.isPrivate, false)
        ))

    if (!post) {
        throw ApiError.notFound("Post not found")
    }

    const inserted = await db
        .insert(likesTable)
        .values({ userId: req.user.id, postId })
        .onConflictDoNothing({ target: [likesTable.userId, likesTable.postId] })
        .returning()

    if (inserted.length === 0) {
        throw ApiError.conflict("You have already liked this post")
    }

    const count = await getLikeCount(postId)

    res.json(ApiResponse.ok("Liked!", { liked: true, likeId: inserted[0].id, count }))
}

const removeLike = async (req, res) => {
    const { postId } = req.params

    if (!isUUID(postId)) {
        throw ApiError.badRequest("Invalid id")
    }

    const deleted = await db.delete(likesTable)
        .where(and(
            eq(likesTable.userId, req.user.id),
            eq(likesTable.postId, postId)
        ))
        .returning()

    if (deleted.length === 0) {
        throw ApiError.notFound("You have not liked this post")
    }

    const count = await getLikeCount(postId)

    res.json(ApiResponse.ok("Post disliked!", { liked: false, likeId: null, count }))
}

async function getLikeCount(postId) {
    const [{ count }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(likesTable)
        .where(eq(likesTable.postId, postId))
    return count
}

export {
    createLike,
    removeLike
}