import { Router } from "express";
import {
    listStudents,
    getStudent,
  getAddress,
  getStatus,
  getCpiList,
  listSubjects,
  listTransactions,
  searchStudents,
  getStudentFullProfile,
  generalSearch,
  selectStudentController,
  getTotalStudents,
  getDepartmentBranchStats
} from "../Controllers/student.Controller.js"; 
import authMiddleware from "../Middlewares/auth.middlewares.js";
const router =Router();


// MAIN LOOKUP 
router.get("/",authMiddleware, listStudents);

//mainUsed Router
router.route("/search").post(authMiddleware, searchStudents);
router.route("/searchall").post(authMiddleware, selectStudentController);
router.route("/totalstudent").get(authMiddleware, getTotalStudents);
router.get("/department-branch-stats" , authMiddleware, getDepartmentBranchStats)
router.get("/fullprofile/:enrollment",authMiddleware, getStudentFullProfile);

router.get("/:enrollment",authMiddleware, getStudent);
router.get("/textsearch", generalSearch);

// RELATED TABLE LOOKUPS
router.get("/:enrollment/address", getAddress);
router.get("/:enrollment/status", getStatus);
router.get("/:enrollment/cpi", getCpiList);
router.get("/:enrollment/subjects", listSubjects);
router.get("/:enrollment/transactions", listTransactions);
export default router;