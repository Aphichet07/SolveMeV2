import { deflate } from "zlib";
import reviewController from "../controllers/review.controller.js";

const reviewRoute = (route) => {
  route.post("/submit", reviewController.submit);
};


export default reviewRoute