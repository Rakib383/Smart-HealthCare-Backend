import status from "http-status"
import { Prisma } from "../generated/prisma/client"
import { IErrorSources, TErrorResponse } from "../interfaces/error.interface"


const getStatusCodeFromPrismaError = (errorCode:string):number => {

    if(errorCode === "P2002"){

        return status.CONFLICT
    }

    if(["P2025","P2001","P2018","P2015"].includes(errorCode)) {
        return status.NOT_FOUND
    }

    if(["P1000","P6002"].includes(errorCode)) {
        return status.UNAUTHORIZED
    }

    if(["P1010","P6010"].includes(errorCode)) {
        return status.FORBIDDEN
    }

    if(errorCode === 'P6003') {
        return status.PAYMENT_REQUIRED
    }

    if(["P1008","P2004","P6004"].includes(errorCode)) {
        return status.GATEWAY_TIMEOUT
    }

    if(errorCode === "P5011") {
        return status.TOO_MANY_REQUESTS
    }

    if(errorCode === 'P6009') {
        return 413
    }

    if(errorCode.startsWith("P1") || ["P2024","P2037","P6008"].includes(errorCode)) {
        return status.SERVICE_UNAVAILABLE
    }

    if(errorCode.startsWith("P2")) {
        return status.BAD_REQUEST
    }


    return status.INTERNAL_SERVER_ERROR
}

const formatErrorMeta = (meta?:Record<string,unknown>):string => {

    if(!meta) return ""

    const parts :string[]=[]

    if(meta.target) {
        parts.push(`Field(s):${String(meta.target)}`)
    }

    if(meta.field_name) {
        parts.push(`Field: ${String(meta.field_name)}`)
    }

    if(meta.column_name) {
        parts.push(`Column: ${String(meta.column_name)}`)
    }

    if(meta.table) {
        parts.push(`Table: ${String(meta.table)}`)
    }

    if(meta.model_name) {
        parts.push(`Model: ${String(meta.model_name)}`)
    }

    if(meta.relation_name) {
        parts.push(`Relation: ${String(meta.relation_name)}`)
    }

    if(meta.constraint) {
        parts.push(`Constraint:${String(meta.constraint)}`)
    }

    if(meta.database_error) {
        parts.push(`database error: ${String(meta.database_error)}`)
    }

    return parts.length > 0 ? parts.join("|") : ""

}

export const handlePrismaClientKnownRequestError = (error:Prisma.PrismaClientKnownRequestError):TErrorResponse => {

    const statusCode = getStatusCodeFromPrismaError(error.code)

    const metaInfo = formatErrorMeta(error.meta)

    let cleanMessage = error.message

    cleanMessage = cleanMessage.replace(/invalid `.*?`invocation:?\s*/i,"")

    const lines = cleanMessage.split("\n").filter(line => line.trim());

    const mainMessage = lines[0] || "An error occurred with the database operation"

    const errorSources: IErrorSources[] = [{
        path:error.code,
        message: metaInfo ? `${mainMessage} | ${metaInfo}` : mainMessage
    }]

    if(error.meta?.cause) {
        errorSources.push({
            path:"cause",
            message: String(error.meta.cause)
        })
    }

    return {
        success:false,
        statusCode,
        message:`prisma client known request error:${mainMessage}`,
        errorSources

    }
}

export const handlePrismaClientUnknownError = (error:Prisma.PrismaClientUnknownRequestError):TErrorResponse => {

    let cleanMessage = error.message

    cleanMessage = cleanMessage.replace(/Invalid `.*?`invocation:?\s*/i,"")

    const lines = cleanMessage.split("\n").filter(line => line.trim())
    const mainMessage = lines[0] || "An unknown error occured with the database operation"

    const errorSources : IErrorSources[] = [
        {
            path:"Unknown prisma error",
            message:mainMessage
        }
    ]

    return {
        success:false,
        statusCode:status.INTERNAL_SERVER_ERROR,
        message:`prisma client unknown request error:${mainMessage}`,
        errorSources
    }

}

export const handlePrismaClientValidationError = (error:Prisma.PrismaClientValidationError):TErrorResponse => {

    let cleanMessage = error.message;

    cleanMessage = cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i,"")

    const lines = cleanMessage.split("\n").filter(line => line.trim())

    const errorSources:IErrorSources[]= []

    const fieldMatch = cleanMessage.match(/Argument `(\w+)`/i);
    const fieldName = fieldMatch ? fieldMatch[1]:"unknown Field"

    const mainMessage = lines.find(line => 
        !line.includes("Argument") && 
        !line.includes("➜") && 
        line.length > 10
    ) || lines[0] || "Invalid query parameters provided to the database operation."

    errorSources.push({
        path:fieldName,
        message:mainMessage
    })

    return {
        success:false,
        statusCode:status.BAD_REQUEST,
        message:`Prisma client values validation Error ${mainMessage}`,
        errorSources
    }

}

export const handlePrismaClientInitializationError = (error:Prisma.PrismaClientInitializationError):TErrorResponse => {

    const statusCode = error.errorCode ? getStatusCodeFromPrismaError(error.errorCode):status.SERVICE_UNAVAILABLE

    const cleanMessage = error.message;

    cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i,"")

    const lines = cleanMessage.split("\n").filter(line => line.trim())

    const mainMessage = lines[0] || "An Error occured while initializing the prisma client"

    const errorSources : IErrorSources[] = [
        {
            path:error.errorCode || "Initialization Error",
            message:mainMessage
        }
    ]

    return {
        success:false,
        statusCode,
        message:`Prisma client initialization Error ${mainMessage}`,
        errorSources
    }
}

export const handlePrismaClientRustPanicError = ():TErrorResponse => {

    const errorSources : IErrorSources[]=[{
        path:"Rust engine crashed",
        message:"the database engine encountered a fatal error & crashed"
    }]

    return {
        success:false,
        statusCode:status.INTERNAL_SERVER_ERROR,
        message:"prisma client rust panic error: the database engine crashed due to a fatal error",
        errorSources
    }
}