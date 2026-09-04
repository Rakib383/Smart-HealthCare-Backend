import express,{ Application, Request, Response } from "express";
// import { prisma } from "./lib/prisma";
import { indexRoutes } from "./routes";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { notFound } from "./middleware/notFound";
import cookieParser from "cookie-parser";

const app:Application= express()

app.use(express.urlencoded({extended:true}))

app.use(express.json())
app.use(cookieParser())

app.use("/api/v1",indexRoutes)



app.get("/", async (req:Request,res:Response) => {

    

res.send("server is fine")

})


// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(globalErrorHandler)
app.use(notFound)

export default app

 