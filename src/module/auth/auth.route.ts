import { Router } from "express";
import { AuthControllers } from "./auth.controller";

export const AuthRoutes = Router()

AuthRoutes.post("/register", AuthControllers.registerPatient)
AuthRoutes.post("/login", AuthControllers.loginUser)



