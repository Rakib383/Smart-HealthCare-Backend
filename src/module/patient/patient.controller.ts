import { Request, Response } from "express";
import status from "http-status";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PatientService } from "./patient.service";
import { IQueryParams } from "../../interfaces/query.interface";


const updateMyProfile = catchAsync(async (req: Request, res: Response) => {

    const user = req.user as IRequestUser;
    const payload = req.body;

    // console.log(req.files);


    const result = await PatientService.updateMyProfile(user, payload);

    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: "Profile updated successfully",
        data: result
    });
})

const getAllPatients = catchAsync(async (req: Request, res: Response) => {
    const result = await PatientService.getAllPatients(req.query as IQueryParams);

    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: "Patients fetched successfully",
        data: result.data,
        meta: result.meta,
    });
});

const deletePatient = catchAsync(async (req: Request, res: Response) => {
    const result = await PatientService.deletePatient(req.params.id as string);

    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: result.message,
        data: result,
    });
});

export const PatientController = {
    getAllPatients,
    deletePatient,
    updateMyProfile
}