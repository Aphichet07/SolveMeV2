import profileController from "../controllers/profile.controller.js";

const profileRoutes = (route)=>{
    route.post("/carry", profileController.updateCarryProfile);
    route.get("/stats", profileController.getStats);

}

export default profileRoutes