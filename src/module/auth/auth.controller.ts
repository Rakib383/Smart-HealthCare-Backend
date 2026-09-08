import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { AuthServices } from "./auth.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { tokenUtils } from "../../utils/token";
import AppError from "../../errorHelpers/appError";
import { cookieUtils } from "../../utils/cookie";


const registerPatient = catchAsync(async (req:Request,res:Response) => {

    const payload = req.body;

    const result = await AuthServices.registerPatient(payload)

    const { accessToken, refreshToken, token, ...rest } = result

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    // tokenUtils.setBetterAuthSessionCookie(res, token as string)

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

const getMe = catchAsync(async (req: Request, res: Response) => {

    const user = req.user
    const result = await AuthServices.getMe(user)


    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "user profile fetched successfully",
        data: result
    })



}) 


const getNewToken = catchAsync(async (req: Request, res: Response) => {

   const refreshToken = req.cookies.refreshToken;
   const betterAuthSessionToken = req.cookies["better-auth.session_token"]

   if (!refreshToken) {
    throw new AppError(status.UNAUTHORIZED,"refresh token is missing")
   }

   const result = await AuthServices.getNewToken(refreshToken,betterAuthSessionToken)

   const {newAccessToken,newRefreshToken,sessionToken}= result

   tokenUtils.setAccessTokenCookie(res,newAccessToken)
   tokenUtils.setRefreshTokenCookie(res,newRefreshToken)
    // tokenUtils.setBetterAuthSessionCookie(res, sessionToken)

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "user tokens generated successfully",
        data: {
            accessToken:newAccessToken,
            refreshToken:newRefreshToken,
            sessionToken
        }
    })



}) 



const changePassword = catchAsync(async (req: Request, res: Response) => {

   
   const betterAuthSessionToken = req.cookies["better-auth.session_token"]

   const payload = req.body

   const result = await AuthServices.changePassword(payload,betterAuthSessionToken)

   const {accessToken,refreshToken,token} = result

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res,token as string)


    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Password changed successfully",
        data: result
    })



}) 
const logoutUser = catchAsync(async (req: Request, res: Response) => {

    const betterAuthSessionToken = req.cookies["better-auth.session_token"]


    const result = await AuthServices.logoutUser(betterAuthSessionToken)

    cookieUtils.clearCookie(res,"accessToken",{
        httpOnly:true,
        secure:true,
        sameSite:"none"
    })
    cookieUtils.clearCookie(res,"refreshToken",{
        httpOnly:true,
        secure:true,
        sameSite:"none"
    })
    cookieUtils.clearCookie(res,"better-auth.session_token",{
        httpOnly:true,
        secure:true,
        sameSite:"none"
    })

   

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "user logged out successfully",
        data: result
    })



}) 


const verifyEmail = catchAsync(async (req: Request, res: Response) => {

    
   
    const {email,otp} = req.body;

    await AuthServices.verifyEmail(email,otp)
   

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Email verified successfully",
    })



}) 








export const AuthControllers = {
    registerPatient,
    loginUser,
    getMe,
    getNewToken,
    changePassword,
    logoutUser,
    verifyEmail
}