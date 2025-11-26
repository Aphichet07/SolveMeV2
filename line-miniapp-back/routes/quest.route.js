import dailyQuestController from "../controllers/quest.controller.js";

const questRoute = (route) => {
    route.get("/daily", dailyQuestController.getDailyQuests);
}

export default questRoute