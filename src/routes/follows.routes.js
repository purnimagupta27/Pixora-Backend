import { Router } from "express"
import { authenticate } from "../middlewares/auth.middleware.js"
import * as controller from '../controllers/follows.controller.js'

const router = Router()

router.post('/:userId', authenticate, controller.followUser)
router.delete('/:userId', authenticate, controller.unfollowUser)
router.get(`/:userId`, authenticate, controller.getFollowStatus)

export default router