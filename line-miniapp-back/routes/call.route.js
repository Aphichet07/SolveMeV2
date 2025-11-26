import callController from "../controllers/callai.controller.js";

const callRoute = (route)=>{
    route.post("/priority", callController.getPriority)
}

export default callRoute