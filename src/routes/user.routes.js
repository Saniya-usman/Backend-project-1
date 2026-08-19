import { Router } from "express"
import { loginUser, LogoutUser, registerUser , refreshAccessToken} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
const router = Router()
import { verifyJWT } from "../middlewares/auth.middleware.js"
router.route("/register").post(
    upload.fields([
        { 
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount : 1 
        }
    ]),
    registerUser
)
router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, LogoutUser)

router.route("/refresh-token").post(refreshAccessToken)

export default router