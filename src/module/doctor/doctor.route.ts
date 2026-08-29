import { Router } from "express";
import { DoctorControllers } from "./doctor.controller";

export const doctorRoutes = Router()


doctorRoutes.get("/",DoctorControllers.getAllDoctors)

