import userStateController from "../controllers/state.controller.js"

const stateRoute = (route) =>{
    route.post("/getState", userStateController.FindUser)
}

export default stateRoute