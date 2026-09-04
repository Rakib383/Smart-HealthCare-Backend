import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { AuthServices } from "./auth.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { tokenUtils } from "../../utils/token";


const registerPatient = catchAsync(async (req:Request,res:Response) => {

    const payload = req.body;

    const result = await AuthServices.registerPatient(payload)

    const { accessToken, refreshToken, token, ...rest } = result

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, token as string)

    sendResponse(res,{
        httpStatusCode:status.CREATED,
        success:true,
        message:"patient registered successfully",
        data: { accessToken, refreshToken, token, ...rest }
    })



}) 

const loginUser = catchAsync(async (req:Request,res:Response) => {

    const payload = req.body;

    const result = await AuthServices.loginUser(payload)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {accessToken,refreshToken,token,...rest} = result

    tokenUtils.setAccessTokenCookie(res,accessToken);
    tokenUtils.setRefreshTokenCookie(res,refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res,token)

    sendResponse(res,{
        httpStatusCode:201,
        success:true,
        message:"user login successfully",
        data: { accessToken, refreshToken, token, ...rest }
    })



}) 

export const AuthControllers = {
    registerPatient,
    loginUser
}