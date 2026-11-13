import status from "http-status";
import { v7 as uuidv7 } from "uuid";
import { PaymentStatus, Role, UserStatus } from "../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { stripe } from "../../config/stripe.config";

import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { AppointmentStatus } from './../../generated/prisma/enums';
import { IBookAppointmentPayload } from "./appointment.interface";
import AppError from "../../errorHelpers/appError";

// Pay Now Book Appointment
const bookAppointment = async (payload: IBookAppointmentPayload, user: IRequestUser) => {

    const patientData = await prisma.patient.findUniqueOrThrow({
        where: {
            email: user.email
        }
    })

    const doctorData = await prisma.doctor.findFirstOrThrow({
        where: {
            id: payload.doctorId,
            isDeleted: false,
            user: {
                isDeleted: false,
                status: UserStatus.ACTIVE
            }
        }
    })

    const scheduleData = await prisma.schedule.findUniqueOrThrow({
        where: {
            id: payload.scheduleId
        }
    })

    if (scheduleData.startDateTime <= new Date()) {
        throw new AppError(status.BAD_REQUEST, "This appointment time is no longer available");
    }

    // temporary fake calling url

    const videoCallingId = String(uuidv7())

    const result = await prisma.$transaction(async (tx) => {
        const reservedSlot = await tx.doctorSchedules.updateMany({
            where: {
                doctorId: doctorData.id,
                scheduleId: scheduleData.id,
                isBooked: false
            },
            data: {
                isBooked: true
            }
        });

        if (reservedSlot.count !== 1) {
            throw new AppError(status.CONFLICT, "This appointment time is no longer available");
        }

        const appointmentData = await tx.appointment.create({
            data: {
                doctorId: payload.doctorId,
                patientId: patientData.id,
                scheduleId: scheduleData.id,
                videoCallingId
            }
        })

        //payment integration start

        const transactionId = String(uuidv7());

        const paymentData = await tx.payment.create({
            data: {
                appointmentId: appointmentData.id,
                amount: doctorData.appointmentFee,
                transactionId
            }
        })

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "bdt",
                        product_data: {
                            name: `appointment with ${doctorData.name}`
                        },
                        unit_amount: doctorData.appointmentFee * 100
                    },
                    quantity: 1
                }
            ],
            metadata: {
                appointmentId: appointmentData.id,
                paymentId: paymentData.id
            },

            success_url: `${envVars.FRONTEND_URL}/payment/success?appointment_id=${appointmentData.id}&payment_id=${paymentData.id}`,
            cancel_url: `${envVars.FRONTEND_URL}/dashboard/my-appointments?error=payment_cancelled`

        })

        return {
            appointmentData,
            paymentData,
            paymentUrl: session.url
        }


    })

    return {
        appointment: result.appointmentData,
        payment: result.paymentData,
        paymentUrl: result.paymentUrl
    }
}

const getMyAppointments = async (user: IRequestUser) => {
    //user can be patient or doctor, so we need to check both
    const patientData = await prisma.patient.findUnique({
        where: {
            email: user?.email
        }
    });

    const doctorData = await prisma.doctor.findUnique({
        where: {
            email: user?.email
        }
    });

    // eslint-disable-next-line no-useless-assignment
    let appointments = [];

    if (patientData) {
        appointments = await prisma.appointment.findMany({
            where: {
                patientId: patientData.id
            },
            include: {
                doctor: true,
                schedule: true
            }
        });
    } else if (doctorData) {
        appointments = await prisma.appointment.findMany({
            where: {
                doctorId: doctorData.id
            },
            include: {
                patient: true,
                schedule: true
            }
        });
    } else {
        throw new Error("User not found");
    }

    return appointments;

}

