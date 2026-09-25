import { BloodGroup, Gender } from "../../generated/prisma/enums";

export interface IUpdatePatientInfoPayload {

    name?:string;
    profilePhoto?:string;
    contactNumber ?: string;
    address ?: string;
}


export interface IUpdatePatientHealthDataPayload {
    gender: Gender;
    dateOfBirth: Date;
    bloodGroup: BloodGroup;
    hasAllergies: boolean;
    hasDiabetes: boolean;
    height: string;
    weight: string;
    smokingStatus: boolean;
    dietaryPreferences?: string | null;
    pregnancyStatus: boolean;
    mentalHealthHistory?: string | null;
    immunizationStatus?: string | null;
    hasPastSurgeries: boolean;
    recentAnxiety: boolean;
    recentDepression: boolean;
    maritalStatus?: string | null;
}

export interface IUpdatePatientMedicalReportPayload {
    reportName?:string;
    reportLink?:string;
    shouldDelete?:boolean;
    reportId?:string;
}

export interface IUpdatePatientProfilePayload {

    patientInfo?: IUpdatePatientInfoPayload;
    patientHealthData?:IUpdatePatientHealthDataPayload;
    medicalReports?:IUpdatePatientMedicalReportPayload[];
}