// import express, { type Express, type Request, type Response } from 'express';
import app from './app';
import { envVars } from './config/env';
import { seedSuperAdmin } from './utils/seed';


const bootstrap = async () => {
    try {

        await seedSuperAdmin()
        app.listen(envVars.PORT, () => {
            console.log(`server is running on ${envVars.PORT}`);
        });

    } catch (error) {

        console.log("failed to start server", error);

    }
}

bootstrap()

