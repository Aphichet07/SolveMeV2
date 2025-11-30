import solverWaitController from "../controllers/solverWait.controller.js";

const solverWaitRoute = (route) =>{
    route.post("/wait", solverWaitController.toggleWait);
}

export default solverWaitRoute