import { Router } from "express";
import { specialtyControllers } from "./specialty.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../shared/validateRequest";
import { specialtyValidation } from "./specialty.validation";

export const specialtyRoutes = Router()

specialtyRoutes.post("/",
    // checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
multerUpload.single("file"),
validateRequest(specialtyValidation.createSpecialtyZodSchema),
 specialtyControllers.createSpecialty)

specialtyRoutes.get("/", specialtyControllers.getAllSpecialties)

specialtyRoutes.delete("/", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), specialtyControllers.deleteSpecialty)



