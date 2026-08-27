/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import { envVars } from "../config/env";
import status from "http-status";


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

    if (envVars.NODE_ENV == "development") {
        console.log("error from global erro handler",err);
    }

        const statusCode:number = status.INTERNAL_SERVER_ERROR;
        const message:string = "internal server error"
    

    res.status(statusCode).json({
        success: false,
        message,
        error: err.message
    })
}