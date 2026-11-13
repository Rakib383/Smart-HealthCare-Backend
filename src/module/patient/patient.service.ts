import { deleteFileFromCloudinary } from "../../config/cloudinary.config";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { IUpdatePatientHealthDataPayload, IUpdatePatientProfilePayload } from "./patient.interface";
import { convertToDateTime } from "./patient.utils";
import status from "http-status";
import AppError from "../../errorHelpers/appError";
import { UserStatus } from "../../generated/prisma/enums";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Patient, Prisma } from "../../generated/prisma/client";

const getAllPatients = async (query: IQueryParams) => {
    const queryBuilder = new QueryBuilder<Patient, Prisma.PatientWhereInput, Prisma.PatientInclude>(
        prisma.patient,
        query,
        {
            searchableFields: ["name", "email"],
            filterableFields: ["user.status"],
        },
    );

    return await queryBuilder
        .search()
        .filter()
        .where({
            isDeleted: false,
            user: { isDeleted: false },
        })
        .include({ user: true })
        .paginate()
        .sort()
        .execute();
};

const getMyHealthRecords = async (user: IRequestUser) => {
    return prisma.patient.findUniqueOrThrow({
        where: {
            email: user.email
        },
        include: {
            patientHealthData: true,
            medicalReports: {
                orderBy: {
                    createdAt: "desc"
                }
            }
        }
    });
};

const deletePatient = async (id: string) => {
    const patient = await prisma.patient.findUnique({
        where: { id },
    });

    if (!patient || patient.isDeleted) {
        throw new AppError(status.NOT_FOUND, "Patient not found");
    }

    await prisma.$transaction(async (tx) => {
        await tx.patient.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });

        await tx.user.update({
            where: { id: patient.userId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                status: UserStatus.DELETED,
            },
        });

        await tx.session.deleteMany({
            where: { userId: patient.userId },
        });
    });

    return { message: "Patient deleted successfully" };
};


const updateMyProfile = async (user:IRequestUser,payload:IUpdatePatientProfilePayload) => {

    const patientData = await prisma.patient.findUniqueOrThrow({
        where:{
            email:user.email
        },
        include:{
            patientHealthData:true,
            medicalReports:true
        }
    })

    await prisma.$transaction(async (tx) => {
        if(payload.patientInfo) {
            await tx.patient.update({
                where:{
                    id:patientData.id
                },
                data:{
                    ...payload.patientInfo
                }
            })

            if(payload.patientInfo.name || payload.patientInfo.profilePhoto) {
            
                const userData = {
                    name:payload.patientInfo.name ? payload.patientInfo.name: patientData.name,
                    image: payload.patientInfo.profilePhoto ? payload.patientInfo.profilePhoto : patientData.profilePhoto
                }

                await tx.user.update({
                    where: {
                        id: patientData.userId
                    },
                    data: {
                       ...userData
                    }
                })

            }
           
        }

        if (payload.patientHealthData) {

            const healthDataToSave: IUpdatePatientHealthDataPayload = {
                ...payload.patientHealthData
            }

            if (payload.patientHealthData.dateOfBirth) {

                healthDataToSave.dateOfBirth = convertToDateTime(
                    typeof healthDataToSave.dateOfBirth === "string" ? healthDataToSave.dateOfBirth : undefined

                ) as Date;

            }

            await tx.patientHealthData.upsert({
                where:{
                    patientId:patientData.id
                },
                update:healthDataToSave,
                create:{
                    patientId:patientData.id,
                    ...healthDataToSave
                }
            })
        }

        if(payload.medicalReports && Array.isArray(payload.medicalReports) && payload.medicalReports.length > 0) {

            
            for(const report of payload.medicalReports) {

                if(report.shouldDelete && report.reportId) {
                    const reportToDelete = await tx.medicalReport.findFirst({
                        where: {
                            id: report.reportId,
                            patientId: patientData.id
                        }
                    })

                    if (!reportToDelete) {
                        throw new AppError(status.NOT_FOUND, "Medical report not found")
                    }

                    const deletedReport = await tx.medicalReport.delete({
                        where:{
                            id:reportToDelete.id
                        }
                    })

                    if(deletedReport.reportLink) {

                        await deleteFileFromCloudinary(deletedReport.reportLink)
                    }


                } else if(report.reportName && report.reportLink) {
                    await tx.medicalReport.create({
                        data:{
                            patientId:patientData.id,
                            reportName:report.reportName,
                            reportLink:report.reportLink
                        }
                    })
                }
            }
        }


    })

    const result = await prisma.patient.findUnique({
        where:{
            id:patientData.id
        },
        include:{
            user:true,
            patientHealthData:true,
            medicalReports:true
        }
    })

    return result

}

export const PatientService = {
    getAllPatients,
    getMyHealthRecords,
    deletePatient,
    updateMyProfile
}
