import chatController from "../controllers/chat.controller.js";

const chatRoute = (route) => {
    route.post("/complete", chatController.completeChat)
}

export default chatRoute