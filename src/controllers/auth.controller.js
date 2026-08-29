import bcrypt from 'bcrypt'
import ApiError from "../utils/api-error.js"
import ApiResponse from '../utils/api-response.js'
import { signupValidateSchema, signinValidateSchema } from '../dto/auth.dto.js'
import db from "../index.js"
import { usersTable } from '../models/users.model.js'
import { eq, or, sql, desc } from 'drizzle-orm'
import { generateToken, verifyToken } from '../utils/token.js'
import { postsTable } from '../models/posts.model.js'
import cookieParser from 'cookie-parser'
import { followsTable } from '../models/follows.model.js'

const userSignup = async (req, res) => {
    const validatedData = await signupValidateSchema.safeParseAsync(req.body)

    if (!validatedData.success) {
        return res.status(400).json({
            success: false,
            errors: validatedData.error.issues
        });
    }

    const { username, email, password } = validatedData.data

    if (!username || !email || !password) {
        throw ApiError.badRequest("Please fill all the details")
    }

    const [existingUser] = await db
        .select({ username: usersTable.username, email: usersTable.email })
        .from(usersTable)
        .where(or(eq(usersTable.email, email), eq(usersTable.username, username)))

    if (existingUser) {
        throw ApiError.conflict("This email or username has already taken")
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await db.insert(usersTable)
        .values({
            username,
            email,
            password: hashedPassword
        }).returning({ id: usersTable.id })

    res.json(ApiResponse.created("User registration completed"))
}


const userSignin = async (req, res) => {
    const validatedData = await signinValidateSchema.safeParseAsync(req.body)

    if (!validatedData.success) {
        return res.status(400).json({
            success: false,
            errors: validatedData.error.issues
        });
    }

    const { email, password } = validatedData.data
    if (!email || !password) {
        throw ApiError.badRequest("Please fill all the details")
    }

    const [existingUser] = await db
        .select({ id: usersTable.id, username: usersTable.username, email: usersTable.email, password: usersTable.password })
        .from(usersTable)
        .where(eq(usersTable.email, email))

    if (!existingUser) {
        throw ApiError.notFound("User with this email does not exist")
    }

    const isCorrectPassword = await bcrypt.compare(password, existingUser.password)

    if (!isCorrectPassword) {
        throw ApiError.unauthorized("Incorrect password")
    }

    const token = generateToken({ id: existingUser.id })

    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict'
    })

    res.json(ApiResponse.ok("User logged-in"))
}

const getMe = async (req, res) => {
    const [user] = await db
        .select({
            id: usersTable.id,
            username: usersTable.username,
            nickname: usersTable.nickname,
            url: usersTable.url
        })
        .from(usersTable)
        .where(eq(usersTable.id, req.user.id))

    if (!user) {
        throw ApiError.notFound("User not found")
    }

    const posts = await db
        .select({ id: postsTable.id, url: postsTable.url, caption: postsTable.caption, isPrivate: postsTable.isPrivate })
        .from(postsTable)
        .where(eq(postsTable.userId, req.user.id))
        .orderBy(desc(postsTable.createdAt))

    const [follows] = await db
        .select({
            followers: sql`count(*) filter (
            where ${followsTable.followingId} = ${req.user.id}
        )`,
            following: sql`count(*) filter (
            where ${followsTable.followerId} = ${req.user.id}
        )`
        })
        .from(followsTable)

    return res.json(ApiResponse.ok("User profile fetched", {
        user,
        posts,
        follows
    }))
}

const userLogout = async (req, res) => {
    res.clearCookie("auth_token", {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
    });
    return res.json(ApiResponse.noContent("Logout successful"))
}

export {
    userSignup,
    userSignin,
    getMe,
    userLogout
}