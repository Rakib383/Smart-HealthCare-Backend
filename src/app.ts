import express,{ Application, Request, Response } from "express";
// import { prisma } from "./lib/prisma";
import { indexRoutes } from "./routes";

const app:Application= express()

app.use(express.urlencoded({extended:true}))

app.use(express.json())

app.use("/api/v1",indexRoutes)


app.get("/", async (req:Request,res:Response) => {

    

res.send("server is fine")

})

export default app