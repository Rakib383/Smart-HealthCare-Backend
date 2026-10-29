// import express, { type Express, type Request, type Response } from 'express';
import { Server } from 'http';
import app from './app';
import { envVars } from './config/env';
import { seedSuperAdmin } from './utils/seed';


let server:Server

const bootstrap = async () => {
    try {

        await seedSuperAdmin()
        server = app.listen(envVars.PORT, () => {
            console.log(`server is running on ${envVars.PORT}`);
        });

    } catch (error) {

        console.log("failed to start server", error);

    }
}

process.on("uncaughtException",(error) => {
    console.log("Uncaught exception detected.. shutting down server",error);

    if(server) {
        server.close(() => {
            process.exit(1)
        })
    }

    process.exit(1)
})

process.on("unhandledRejection",(error) => {
    console.log("unhandled rejection detected.. shutting down the server",error);

    if(server) {
        server.close(() => {
            process.exit(1)
        })
    }

    process.exit(1)
})

process.on("SIGTERM",() => {
    console.log("SIGTERM signal received. shutting down server...");

    if(server) {
        server.close(() => {
            console.log("server closed gracefully");
            process.exit(1)
        })
    }

    process.exit(1)
})

process.on("SIGINT",() => {
    console.log("sigint signal received. shutting down server...");

    if(server) {
        server.close(() => {
            console.log("server closed gracefully");
            process.exit(1)
        })
    }

    process.exit(1)
})

bootstrap()

