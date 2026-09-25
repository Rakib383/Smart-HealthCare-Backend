import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../shared/validateRequest";
import { PatientValidation } from "./patient.validation";
import { PatientController } from "./patient.controller";
import { updateMyPatientProfileMiddleware} from "./patient.middlewares";



export const patientRoutes = Router();




patientRoutes.patch("/update-my-profile", checkAuth(Role.PATIENT), multerUpload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "medicalReports", maxCount: 5 }
]),updateMyPatientProfileMiddleware
    , validateRequest(PatientValidation.updatePatientProfileZodSchema), PatientController.updateMyProfile

)
