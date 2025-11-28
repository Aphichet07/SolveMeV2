import express from "express";
import {
  pingUserStatus,
  getUserStatus,
} from "../controllers/userStatus.controller.js";

const statusRoute = (route) => {
  route.post("/ping", pingUserStatus)
  route.get("/:userId/status", getUserStatus)
};

export default statusRoute
