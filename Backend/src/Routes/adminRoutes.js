import {Router} from "express";
import { loginAdmin , finddata, logoutAdmin } from "../Controllers/admin.Controller.js";
const adminRouter = Router();

adminRouter.post("/login", loginAdmin);
adminRouter.get("/finddata", finddata);
adminRouter.delete("/logoutAdmin", logoutAdmin);
export default adminRouter;
