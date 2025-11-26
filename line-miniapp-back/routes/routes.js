import express from "express";
import authRoute from "./auth.route.js";
import bubbleRoute from "./bubble.route.js";
// import matchRoute from "./match.route.js"
import questRoute from "./quest.route.js"
import stateRoute from "./state.route.js"
import callRoute from "./call.route.js"

const router = express.Router();

const userRoutes = express.Router();
authRoute(userRoutes);                
router.use("/api/auth", userRoutes);   

const bubbleRoutes = express.Router();
bubbleRoute(bubbleRoutes);             
router.use("/api/bubbles", bubbleRoutes);

// const matchRoutes = express.Router();
// matchRoute(matchRoutes);             
// router.use("/api/match", matchRoutes);

const questRoutes = express.Router();
questRoute(questRoutes);             
router.use("/api/quests", questRoutes);

const stateRoutes = express.Router()
stateRoute(stateRoutes)
router.use("/api/state", stateRoutes)

const callRoutes = express.Router()
callRoute(callRoutes)
router.use("/api/call", callRoutes)

export default router;
