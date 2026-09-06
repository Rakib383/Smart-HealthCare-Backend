import { Router } from "express";
import { DoctorControllers } from "./doctor.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../generated/prisma/enums";
import { updateDoctorZodSchema } from "./doctor.validation";
import { validateRequest } from "../../shared/validateRequest";

export const doctorRoutes = Router()


doctorRoutes.get("/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    DoctorControllers.getAllDoctors);
doctorRoutes.get("/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    DoctorControllers.getDoctorById);
doctorRoutes.patch("/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(updateDoctorZodSchema), DoctorControllers.updateDoctor);
doctorRoutes.delete("/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    DoctorControllers.deleteDoctor);

