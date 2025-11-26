import bubbleController from "../controllers/bubble.controller.js";

const bubbleRoute = (route) =>{
    route.get("/list", bubbleController.GetBubbles);
    route.get("/nearby", bubbleController.Nearby);
    route.post("/create", bubbleController.CreateBubble)
    route.get("/solvers/active", bubbleController.getActiveSolvers);
    route.get("/:bubbleId/match-status",bubbleController.getMatchStatus);
    route.get("/:bubbleId/match-status", bubbleController.MatchStatus);
    route.post("/delete", bubbleController.deleteBubble)
    route.put("/edit", bubbleController.editBubble)
}

export default bubbleRoute
