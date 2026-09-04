/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextFunction, Request, Response } from "express";
import { envVars } from "../config/env";
import status from "http-status";
import z from "zod";
import { IErrorSources, TErrorResponse } from "../interfaces/error.interface";



export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

    if (envVars.NODE_ENV == "development") {
        console.log("error from global erro handler",err);
    }

    const errorSources: IErrorSources[]=[]
        let statusCode:number = status.INTERNAL_SERVER_ERROR;
        let message:string = "internal server error"
        let stack: string | undefined = undefined


    if (err instanceof z.ZodError) {
        statusCode = status.BAD_REQUEST;
        message= "Zod validation error";

        err.issues.forEach(issue => {
            errorSources.push({
                path:issue.path.join("=>"),
                message:issue.message
            })
        })
    } else if (err instanceof Error) {
        statusCode=status.INTERNAL_SERVER_ERROR;
        message=err.message;
        stack=err.stack
    }


    const errorResponse :TErrorResponse = {
        success: false,
        message,
        error: envVars.NODE_ENV === "development" ? err : undefined,
        errorSources,
        stack:envVars.NODE_ENV === "development"?stack:undefined
    }

    res.status(statusCode).json(errorResponse)
}