import matchController from "../controllers/match.controller.js";


const matchRoute = (route) =>{
    route.post("/find-solver", matchController.findSolver);
    route.post("/solver-accept", matchController.solverAccept);
}


export default matchRoute;
