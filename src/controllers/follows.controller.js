import { validate as isUUID } from 'uuid'
import db from '../index.js'
import { usersTable } from '../models/users.model.js'
import { and, eq } from 'drizzle-orm'
import ApiError from '../utils/api-error.js'
import { followsTable } from '../models/follows.model.js'
import ApiResponse from '../utils/api-response.js'

const followUser = async(req, res) => {
    const {userId} = req.params

    if (!isUUID(userId)) {
        throw ApiError.badRequest("Invalid id")
    }

    const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))

    if(!user){
        throw ApiError.notFound("User not found")
    }

    if(user.id === req.user.id){
        throw ApiError.conflict("You cannot follow yourself")
    }

    const [existingFollow] = await db
    .select()
    .from(followsTable)
    .where(and(
        eq(followsTable.followerId, req.user.id),
        eq(followsTable.followingId, userId)
    ))

    if(existingFollow){
        throw ApiError.conflict("You cannot follow or unfollow yourself")
    }

    const [follow] = await db
    .insert(followsTable)
    .values({
        followerId: req.user.id,
        followingId: userId
    }).returning()

    res.json(ApiResponse.created("User followed successfully", follow));
}

const unfollowUser = async(req, res) => {
    const {userId} = req.params

    if (!isUUID(userId)) {
        throw ApiError.badRequest("Invalid id")
    }

    const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))

    if(!user){
        throw ApiError.notFound("User not found")
    }

    if(user.id === req.user.id){
        throw ApiError.conflict("You cannot follow or unfollow yourself")
    }

    const [existingFollow] = await db
    .select()
    .from(followsTable)
    .where(and(
        eq(followsTable.followerId, req.user.id),
        eq(followsTable.followingId, userId)
    ))

    if(!existingFollow){
        throw ApiError.conflict("You have not followed this user yet")
    }

    await db
    .delete(followsTable)
    .where(and(
        eq(followsTable.followerId, req.user.id),
        eq(followsTable.followingId, userId)
    ))

    res.json(ApiResponse.ok("Unfollowed the user"))
}

const getFollowStatus = async(req, res) => {
    const currentUser = req.user.id
    const targetUser = req.params.userId

    if(!isUUID(targetUser)){
        throw ApiError.badRequest("Invalid id")
    }

    const [followRecord] = await db
    .select()
    .from(followsTable)
    .where(and(
        eq(followsTable.followerId, currentUser),
        eq(followsTable.followingId, targetUser)
    ))

    res.json(ApiResponse.ok("Fetched", {isFollowing: !!followRecord}))
}

export{
    followUser,
    unfollowUser,
    getFollowStatus
}