// import express, { type Express, type Request, type Response } from 'express';
import app from './app';


 const bootstrap=()=>{
    try {
        app.listen(5000,()=> {
            console.log(`server is running on ${process.env.PORT}`);
        });
        
    } catch (error) {

        console.log("failed to start server",error);
        
    }
 }

 bootstrap()

