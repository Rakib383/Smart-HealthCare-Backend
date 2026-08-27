import { Router } from "express";
import { userControllers } from "./user.controller";


export const UserRoutes= Router()

UserRoutes.post("/create-doctor",userControllers.createDoctor)



