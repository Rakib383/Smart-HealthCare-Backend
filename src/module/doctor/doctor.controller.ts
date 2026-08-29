import status from "http-status"
import { DoctorServices } from "./doctor.service"
import { sendResponse } from "../../shared/sendResponse"
import { Request, Response } from "express"
import { catchAsync } from "../../shared/catchAsync"



const getAllDoctors = catchAsync(async (Request: Request, res: Response) => {


    const result = await DoctorServices.getAllDoctors()

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Doctors fetched successfully",
        data: result
    })



}) 


export const DoctorControllers = {
    getAllDoctors
}