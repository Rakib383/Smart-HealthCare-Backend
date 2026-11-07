import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { RAGService } from "./rag.service";
import { redisService } from "../../lib/redis";

const ragService = new RAGService();

const getStats = catchAsync(async (req: Request, res: Response) => {
    const result = await ragService.getStats();

    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: "RAG stats retrieved successfully",
        data: result,
    });
});

const ingestDoctors = catchAsync(async (req: Request, res: Response) => {
    const result = await ragService.ingestDoctorsData();

    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: "Doctors data ingestion completed",
        data: result,
    });
});

const queryRag = catchAsync(async (req: Request, res: Response) => {
    const { query, limit, sourceType } = req.body;

    if (!query) {
        return sendResponse(res, {
            success: false,
            httpStatusCode: status.BAD_REQUEST,
            message: "Query is required",
        });
    }

    const cacheKey = `rag-query:${query}:${limit ?? 5}:${sourceType ?? "ALL"}`;

    try {

        const cachedResult = await redisService.get(cacheKey);

        if (cachedResult) {

            //cache hit, return the cached result
            return sendResponse(res, {
                success: true,
                httpStatusCode: status.OK,
                message: "Answer retrieved from cache",
                data: JSON.parse(cachedResult),
            });
        }
        
    } catch (error) {
        console.warn("Cache read error,procedding with normal processing", error);
        
    }

    //Cache miss

    const result = await ragService.generateAnswer(
        query,
        limit ?? 5,
        sourceType,
        true,
    );

    try {
        await redisService.set(cacheKey, JSON.stringify(result), 600); // Cache for 10 minutes
        
    } catch (error) {
        console.warn("Cache write error, proceeding without caching", error);
        
    }

    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: "Answer generated successfully",
        data: result,
    });
});

export const RagController = {
    getStats,
    ingestDoctors,
    queryRag,
};