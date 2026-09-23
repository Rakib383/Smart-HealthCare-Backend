/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import status from "http-status";
import { envVars } from "../../config/env";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PaymentService } from "./payment.service";
import { stripe } from "../../config/stripe.config";

const handleStripeWebhookEvent = catchAsync(async (req:Request,res:Response) => {
    const signature = req.headers['stripe-signature'] as string 

    const webhookSecret = envVars.STRIPE.STRIPE_WEBHOOK_SECRET;

    if(!signature || !webhookSecret) {
        console.error("missing stripe signature or webhook secret");

        return res.status(status.BAD_REQUEST).json({message: "missing stripe signature or webhook secret"})
    }

    let event;

    try {

        event = stripe.webhooks.constructEvent(req.body,signature,webhookSecret)

        
    } catch (error) {

        console.log("error processing stripe webhook",error);

        return res.status(status.BAD_REQUEST).json({message:"error processing stripe webhook"})
        
    }

    try {

        const result = await PaymentService.handlerStripeWebhookEvent(event)

        sendResponse(res,{
            httpStatusCode:status.OK,
            success:true,
            message:"stripe webhook event processed successfully",
            data:result
        })
        
    } catch (error) {

        console.log("error handling stripe webhook event",error);

        return res.status(status.INTERNAL_SERVER_ERROR).json({
            message:"error handling stripe webhook event"
        })
        
    }


})

export const PaymentController = {
    handleStripeWebhookEvent
}