import { Router } from "express";
import { specialtyControllers } from "./specialty.controller";

export const specialtyRoutes = Router()

specialtyRoutes.post("/",specialtyControllers.createSpecialty)
specialtyRoutes.get("/",specialtyControllers.getAllSpecialties)
specialtyRoutes.delete("/",specialtyControllers.deleteSpecialty)



