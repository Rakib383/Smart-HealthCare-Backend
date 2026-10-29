/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextFunction, Request, Response } from "express";
import { envVars } from "../config/env";
import status from "http-status";
import z from "zod";
import { IErrorSources, TErrorResponse } from "../interfaces/error.interface";
import { deleteFileFromCloudinary } from "../config/cloudinary.config";
import { deleteUploadedFilesFromGlobalErrorHandler } from "../utils/deleteUploadedFilesFromGlobalErrorHandler";
import { Prisma } from "../generated/prisma/client";
import { handlePrismaClientInitializationError, handlePrismaClientKnownRequestError, handlePrismaClientRustPanicError, handlePrismaClientUnknownError, handlePrismaClientValidationError } from "../errorHelpers/handlePrismaErrors";



export const globalErrorHandler = async (err: any, req: Request, res: Response, next: NextFunction) => {

    if (envVars.NODE_ENV == "development") {
        console.log("error from global erro handler", err);
    }

    await deleteUploadedFilesFromGlobalErrorHandler(req)

    let errorSources: IErrorSources[] = []
    let statusCode: number = status.INTERNAL_SERVER_ERROR;
    let message: string = "internal server error"
    let stack: string | undefined = undefined

    if (err instanceof Prisma.PrismaClientKnownRequestError) {

        const simplifiedError = handlePrismaClientKnownRequestError(err);

        statusCode = simplifiedError.statusCode as number;
        message = simplifiedError.message;
        errorSources = [...(simplifiedError.errorSources ?? [])];
        stack = err.stack

    } else if(err instanceof Prisma.PrismaClientUnknownRequestError) {

        const simplifiedError = handlePrismaClientUnknownError(err);
        statusCode = simplifiedError.statusCode as number
        message = simplifiedError.message
        errorSources = [...(simplifiedError.errorSources ?? [])]
        stack=err.stack
    } else if (err instanceof Prisma.PrismaClientValidationError) {

        const simplifiedError = handlePrismaClientValidationError(err)
        statusCode = simplifiedError.statusCode as number
        message = simplifiedError.message
        errorSources = [...(simplifiedError.errorSources ?? [])]
        stack = err.stack

    } else if (err instanceof Prisma.PrismaClientRustPanicError) {
        const simplifiedError = handlePrismaClientRustPanicError()

        statusCode = simplifiedError.statusCode as number;
        message=simplifiedError.message
        errorSources = [...(simplifiedError.errorSources ?? [])]
        stack = err.stack
    }
     else if (err instanceof Prisma.PrismaClientInitializationError) {
        const simplifiedError = handlePrismaClientInitializationError(err)

        statusCode = simplifiedError.statusCode as number;
        message=simplifiedError.message
        errorSources = [...(simplifiedError.errorSources ?? [])]
        stack = err.stack
    }
    
    
    else if(err instanceof z.ZodError) {
        statusCode = status.BAD_REQUEST;
        message = "Zod validation error";

        err.issues.forEach(issue => {
            errorSources.push({
                path: issue.path.join("=>"),
                message: issue.message
            })
        })
    } else if (err instanceof Error) {
        statusCode = status.INTERNAL_SERVER_ERROR;
        message = err.message;
        stack = err.stack
    }


    const errorResponse: TErrorResponse = {
        success: false,
        message,
        error: envVars.NODE_ENV === "development" ? err : undefined,
        errorSources,
        stack: envVars.NODE_ENV === "development" ? stack : undefined
    }

    res.status(statusCode).json(errorResponse)
}