import status from "http-status"
import { DoctorServices } from "./doctor.service"
import { sendResponse } from "../../shared/sendResponse"
import { Request, Response } from "express"
import { catchAsync } from "../../shared/catchAsync"
import { IQueryParams } from "../../interfaces/query.interface"



const getAllDoctors = catchAsync(async (req: Request, res: Response) => {

    const query = req.query;

    const result = await DoctorServices.getAllDoctors(query as IQueryParams)

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Doctors fetched successfully",
        data: result.data,
        meta:result.meta
    })



}) 

const getDoctorById = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;

        const doctor = await DoctorServices.getDoctorById(id as string);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Doctor fetched successfully",
            data: doctor,
        })
    }
)

const updateDoctor = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const payload = req.body;

        const updatedDoctor = await DoctorServices.updateDoctor(id as string, payload);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Doctor updated successfully",
            data: updatedDoctor,
        })
    }
)

const deleteDoctor = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;

        const result = await DoctorServices.deleteDoctor(id as string);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Doctor deleted successfully",
            data: result,
        })
    }
)


export const DoctorControllers = {
    getAllDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor,
}