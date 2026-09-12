import z from "zod";

const createSpecialtyZodSchema = z.object({
    title:z.string("Title is required"),
    description:z.string().optional(),
})


export const specialtyValidation = {
    createSpecialtyZodSchema
}
