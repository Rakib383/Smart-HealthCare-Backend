/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { PaymentStatus } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";



const handlerStripeWebhookEvent = async (event: Stripe.Event) => {

    const existingPayment = await prisma.payment.findFirst({
        where: {
            stripeEventId: event.id
        }
    })

    if (existingPayment) {
        console.log(`event ${event.id} already processed. skipping`);

        return { message: `event ${event.id} already processed. skipping` }
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object

            const appointmentId = session.metadata?.appointmentId

            const paymentId = session.metadata?.paymentId

            if(!appointmentId || !paymentId) {
                console.log("missing appointmentId or paymenttId in session metadata");

                return {
                    message:"missing appointmentId or paymenttId in session metadata"
                }
            }

            const appointment = await prisma.appointment.findUnique({
                where:{
                    id:appointmentId
                }
            })

            if(!appointment) {
                console.error(`appointment with id ${appointmentId} not found`);

                return {
                    message: `appointment with id ${appointmentId} not found`
                }
            }

            await prisma.$transaction(async (tx) => {
                await tx.appointment.update({
                    where:{
                        id:appointmentId
                    },
                    data:{
                        paymentStatus:session.payment_status === 'paid' ? PaymentStatus.PAID : PaymentStatus.UNPAID
                    }
                })

                await tx.payment.update({
                    where:{
                        id:paymentId
                    },
                    data:{
                        stripeEventId:event.id,
                        status: session.payment_status === 'paid' ? PaymentStatus.PAID : PaymentStatus.UNPAID,
                        paymentGatewayData:session as any
                    }
                })
            })

            console.log(`processed checkout.session.completed for appointment${appointment} and payment ${paymentId}`);

            break
        }
        case "checkout.session.expired": {

            const session = event.data.object

            console.log(`checkout session ${session.id} expired. marking associated payment as failed`);

            break

        }
        
        case "payment_intent.payment_failed":{

            const session = event.data.object

            console.log(`payment intent ${session.id} failed. marking associated payment as failed`);

            break
        }
        default:
            console.log(`unhandled event type ${event.type}`);

    }

    return {message:`webhook event ${event.id} processed successfully`}
}

export const PaymentService = {
    handlerStripeWebhookEvent
}