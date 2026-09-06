import { Router } from "express";
import { AuthControllers } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../generated/prisma/enums";

export const AuthRoutes = Router()

AuthRoutes.post("/register", AuthControllers.registerPatient)
AuthRoutes.post("/login", AuthControllers.loginUser)

AuthRoutes.get("/me",checkAuth(Role.ADMIN,Role.PATIENT,Role.DOCTOR,Role.SUPER_ADMIN),AuthControllers.getMe)



