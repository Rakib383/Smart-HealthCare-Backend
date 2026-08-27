import { Router } from "express";
import { specialtyRoutes } from "../module/specialty/specialty.route";
import { AuthRoutes } from "../module/auth/auth.route";
import { UserRoutes } from "../module/user/user.route";

export const indexRoutes = Router()

indexRoutes.use("/specialties",specialtyRoutes)
indexRoutes.use("/auth",AuthRoutes)
indexRoutes.use("/users",UserRoutes)