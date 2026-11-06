import { Router } from "express";
import { RagController } from "./rag.controller";

export const ragRoutes = Router()

ragRoutes.get("/stats",RagController.getStats)
ragRoutes.post("/ingest-doctors",RagController.ingestDoctors)

ragRoutes.post("/query",RagController.queryRag)