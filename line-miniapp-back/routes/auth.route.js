import authController from "../controllers/auth.controller.js"

const authRoute = (route) =>{

    route.post("/enter", authController.enterApp)
    route.post("/ready", authController.setReady);
    route.post("/heartbeat", authController.heartbeat);
}

export default authRoute