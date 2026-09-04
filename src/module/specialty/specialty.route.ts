import { Router } from "express";
import { specialtyControllers } from "./specialty.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../generated/prisma/enums";

export const specialtyRoutes = Router()

specialtyRoutes.post("/", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), specialtyControllers.createSpecialty)
specialtyRoutes.get("/", specialtyControllers.getAllSpecialties)
specialtyRoutes.delete("/", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), specialtyControllers.deleteSpecialty)