const changeAppointmentStatus = async (appointmentId: string, appointmentStatus: AppointmentStatus, user: IRequestUser) => {
    const appointmentData = await prisma.appointment.findUniqueOrThrow({
        where: {
            id: appointmentId
        },
        include: {
            doctor: true
        }
    });

    let patientId: string | undefined;
    if (user?.role === Role.DOCTOR) {
        if (user.email !== appointmentData.doctor.email) {
            throw new AppError(status.FORBIDDEN, "This is not your appointment");
        }

        const isAllowedTransition =
            (appointmentData.status === AppointmentStatus.SCHEDULED
                && (appointmentStatus === AppointmentStatus.INPROGRESS
                    || appointmentStatus === AppointmentStatus.CANCELED))
            || (appointmentData.status === AppointmentStatus.INPROGRESS
                && appointmentStatus === AppointmentStatus.COMPLETED);

        if (!isAllowedTransition) {
            throw new AppError(status.BAD_REQUEST, "This appointment status cannot be changed to the selected status");
        }
    } else if (user?.role === Role.PATIENT) {
        const patientData = await prisma.patient.findUniqueOrThrow({
            where: {
                email: user.email
            }
        });

        if (patientData.id !== appointmentData.patientId) {
            throw new AppError(status.FORBIDDEN, "This is not your appointment");
        }

        if (appointmentData.status !== AppointmentStatus.SCHEDULED
            || appointmentStatus !== AppointmentStatus.CANCELED) {
            throw new AppError(status.BAD_REQUEST, "Only scheduled appointments can be canceled");
        }

        patientId = patientData.id;
    }

    return prisma.$transaction(async (tx) => {
        if (user?.role === Role.DOCTOR) {
            const updated = await tx.appointment.updateMany({
                where: {
                    id: appointmentId,
                    doctorId: appointmentData.doctorId,
                    status: appointmentData.status
                },
                data: {
                    status: appointmentStatus
                }
            });

            if (updated.count !== 1) {
                throw new AppError(status.CONFLICT, "This appointment has already changed");
            }
        } else if (user?.role === Role.PATIENT && patientId) {
            const updated = await tx.appointment.updateMany({
                where: {
                    id: appointmentId,
                    patientId,
                    status: AppointmentStatus.SCHEDULED
                },
                data: {
                    status: appointmentStatus
                }
            });

            if (updated.count !== 1) {
                throw new AppError(status.CONFLICT, "This appointment has already changed");
            }
        } else {
            await tx.appointment.update({
                where: {
                    id: appointmentId
                },
                data: {
                    status: appointmentStatus
                }
            });
        }

        if (appointmentStatus === AppointmentStatus.CANCELED) {
            await tx.doctorSchedules.updateMany({
                where: {
                    doctorId: appointmentData.doctorId,
                    scheduleId: appointmentData.scheduleId,
                    isBooked: true
                },
                data: {
                    isBooked: false
                }
            });
        }

        return tx.appointment.findUniqueOrThrow({
            where: {
                id: appointmentId
            }
        });
    });

}

// refactoring on include of doctor and patient data in appointment details, we can use query builder to get the data in single query instead of multiple queries in case of doctor and patient both
const getMySingleAppointment = async (appointmentId: string, user: IRequestUser) => {

    const patientData = await prisma.patient.findUnique({
        where: {
            email: user?.email
        }
    });

    const doctorData = await prisma.doctor.findUnique({
        where: {
            email: user?.email
        }
    });

    let appointment;

    if (patientData) {
        appointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                patientId: patientData.id
            },
            include: {
                doctor: true,
                schedule: true
            }
        });
    } else if (doctorData) {
        appointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                doctorId: doctorData.id
            },
            include: {
                patient: true,
                schedule: true
            }
        });
    }

    if (!appointment) {
        throw new AppError(status.NOT_FOUND, "Appointment not found");
    }

    return appointment;
}

// integrate query builder
const getAllAppointments = async () => {
    const appointments = await prisma.appointment.findMany({
        include: {
            doctor: true,
            patient: true,
            schedule: true
        }
    });
    return appointments;
}

