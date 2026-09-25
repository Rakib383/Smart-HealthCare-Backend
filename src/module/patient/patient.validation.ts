import z from "zod";
import { BloodGroup, Gender } from "../../generated/prisma/enums";

 const updatePatientProfileZodSchema = z.object({

    patientInfo: z.object({
        name:z.string("name must be a string").min(1,"name can't be empty").max(100,"name must be less than 100 char").optional(),
        profilePhoto:z.url("profile photo must be a valid url").optional(),
        contactNumber:z.string("contact number must be less than 20 char").optional(),
        address:z.string("address must be empty").max(200,"address must be less than 200 char").optional()

    }).optional(),
    patientHealthData:z.object({
        gender: z.enum(Gender).optional(),

        dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)),{
            message:"invalid date format"
        }).optional(),

        bloodGroup: z.enum(BloodGroup).optional(),

        hasAllergies: z.boolean().optional(),
        hasDiabetes: z.boolean().optional(),

        height: z.string().optional(),
        weight: z.string().optional(),

        smokingStatus: z.boolean().optional(),

        dietaryPreferences: z.string().optional(),

        pregnancyStatus: z.boolean().optional(),

        mentalHealthHistory: z.string().optional(),

        immunizationStatus: z.string().optional(),

        hasPastSurgeries: z.boolean().optional(),

        recentAnxiety: z.boolean().optional(),

        recentDepression: z.boolean().optional(),

        maritalStatus: z.string().optional(),
    }).optional(),
    medicalReports:z.array(z.object({
        shouldDelete:z.boolean().optional(),
        reportId:z.uuid().optional(),
        reportName:z.string().optional(),
        reportLink:z.url().optional()
    })).optional().refine((reports) => {
        if (!reports || reports.length === 0) return true;

        for (const report of reports) {

            if(report.shouldDelete === true && !report.reportId) {
                return false;
            }

            if(report.reportId && !report.shouldDelete) {

                return false
            }

            if(report.reportName && !report.reportLink) {

                return false
            }

            if(report.reportLink && !report.reportName) {
                return false
            }

        }

        return true;
    },{
        message:"invalid medical report data."
    })
})


export const PatientValidation = {
    updatePatientProfileZodSchema
}

