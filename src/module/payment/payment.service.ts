/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { PaymentStatus } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import status from "http-status";
import AppError from "../../errorHelpers/appError";
import { uploadFileToCloudinary } from "../../config/cloudinary.config";
import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../interfaces/query.interface";
import { sendEmail } from "../../utils/email";
import { generateInvoicePdf } from "./payment.utils";

const getAllPayments = async (query: IQueryParams) => {
    const page = Number(query.page ?? "1");
    const limit = Number(query.limit ?? "10");
    const isPaymentStatus = (value: string): value is PaymentStatus =>
        value === PaymentStatus.PAID || value === PaymentStatus.UNPAID;

    if (!Number.isInteger(page) || page < 1) {
        throw new AppError(status.BAD_REQUEST, "Page must be a positive integer.");
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new AppError(status.BAD_REQUEST, "Limit must be an integer between 1 and 100.");
    }

    if (query.status && !isPaymentStatus(query.status)) {
        throw new AppError(status.BAD_REQUEST, "Status must be PAID or UNPAID.");
    }

    const paymentStatus = query.status && isPaymentStatus(query.status) ? query.status : undefined;
    if (query.searchTerm !== undefined && (typeof query.searchTerm !== "string" || query.searchTerm.length > 100)) {
        throw new AppError(status.BAD_REQUEST, "Search term must be a string of 100 characters or fewer.");
    }

    const searchTerm = query.searchTerm?.trim();
    const textFilter = searchTerm
        ? { contains: searchTerm, mode: "insensitive" as const }
        : undefined;
    const where: Prisma.PaymentWhereInput = {
        ...(paymentStatus ? { status: paymentStatus } : {}),
        ...(textFilter ? {
            OR: [
                { id: textFilter },
                { transactionId: textFilter },
                { appointmentId: textFilter },
                { appointment: { is: { patient: { is: { name: textFilter } } } } },
                { appointment: { is: { patient: { is: { email: textFilter } } } } },
                { appointment: { is: { doctor: { is: { name: textFilter } } } } },
                { appointment: { is: { doctor: { is: { email: textFilter } } } } },
            ],
        } : {}),
    };

    const [total, data] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                appointment: {
                    include: {
                        doctor: {
                            select: { id: true, name: true, email: true, profilePhoto: true },
                        },
                        patient: {
                            select: { id: true, name: true, email: true, profilePhoto: true },
                        },
                        schedule: {
                            select: { startDateTime: true, endDateTime: true },
                        },
                    },
                },
            },
        }),
    ]);

    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const handlerStripeWebhookEvent = async (event: Stripe.Event) => {

    const existingPayment = await prisma.payment.findFirst({
        where: {
            stripeEventId: event.id
        }
    })

    if (existingPayment) {
        console.log(`Event ${event.id} already processed. Skipping`);
        return { message: `Event ${event.id} already processed. Skipping` }
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as any;

            const appointmentId = session.metadata?.appointmentId;
            const paymentId = session.metadata?.paymentId;

            if (!appointmentId || !paymentId) {
                console.error("⚠️ Missing metadata in webhook event");
                return { message: "Missing metadata" };
            }

            // Verify appointment exists with related data
            const appointment = await prisma.appointment.findUnique({
                where: { id: appointmentId },
                include: {
                    patient: true,
                    doctor: true,
                    schedule: true,
                    payment: true
                }
            });

            if (!appointment) {
                console.error(`⚠️ Appointment ${appointmentId} not found. Payment may be for expired appointment.`);
                return { message: "Appointment not found" };
            }
            let pdfBuffer: Buffer | null = null;

            // Update both appointment and payment in a transaction
            const result = await prisma.$transaction(async (tx) => {
                const updatedAppointment = await tx.appointment.update({
                    where: {
                        id: appointmentId
                    },
                    data: {
                        paymentStatus: session.payment_status === "paid" ? PaymentStatus.PAID : PaymentStatus.UNPAID
                    }
                });

                let invoiceUrl = null;


                // If payment is successful, generate and upload invoice
                if (session.payment_status === "paid") {
                    try {
                        // Generate invoice PDF
                        pdfBuffer = await generateInvoicePdf({
                            invoiceId: appointment.payment?.id || paymentId,
                            patientName: appointment.patient.name,
                            patientEmail: appointment.patient.email,
                            doctorName: appointment.doctor.name,
                            appointmentDate: appointment.schedule.startDateTime.toString(),
                            amount: appointment.payment?.amount || 0,
                            transactionId: appointment.payment?.transactionId || "",
                            paymentDate: new Date().toISOString()
                        });

                        // Upload PDF to Cloudinary
                        const cloudinaryResponse = await uploadFileToCloudinary(
                            pdfBuffer,
                            `ph-healthcare/invoices/invoice-${paymentId}-${Date.now()}.pdf`
                        );

                        invoiceUrl = cloudinaryResponse?.secure_url;

                        console.log(`✅ Invoice PDF generated and uploaded for payment ${paymentId}`);
                    } catch (pdfError) {
                        console.error("❌ Error generating/uploading invoice PDF:", pdfError);
                        // Continue with payment update even if PDF generation fails
                    }
                }

                const updatedPayment = await tx.payment.update({
                    where: {
                        id: paymentId
                    },
                    data: {
                        status: session.payment_status === "paid" ? PaymentStatus.PAID : PaymentStatus.UNPAID,
                        paymentGatewayData: session,
                        invoiceUrl: invoiceUrl, // Store invoice URL
                        stripeEventId: event.id // Store event ID for idempotency
                    }
                });

                return { updatedAppointment, updatedPayment, invoiceUrl };
            });

            // Send invoice email to patient (outside transaction to avoid blocking payment update)
            if (session.payment_status === "paid" && result.invoiceUrl) {
                try {
                    await sendEmail({
                        to: appointment.patient.email,
                        subject: `Payment Confirmation & Invoice - Appointment with ${appointment.doctor.name}`,
                        templateName: "invoice",
                        templateData: {
                            patientName: appointment.patient.name,
                            invoiceId: appointment.payment?.id || paymentId,
                            transactionId: appointment.payment?.transactionId || "",
                            paymentDate: new Date().toLocaleDateString(),
                            doctorName: appointment.doctor.name,
                            appointmentDate: new Date(appointment.schedule.startDateTime).toLocaleDateString(),
                            amount: appointment.payment?.amount || 0,
                            invoiceUrl: result.invoiceUrl
                        },
                        attachments: [
                            {
                                filename: `Invoice-${paymentId}.pdf`,
                                content: pdfBuffer || Buffer.from(""), // Attach PDF if generated, else empty buffer
                                contentType: 'application/pdf'
                            }
                        ]
                    });

                    console.log(`✅ Invoice email sent to ${appointment.patient.email}`);
                } catch (emailError) {
                    console.error("❌ Error sending invoice email:", emailError);
                    // Log but don't fail the payment if email fails
                }
            }

            console.log(`✅ Payment ${session.payment_status} for appointment ${appointmentId}`);
            break;
        }

        case "checkout.session.expired": {
            const session = event.data.object

            console.log(`Checkout session ${session.id} expired. Marking associated payment as failed.`);
            break;

        }
        case "payment_intent.payment_failed": {
            const session = event.data.object

            console.log(`Payment intent ${session.id} failed. Marking associated payment as failed.`);
            break;
        }
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return { message: `Webhook Event ${event.id} processed successfully` }
}

export const PaymentService = {
    getAllPayments,
    handlerStripeWebhookEvent
}