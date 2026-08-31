import db from "../index.js"
import { boardPostTable } from "../models/boardPost.model.js"
import { boardsTable } from "../models/boards.model.js"
import { postsTable } from "../models/posts.model.js"
import ApiError from "../utils/api-error.js"
import ApiResponse from "../utils/api-response.js"
import { eq, and } from "drizzle-orm"
import { validate as isUUID } from 'uuid'

const createBoard = async (req, res) => {
    const { name } = req.body

    if (!name || name.trim() === "") {
        throw ApiError.badRequest("Name is required")
    }

    const [existingName] = await db
        .select()
        .from(boardsTable)
        .where(and(
            eq(boardsTable.name, name),
            eq(boardsTable.userId, req.user.id)
        ))

    if (existingName) {
        throw ApiError.conflict("Board with this name already exists")
    }

    const board = await db
        .insert(boardsTable)
        .values({
            name,
            userId: req.user.id
        }).returning()

    res.json(ApiResponse.created("Board created", board))
}

const addPostToBoard = async (req, res) => {
    const { boardId, postId } = req.params

    if (!isUUID(boardId) || !isUUID(postId)) {
        throw ApiError.badRequest("Invalid board id or post id")
    }

    const [board] = await db
        .select()
        .from(boardsTable)
        .where(and(
            eq(boardsTable.id, boardId),
            eq(boardsTable.userId, req.user.id)
        ))

    if (!board) {
        throw ApiError.notFound("Board not found")
    }

    const [post] = await db
        .select()
        .from(postsTable)
        .where(and(
            eq(postsTable.id, postId),
        ))

    if (!post) {
        throw ApiError.notFound("Post not found")
    }

    const [alreadyAdded] = await db
    .select()
    .from(boardPostTable)
    .where(and(
        eq(boardPostTable.boardId, boardId),
        eq(boardPostTable.postId, postId)
    ))

    if(alreadyAdded){
        throw ApiError.conflict("This post is already added to this bookmark")
    }

    const [addedPost] = await db
    .insert(boardPostTable)
    .values({
        boardId,
        postId
    }).returning()

    res.json(ApiResponse.created("Post added", addedPost))
}

const removePostFromBoard = async (req, res) => {
    const { boardId, postId } = req.params

    if (!isUUID(boardId) || !isUUID(postId)) {
        throw ApiError.badRequest("Invalid board id or post id")
    }

    const [board] = await db
        .select()
        .from(boardsTable)
        .where(and(
            eq(boardsTable.id, boardId),
            eq(boardsTable.userId, req.user.id)
        ))

    if (!board) {
        throw ApiError.notFound("Board not found")
    }

    const [post] = await db
        .select()
        .from(postsTable)
        .where(and(
            eq(postsTable.id, postId),
        ))

    if (!post) {
        throw ApiError.notFound("Post not found")
    }

    const result = await db
    .delete(boardPostTable)
    .where(and(
        eq(boardPostTable.boardId, boardId),
        eq(boardPostTable.postId, postId)
    )).returning()

    res.json(ApiResponse.ok("Post Removed", result))
}

const getMyBoards = async (req, res) => {
    const boards = await db
        .select({
            id: boardsTable.id,
            name: boardsTable.name
        })
        .from(boardsTable)
        .where(eq(boardsTable.userId, req.user.id))

    if (boards.length === 0) {
        return res.status(200).json({
            message: "No boards created",
            data: boards
        })
    }

    res.json(ApiResponse.ok("Borads fetched", boards))
}

const getPostsFromBoard = async (req, res) => {
    const { boardId } = req.params

    if (!isUUID(boardId)) {
        throw ApiError.badRequest("Invalid id")
    }

    const [board] = await db
        .select()
        .from(boardsTable)
        .where(and(
            eq(boardsTable.id, boardId),
            eq(boardsTable.userId, req.user.id)
        ))

    if (!board) {
        throw ApiError.notFound("Board not found")
    }

    const result = await db
    .select({
        boardPost: boardPostTable,
        board: boardsTable,
        posts: postsTable
    })
    .from(boardPostTable)
    .where(eq(boardPostTable.boardId, boardId))
    .innerJoin(boardsTable, 
        eq(boardPostTable.boardId, boardsTable.id)
    )
    .innerJoin(postsTable,
        eq(boardPostTable.postId, postsTable.id)
    )
    
    const response = {
        boardPost: result[0]?.boardPost,
        board: result[0]?.board,
        posts: result.map((item) => item.posts)
    }

    res.json(ApiResponse.ok("Posts", response))
}

const deleteBoard = async(req, res) => {
    const {boardId} = req.params

    if (!isUUID(boardId)) {
        throw ApiError.badRequest("Invalid id")
    }

    const [board] = await db
        .select()
        .from(boardsTable)
        .where(and(
            eq(boardsTable.id, boardId),
            eq(boardsTable.userId, req.user.id)
        ))

    if (!board) {
        throw ApiError.notFound("Board not found")
    }

    await db
    .delete(boardsTable)
    .where(and(
            eq(boardsTable.id, boardId),
            eq(boardsTable.userId, req.user.id)
        )).returning()

    res.json(ApiResponse.ok("Board deleted"))
}

const getBoardStatus = async(req, res) => {
    const {postId} = req.params

    if(!isUUID(postId)){
        throw ApiError.badRequest("Invalid id")
    }

    const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, postId))

    if(!post){
        throw ApiError.notFound("Post not found")
    }
    
    const [boardStatus] = await db
    .select()
    .from(boardPostTable)
    .innerJoin(boardsTable,
        eq(boardsTable.id, boardPostTable.boardId)
    )
    .where(and(
        eq(boardPostTable.postId, postId),
        eq(boardsTable.userId, req.user.id)
    ))
    .limit(1)

    res.json(ApiResponse.ok("Fetched!", {isBookmarked: !!boardStatus}))
}

export {
    createBoard,
    addPostToBoard,
    removePostFromBoard,
    getMyBoards,
    getPostsFromBoard,
    deleteBoard,
    getBoardStatus
}