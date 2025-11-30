import express from "express";
import authRoute from "./auth.route.js";
import bubbleRoute from "./bubble.route.js";
import matchRoute from "./match.route.js"
import questRoute from "./quest.route.js"
import stateRoute from "./state.route.js"
import callRoute from "./call.route.js"
import chatRoute from "./chat.route.js"
import profileRoute from "./profile.route.js"
import statusRoute from "./userStatus.route.js"
import tipRoute from "./tip.route.js"
import reviewRoute from "./review.route.js"
import solverWaitRoute from "./solverWait.route.js"
const router = express.Router();

const userRoutes = express.Router();
authRoute(userRoutes);                
router.use("/api/auth", userRoutes);   

const bubbleRoutes = express.Router();
bubbleRoute(bubbleRoutes);             
router.use("/api/bubbles", bubbleRoutes);

const matchRoutes = express.Router();
matchRoute(matchRoutes);             
router.use("/api/match", matchRoutes);

const questRoutes = express.Router();
questRoute(questRoutes);             
router.use("/api/quests", questRoutes);

const stateRoutes = express.Router()
stateRoute(stateRoutes)
router.use("/api/state", stateRoutes)

const callRoutes = express.Router()
callRoute(callRoutes)
router.use("/api/call", callRoutes)


const chatRoutes = express.Router()
chatRoute(chatRoutes)
router.use("/api/chat", chatRoutes)

const profileRoutes = express.Router()
profileRoute(profileRoutes)
router.use("/api/profile", profileRoutes)

const statusRoutes = express.Router()
statusRoute(statusRoutes)
router.use("/api/users", statusRoutes)

const tipRoutes = express.Router()
tipRoute(tipRoutes)
router.use("/api/tip", tipRoutes)

const reviewRoutes = express.Router()
reviewRoute(reviewRoutes)
router.use("/api/review", reviewRoutes)

const solverWaitRoutes = express.Router()
solverWaitRoute(solverWaitRoutes)
router.use("/api/solver", solverWaitRoutes)

export default router;
