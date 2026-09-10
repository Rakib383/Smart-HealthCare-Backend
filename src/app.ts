import express, { Application, Request, Response } from "express";
import { indexRoutes } from "./routes";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { notFound } from "./middleware/notFound";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import path from "path";
import cors from "cors"
import { envVars } from "./config/env";

const app: Application = express()




app.set("view engine", "ejs")
app.set("views", path.resolve(process.cwd(), `src/templates`))

app.use(cors(
    {
        origin:[envVars.FRONTEND_URL,envVars.BETTER_AUTH_URL],
        credentials:true,
        methods:["GET","POST","PUT","PATCH","DELETE"],
        allowedHeaders:["Content-Type","Authorization"]
    }
))

app.use(express.urlencoded({ extended: true }))

app.use(express.json())
app.use(cookieParser())


app.use("/api/auth", toNodeHandler(auth))
app.use("/api/v1", indexRoutes)



app.get("/", async (req: Request, res: Response) => {



    res.send("server is fine")

})


// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(globalErrorHandler)
app.use(notFound)

export default app

