import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { Role, UserStatus } from "../generated/prisma/enums";
import { envVars } from "../config/env";
import ms, { StringValue } from "ms";
import { bearer } from "better-auth/plugins";



export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword:{
        enabled:true
    },

    user:{
        additionalFields:{
            role:{
                type:"string",
                required:true,
                defaultValue:Role.PATIENT
            },
            status:{
                type:"string",
                required:true,
                defaultValue:UserStatus.ACTIVE

            },
            needPasswordChange:{
                type:"boolean",
                required:true,
                defaultValue:false
            },

            isDeleted:{
                type:"boolean",
                required:true,
                defaultValue:false
            },
            deletedAt:{
                type:"date",
                required:false,
                defaultValue:null

            }

        }
    },

    plugins:[
        bearer()
    ],

    session:{
        expiresIn:ms(envVars.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN as StringValue)/1000,
        updateAge: ms(envVars.BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE as StringValue) / 1000,
        cookieCache:{
            enabled:true,
            maxAge: ms(envVars.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN as StringValue) / 1000
        }

    }
    

    // trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:5000"],

    // advanced:{
    //     disableCSRFCheck:true
    // }
});

