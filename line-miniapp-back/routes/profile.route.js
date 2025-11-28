import profileController from "../controllers/profile.controller.js";

const profileRoutes = (route)=>{
    route.post("/carry", profileController.updateCarryProfile);

}

export default profileRoutes