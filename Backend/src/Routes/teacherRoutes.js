import express from "express";
import { getTeacherBasic, getTeacherFull,searchTeachers,setTeacherController,getTotalTeachers } from "../Controllers/teacher.Controller.js";
import authMiddleware from "../Middlewares/auth.middlewares.js";
const teacherRouter = express.Router();

teacherRouter.route("/search").post(authMiddleware, searchTeachers);
teacherRouter.route("/searchall").post(authMiddleware, setTeacherController);
teacherRouter.get("/totalteacher", authMiddleware, getTotalTeachers);
teacherRouter.get("/:teacherId",authMiddleware, getTeacherFull);


export default teacherRouter;
 