const bookAppointmentWithPayLater = async (payload: IBookAppointmentPayload, user: IRequestUser) => {
    const patientData = await prisma.patient.findUniqueOrThrow({
        where: {
            email: user.email
        }
    })

    const doctorData = await prisma.doctor.findFirstOrThrow({
        where: {
            id: payload.doctorId,
            isDeleted: false,
            user: {
                isDeleted: false,
                status: UserStatus.ACTIVE
            }
        }
    })

    const scheduleData = await prisma.schedule.findUniqueOrThrow({
        where: {
            id: payload.scheduleId
        }
    })

    if (scheduleData.startDateTime <= new Date()) {
        throw new AppError(status.BAD_REQUEST, "This appointment time is no longer available");
    }

    const videoCallingId = String(uuidv7())

    const result = await prisma.$transaction(async (tx) => {
        const reservedSlot = await tx.doctorSchedules.updateMany({
            where: {
                doctorId: doctorData.id,
                scheduleId: scheduleData.id,
                isBooked: false
            },
            data: {
                isBooked: true
            }
        });

        if (reservedSlot.count !== 1) {
            throw new AppError(status.CONFLICT, "This appointment time is no longer available");
        }

        const appointmentData = await tx.appointment.create({
            data: {
                doctorId: payload.doctorId,
                patientId: patientData.id,
                scheduleId: scheduleData.id,
                videoCallingId
            }
        })

        const transactionId = String(uuidv7());

        const paymentData = await tx.payment.create({
            data: {
                appointmentId: appointmentData.id,
                amount: doctorData.appointmentFee,
                transactionId
            }
        })


        return {
            appointment: appointmentData,
            payment: paymentData
        }


    })

    return result


}

const initiatePayment = async (appointmentId: string, user: IRequestUser) => {
    const patientData = await prisma.patient.findUniqueOrThrow({
        where: {
            email: user.email,
        }
    });

    const appointmentData = await prisma.appointment.findUniqueOrThrow({
        where: {
            id: appointmentId,
            patientId: patientData.id,
        },
        include: {
            doctor: true,
            payment: true,
        }
    });

    if (!appointmentData) {
        throw new AppError(status.NOT_FOUND, "Appointment not found");
    }

    if (!appointmentData.payment) {
        throw new AppError(status.NOT_FOUND, "Payment data not found for this appointment");
    }

    if (appointmentData.payment?.status === PaymentStatus.PAID) {
        throw new AppError(status.BAD_REQUEST, "Payment already completed for this appointment");
    };

    if (appointmentData.status === AppointmentStatus.CANCELED) {
        throw new AppError(status.BAD_REQUEST, "Appointment is canceled");
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: 'payment',
        line_items: [
            {
                price_data: {
                    currency: "bdt",
                    product_data: {
                        name: `Appointment with Dr. ${appointmentData.doctor.name}`,
                    },
                    unit_amount: appointmentData.doctor.appointmentFee * 100,
                },
                quantity: 1,
            }
        ],
        metadata: {
            appointmentId: appointmentData.id,
            paymentId: appointmentData.payment.id,
        },

        success_url: `${envVars.FRONTEND_URL}/payment/success?appointment_id=${appointmentData.id}&payment_id=${appointmentData.payment.id}`,

        cancel_url: `${envVars.FRONTEND_URL}/dashboard/my-appointments?error=payment_cancelled`,
    })

    return {
        paymentUrl: session.url,
    }
}

const cancelUnpaidAppointments = async () => {

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

    const unpaidAppointments = await prisma.appointment.findMany({
        where: {
            createdAt: {
                lte: thirtyMinutesAgo
            },
            paymentStatus: PaymentStatus.UNPAID
        }
    })

    const appointmentToCancel = unpaidAppointments.map(appointment => appointment.id)

    await prisma.$transaction(async (tx) => {

        await tx.appointment.updateMany({
            where: {
                id: {
                    in: appointmentToCancel
                }
            },
            data: {
                status: AppointmentStatus.CANCELED
            }
        })

        await tx.payment.deleteMany({
            where: {
                appointmentId: {
                    in: appointmentToCancel
                }
            }
        })

        for (const unpaidAppointment of unpaidAppointments) {
            await tx.doctorSchedules.update({
                where: {
                    doctorId_scheduleId: {
                        doctorId: unpaidAppointment.doctorId,
                        scheduleId: unpaidAppointment.scheduleId
                    }
                },
                data: {
                    isBooked: false
                }
            })

        }
    })

}



export const AppointmentService = {
    bookAppointment,
    getMyAppointments,
    changeAppointmentStatus,
    getMySingleAppointment,
    getAllAppointments,
    bookAppointmentWithPayLater,
    initiatePayment,
    cancelUnpaidAppointments,
}