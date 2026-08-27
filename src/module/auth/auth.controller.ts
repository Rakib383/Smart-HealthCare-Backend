import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { AuthServices } from "./auth.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";


const registerPatient = catchAsync(async (req:Request,res:Response) => {

    const payload = req.body;

    const result = await AuthServices.registerPatient(payload)

    sendResponse(res,{
        httpStatusCode:status.CREATED,
        success:true,
        message:"patient registered successfully",
        data:result
    })



}) 

const loginUser = catchAsync(async (req:Request,res:Response) => {

    const payload = req.body;

    const result = await AuthServices.loginUser(payload)

    sendResponse(res,{
        httpStatusCode:201,
        success:true,
        message:"user login successfully",
        data:result
    })



}) 

export const AuthControllers = {
    registerPatient,
    loginUser
}