import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pool } from "../Database/index.js";
import jwt from "jsonwebtoken";

const authMiddleware = asyncHandler(async (req, _, next) => {
  try {
    // safe logging
    console.log('req.cookies:', req.cookies); 
    console.log('cookie _id:', req.cookies?._id);

    // get token from cookie or Authorization header
    let token = req.cookies?._id || (req.header("Authorization")?.split(' ')[1]);

    if (!token) {
      throw new ApiError(401, "access Token not found");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const val = decoded?.id;
    if (!val) throw new ApiError(401, "Invalid token payload");

    // pool.query usually returns [rows, fields] — adjust accordingly
    const [rows] = await pool.query("SELECT * FROM admin WHERE id = ?", [val]);

    // rows is an array; check its length
    if (!rows || rows.length === 0) {
      throw new ApiError(401, "Something wrong in authMiddleware - user not found");
    }

    // remove sensitive fields if needed
    const user = rows[0];
    delete user.password; // optional

    req.user = user;
    next();
  } catch (error) {
    // forward original message when possible
    next(new ApiError(401, error?.message || "Invalid access token"));
  }
});

export default authMiddleware;
