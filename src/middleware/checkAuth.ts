import { NextFunction, Request, Response } from "express";
import { Role, UserStatus } from "../generated/prisma/enums";
import { cookieUtils } from "../utils/cookie";
import { prisma } from "../lib/prisma";
import AppError from "../errorHelpers/appError";
import status from "http-status";
import { jwtUtils } from "../utils/jwt";
import { envVars } from "../config/env";


export const checkAuth = (...authRoles: Role[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {

        const sessionToken = cookieUtils.getCookie(req, "better-auth.session_token");

        if (!sessionToken) {
            throw new Error("unauthorized access no session token provided")
        }

        if (sessionToken) {
            const sessionExists = await prisma.session.findFirst({
                where: {
                    token: sessionToken,
                    expiresAt: {
                        gt: new Date(),
                    }
                },
                include: {
                    user: true
                }
            })

            if (sessionExists && sessionExists.user) {

                const user = sessionExists.user;

                const now = new Date()
                const expiresAt = new Date(sessionExists.expiresAt)
                const createdAt = new Date(sessionExists.createdAt)
                const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();
                const timeRemaining = expiresAt.getTime() - now.getTime()
                const percentRemaining = (timeRemaining / sessionLifeTime) * 100

                if (percentRemaining < 20) {
                    res.setHeader(
                        "X-Session-Refresh", "true"
                    );
                    res.setHeader("x-Session-Expires-At", expiresAt.toISOString());
                    res.setHeader("X-Time-Remaining", timeRemaining.toString());


                }

                if (user.status === UserStatus.BLOCKED || user.status === UserStatus.DELETED) {
                    throw new AppError(status.UNAUTHORIZED, "unauthorized access! user is not active")
                }

                

                if (authRoles.length > 0 && !authRoles.includes(user.role)) {
                    throw new AppError(status.FORBIDDEN, 'forbidden access! you do not have permission to access this resource')
                }



            }


        }

        const accessToken = cookieUtils.getCookie(req, 'accessToken')

        if (!accessToken) {
            throw new AppError(status.UNAUTHORIZED, 'unauthorized access! no access token provided')
        }

        const verifiedToken = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET)

        if (!verifiedToken.success) {
            throw new AppError(status.UNAUTHORIZED, 'unauthorized access. invalid access token')
        }


        if (authRoles.length > 0 && !authRoles.includes(verifiedToken.data!.role as Role)) {
            throw new AppError(status.FORBIDDEN, "forbidden access. you don't have permission to access to this resource")
        }

        next()




    } catch (error) {

        next(error)

    }
}