/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, RequestHandler, response, Response } from "express";
import { specialtyServices } from "./specialty.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";


const createSpecialty = catchAsync(
    async (req: Request, res: Response) => {


        const payload = req.body;

        const result = await specialtyServices.createSpecialty(payload)

        sendResponse(res, {
            httpStatusCode: 201,
            success: true,
            message: "specialty created successfully",
            data: result
        })

    }
)




const getAllSpecialties = catchAsync(async (req: Request, res: Response) => {

    const result = await specialtyServices.getAllSpecialties();

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: "spcialties fetched successfully",
        data: result
    })

})




const deleteSpecialty = catchAsync(
    async (req: Request, res: Response) => {

        const { id } = req.params;

        const result = await specialtyServices.deleteSpecialty(id as string)

        sendResponse(res, {
            httpStatusCode: 201,
            success: true,
            message: "Specialty deleted successfully",
            data: result
        })


    }
)


export const specialtyControllers = {
    createSpecialty,
    deleteSpecialty,
    getAllSpecialties
}