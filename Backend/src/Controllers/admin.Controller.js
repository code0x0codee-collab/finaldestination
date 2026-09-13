import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { pool } from "../Database/index.js";
import jwt from "jsonwebtoken";




// Create JWT safely (only send safe fields)
function setUser(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: "admin",
  };

  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
}

function verifyUser(token) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
}

const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }
  console.log(email, password)
  // Fetch admin
  const [rows] = await pool.query(
    "SELECT * FROM admin WHERE email = ? and password_hash =?",
    [email,password]
  );
  console.log(rows)
  if (!rows.length) {
    throw new ApiError(401, "Invalid email or password");
  }

  const admin = rows[0];

  // Generate JWT
  const token = setUser(admin);

  res
    .cookie("_id", token, {
      httpOnly: true,
      
      secure: false, // set true in production
    })
    .status(200)
    .json(new ApiResponse(200, "Login successful", { id: admin.id, email: admin.email }));
});

const finddata= asyncHandler(async(req,res) => {
  const data = req.cookies;
  const actualdata = verifyUser(data._id);
  console.log(actualdata);
  res.status(200).json(new ApiResponse("User data", actualdata));

}); 

const logoutAdmin = asyncHandler(async (req, res) => {
  res
    .clearCookie("_id")
    .status(200)
    .json(new ApiResponse(200, "Logout successful"));
});


export { loginAdmin, verifyUser, finddata , logoutAdmin };
