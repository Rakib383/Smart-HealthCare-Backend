import { prisma } from "../../lib/prisma"


const getAllDoctors = async()=> {

    const doctors = await prisma.doctor.findMany({
        include:{
            user:true,
            specialties:{
                include:{
                    specialty:true
                }
            }

        }
    })

return doctors

}



export const DoctorServices = {
    getAllDoctors
}