import { Router } from "express";
import { specialtyRoutes } from "../module/specialty/specialty.route";
import { AuthRoutes } from "../module/auth/auth.route";
import { UserRoutes } from "../module/user/user.route";
import { doctorRoutes } from "../module/doctor/doctor.route";
import { AdminRoutes } from "../module/admin/admin.route";
import { scheduleRoutes } from "../module/schedule/schedule.route";
import { DoctorScheduleRoutes } from "../module/doctorSchedule/doctorSchedule.route";
import { AppointmentRoutes } from "../module/appointment/appointment.route";

export const indexRoutes = Router()

indexRoutes.use("/auth", AuthRoutes)
indexRoutes.use("/specialties", specialtyRoutes)
indexRoutes.use("/users", UserRoutes)
indexRoutes.use("/doctors", doctorRoutes)
indexRoutes.use("/admins",AdminRoutes)
indexRoutes.use("/schedules",scheduleRoutes)
indexRoutes.use("/doctor-schedules",DoctorScheduleRoutes)
indexRoutes.use("/appointments",AppointmentRoutes)
