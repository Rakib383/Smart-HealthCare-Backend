

export interface IErrorSources {
    path: string;
    message: string;
}

export interface TErrorResponse {
    statusCode?:number;
    success: boolean;
    message: string;
    errorSources?: IErrorSources[];
    error?: unknown
    stack?:string | undefined

}