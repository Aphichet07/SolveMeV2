import tipController from "../controllers/tip.controller.js"

const tipRoute = (route) => {
    route.post("/send", tipController.sendTip);
}

export default tipRoute