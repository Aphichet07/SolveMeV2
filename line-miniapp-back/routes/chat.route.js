import chatController from "../controllers/chat.controller.js";

const chatRoute = (route) => {
    route.post("/complete", chatController.completeChat)
    route.post("/exit", chatController.exitChat)
}

export default chatRoute