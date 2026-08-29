import { NextFunction, Request, Response, Router } from "express";
import { userControllers } from "./user.controller";

import * as z from "zod";
import { Gender } from "../../generated/prisma/enums";
import { validateRequest } from "../../shared/validateRequest";
import { createDoctorZodSchema } from "./user.validation";








export const UserRoutes= Router()




UserRoutes.post("/create-doctor", validateRequest(createDoctorZodSchema),userControllers.createDoctor)



