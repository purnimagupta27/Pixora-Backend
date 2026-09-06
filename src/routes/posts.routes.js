import { Router } from "express";
import * as controller from '../controllers/post.controller.js'
import upload from "../middlewares/multer.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router()

router.post('/create-post', authenticate, upload.single("image"), controller.createPost)
router.get('/my-posts', authenticate, controller.getMyPosts)
router.get('/my-post/:id', authenticate, controller.getMyPostById)
router.patch('/my-post/:id', authenticate, controller.editMyPostById)
router.delete('/my-post/:id', authenticate, controller.deleteMyPostById)
router.get('/feed/following', authenticate, controller.getFollowingsPosts)
router.get('/feed', authenticate, controller.getAllPosts)
router.get('/post/:id', authenticate, controller.getPostById)
router.get('/users/:userId', authenticate, controller.getUsersPost)


export default router