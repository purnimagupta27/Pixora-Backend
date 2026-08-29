import {Router} from 'express'
import * as controller from '../controllers/boards.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/create-board', authenticate, controller.createBoard)
router.patch('/update-board/:boardId', authenticate, controller.updateBoardName)
router.post('/:boardId/add-post/:postId', authenticate, controller.addPostToBoard)
router.patch('/:boardId/remove-post/:postId', authenticate, controller.removePostFromBoard)
router.get('/my-boards', authenticate, controller.getMyBoards)
router.get('/:boardId/posts', authenticate, controller.getPostsFromBoard)
router.delete('/:boardId', authenticate, controller.deleteBoard)

export default router