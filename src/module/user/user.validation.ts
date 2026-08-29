import z from "zod";
import { Gender } from "../../generated/prisma/enums";


export const createDoctorZodSchema = z.object({
    password: z.string("password is required").min(6, "password must be at least 6 characters").max(20, "password must be at most 20 characters"),
    doctor: z.object({
        name: z.string("name is required").min(5, "name must be at least 5").max(30, "name must be at most 30 characters"),
        email: z.email("invalid email address"),
        contactNumber: z.string("contact number is required"),
        address: z.string("address is required").optional(),
        registrationNumber: z.string("registration number is required"),
        experience: z.int("experience must bean integer").nonnegative("experience can not be negative").optional(),
        gender: z.enum([Gender.FEMALE, Gender.FEMALE], "gender must be either male or female"),
        appointmentFee: z.number("appointment fee must be a number").nonnegative("appointment fee can't be negative"),
        qualification: z.string("qualification is required").min(2, "qualification must be at least 2"),
        currentWorkingPlace: z.string("current working place is required").min(2, "current working place must be at least 2 characters"),

        designation: z.string("designation is required").min(2, "designation must be at least 2 characters"),
    }),
    specialties: z.array(z.uuid(), "specialties must be an array of strings").min(1, "at least one specialty is required ")
})