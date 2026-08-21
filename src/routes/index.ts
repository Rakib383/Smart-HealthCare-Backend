import { Router } from "express";
import { specialtyRoutes } from "../module/specialty/specialty.route";

export const indexRoutes = Router()

indexRoutes.use("/specialties",specialtyRoutes)