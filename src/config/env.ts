
import dotenv from "dotenv";

dotenv.config()

interface EnvConfig {
    NODE_ENV:string;
    PORT:string;
    DATABASE_URL:string;
    BETTER_AUTH_SECRET:string;
    BETTER_AUTH_URL:string;
}


const loadEnvVariables = ():EnvConfig => {


    return {
        NODE_ENV:process.env.NODE_ENV as string,
        PORT: process.env.PORT as string,
        DATABASE_URL: process.env.DATABASE_URL as string,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
    }
}

export const envVars = loadEnvVariables()