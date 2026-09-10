import { Router } from "express";
import { AuthControllers } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../generated/prisma/enums";

export const AuthRoutes = Router()

AuthRoutes.post("/register", AuthControllers.registerPatient)
AuthRoutes.post("/login", AuthControllers.loginUser)

AuthRoutes.get("/me",checkAuth(Role.ADMIN,Role.PATIENT,Role.DOCTOR,Role.SUPER_ADMIN),AuthControllers.getMe)

AuthRoutes.post("/refresh-token",AuthControllers.getNewToken)
AuthRoutes.post("/change-password",checkAuth(Role.ADMIN,Role.SUPER_ADMIN,Role.PATIENT,Role.DOCTOR),AuthControllers.changePassword)
AuthRoutes.post("/logout",checkAuth(Role.ADMIN,Role.SUPER_ADMIN,Role.PATIENT,Role.DOCTOR),AuthControllers.logoutUser)
AuthRoutes.post("/verify-email",AuthControllers.verifyEmail)
AuthRoutes.post("/forget-password",AuthControllers.forgetPassword)
AuthRoutes.post("/reset-password",AuthControllers.resetPassword)

AuthRoutes.get("/login/google",AuthControllers.googleLogin)
AuthRoutes.get("/google/success",AuthControllers.googleLoginSuccess)
AuthRoutes.get("/oauth/error",AuthControllers.handleOAuthError)


