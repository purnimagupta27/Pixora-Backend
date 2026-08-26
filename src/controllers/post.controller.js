import ApiError from "../utils/api-error.js"
import { createPostValidateSchema, updatePostValidateSchema } from "../dto/post.dto.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import db from "../index.js"
import { postsTable } from '../models/posts.model.js'
import ApiResponse from "../utils/api-response.js"
import { eq, and, desc, count, countDistinct, or } from 'drizzle-orm'
import { usersTable } from "../models/users.model.js"
import { validate as isUUID } from 'uuid'
import { likesTable } from "../models/likes.model.js"
import { commentsTable } from "../models/comments.model.js"


const createPost = async (req, res) => {
    const validatedData = createPostValidateSchema.safeParse(req.body)
    const file = req.file

    if (!validatedData.success) {
        return res.status(400).json({
            success: false,
            errors: validatedData.error.issues
        });
    }

    if (!file) {
        throw ApiError.badRequest("Please send a file")
    }

    const { caption, isPrivate } = validatedData.data

    const uploadedImage = await uploadOnCloudinary(file.path)

    if (!uploadedImage) {
        throw ApiError.internalServerError("Image upload failed");
    }

    const userPost = await db.insert(postsTable).values({
        caption,
        url: uploadedImage.secure_url,
        isPrivate,
        userId: req.user.id
    }).returning()

    res.json(ApiResponse.created("Post created successfully", userPost))
}

//not usable
const getMyPosts = async (req, res) => {
    const limit = Number(req.query.limit) || 5
    const page = Number(req.query.page) || 1
    const offset = (page - 1) * limit

    const posts = await db.select({
        id: postsTable.id,
        url: postsTable.url,
        caption: postsTable.caption,
        isPrivate: postsTable.isPrivate,

        user: {
            userId: usersTable.id,
            username: usersTable.username
        }
    })
        .from(postsTable)
        .innerJoin(usersTable, eq(postsTable.userId, usersTable.id))
        .where(eq(postsTable.userId, req.user.id))
        .orderBy(desc(postsTable.createdAt))
        .limit(limit)
        .offset(offset)

    if (posts.length === 0) {
        return res.status(200).json({ message: "This user haven't created any post" })
    }

    res.json(ApiResponse.ok("Posts fetched", {
        data: {
            posts,
            page
        }
    }))
}

//not usable
const getMyPostById = async (req, res) => {
    const { id } = req.params

    if (!isUUID(id)) {
        throw ApiError.badRequest("Invalid id")
    }

    const [post] = await db.select({
        id: postsTable.id,
        url: postsTable.url,
        caption: postsTable.caption,
        isPrivate: postsTable.isPrivate,

        user: {
            userId: usersTable.id,
            username: usersTable.username
        },

        likes: {
            likesCount: countDistinct(likesTable.id)
        },

        comments: {
            commentsCount: countDistinct(commentsTable.id)
        }
    })
        .from(postsTable)
        .innerJoin(usersTable, eq(postsTable.userId, usersTable.id))
        .leftJoin(likesTable, eq(postsTable.id, likesTable.postId))
        .leftJoin(commentsTable, eq(postsTable.id, commentsTable.postId))
        .where(and(                                 //when we want to add multiple checks
            eq(postsTable.userId, req.user.id),
            eq(postsTable.id, id)
        ))
        .groupBy(
            postsTable.id,
            postsTable.url,
            postsTable.caption,
            postsTable.isPrivate,
            usersTable.id,
            usersTable.username
        );

    if (!post) {
        throw ApiError.notFound(`Post with this id ${id} does not exist`)
    }

    res.json(ApiResponse.ok("Post fetched", post))
}


const editMyPostById = async (req, res) => {
    const { id } = req.params
    const validatedData = updatePostValidateSchema.safeParse(req.body)

    if (!isUUID(id)) {
        throw ApiError.badRequest("Invalid id")
    }

    if (!validatedData.success) {
        return res.status(400).json({
            success: false,
            errors: validatedData.error.issues
        });
    }

    const { caption, isPrivate } = validatedData.data

    const updatedData = {}

    if (caption !== undefined) {
        updatedData.caption = caption
    }

    if (isPrivate !== undefined) {
        updatedData.isPrivate = isPrivate
    }

    const [updatedPost] = await db.update(postsTable)
        .set(updatedData)
        .where(and(
            eq(postsTable.userId, req.user.id),
            eq(postsTable.id, id))
        )
        .returning()

    if (!updatedPost) {
        throw ApiError.notFound("Post not found")
    }

    res.json(ApiResponse.ok("Post updated", updatedPost))
}


const deleteMyPostById = async (req, res) => {
    const { id } = req.params

    if (!isUUID(id)) {
        throw ApiError.badRequest("Invalid id")
    }

    const [post] = await db.delete(postsTable)
        .where(and(
            eq(postsTable.userId, req.user.id),
            eq(postsTable.id, id)
        )).returning()

    if (!post) {
        throw ApiError.notFound("Post not found")
    }

    res.json(ApiResponse.ok("Post Deleted"))
}


const getAllPosts = async (req, res) => {
    const limit = Number(req.query.limit) || 5
    const page = Number(req.query.page) || 1
    const offset = (page - 1) * limit;

    const posts = await db.select({
        id: postsTable.id,
        url: postsTable.url,
        caption: postsTable.caption
    })
        .from(postsTable)
        .where(eq(postsTable.isPrivate, false))
        .orderBy(desc(postsTable.createdAt))
        .limit(limit)
        .offset(offset)

    res.json(ApiResponse.ok("Posts fetched", {
        data: {
            posts,
            page
        }
    }))
}

const getPostById = async (req, res) => {
    const { id } = req.params

    if (!isUUID(id)) {
        throw ApiError.badRequest("Invalid id")
    }

    const [post] = await db.select({
        id: postsTable.id,
        url: postsTable.url,
        caption: postsTable.caption,
        isPrivate: postsTable.isPrivate,

        user: {
            userId: usersTable.id,
            username: usersTable.username
        },

        likes: {
            likesCount: countDistinct(likesTable.id),
        },

        comments: {
            commentsCount: countDistinct(commentsTable.id)
        }
    })
        .from(postsTable)
        .innerJoin(usersTable, eq(postsTable.userId, usersTable.id))
        .leftJoin(likesTable, eq(postsTable.id, likesTable.postId))
        .leftJoin(commentsTable, eq(postsTable.id, commentsTable.postId))
        .where(
            and(
                eq(postsTable.id, id),
                or(
                    eq(postsTable.isPrivate, false),
                    eq(postsTable.userId, req.user.id)
                )
            )
        )
        .groupBy(
            postsTable.id,
            postsTable.url,
            postsTable.caption,
            postsTable.isPrivate,
            usersTable.id,
            usersTable.username
        );

    if (!post) {
        throw ApiError.notFound("Post not found")
    }

    res.json(ApiResponse.ok("Post fetched", post))

}

//not usable
const getUsersPost = async (req, res) => {
    const { userId } = req.params
    const limit = Number(req.query.limit) || 5
    const page = Number(req.query.page) || 1
    const offset = (page - 1) * limit

    if (!isUUID(userId)) {
        throw ApiError.badRequest("Invalid id")
    }

    const [user] = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))

    if (!user) {
        throw ApiError.notFound("User not found")
    }

    const usersPost = await db.select({
        id: postsTable.id,
        url: postsTable.url,
        caption: postsTable.caption,

        user: {
            userId: usersTable.id,
            username: usersTable.username
        }
    })
        .from(postsTable)
        .innerJoin(usersTable, eq(postsTable.userId, usersTable.id))
        .where(and(
            eq(postsTable.userId, userId),
            eq(postsTable.isPrivate, false)
        ))
        .orderBy(desc(postsTable.createdAt))
        .limit(limit)
        .offset(offset)

    if (usersPost.length === 0) {
        return res.status(200).json({
            success: true,
            message: "User has not posted anything"
        })
    }

    res.json(ApiResponse.ok("User's posts fetched", usersPost))
}

export {
    createPost,
    getMyPosts,
    getMyPostById,
    editMyPostById,
    deleteMyPostById,
    getAllPosts,
    getPostById,
    getUsersPost
}