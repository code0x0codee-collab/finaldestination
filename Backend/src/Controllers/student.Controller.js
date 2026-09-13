 import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { pool } from "../Database/index.js";

/**
 * Helper: build WHERE clause from allowed filters (query object).
 * Returns { whereSql, values } where whereSql is either "1" (no filters) or "col = ? AND ..."
 */
const buildWhere = (filters, allowed) => {
  const conditions = [];
  const values = [];

  for (const key of allowed) {
    if (filters[key] !== undefined && filters[key] !== "") {
      if (key === "name") {
        conditions.push("s.name LIKE ?");
        values.push(`%${filters[key]}%`);
      } else if (key === "from" || key === "to") {
        // handled separately by caller when needed
      } else {
        conditions.push(`s.${key} = ?`);
        values.push(filters[key]);
      }
    }
  }

  return {
    whereSql: conditions.length ? conditions.join(" AND ") : "1",
    values
  };
};

/**
 * GET /api/students
 * List students with filters, pagination & sorting
 * Query params: enrollment,name,email,mobile_number,department_id,branch_id,admission_year,page,limit,sort
 */
export const listStudents = asyncHandler(async (req, res) => {
  const {
    enrollment,
    name,
    email,
    mobile_number,
    department_id,
    branch_id,
    admission_year,
    page = 1,
    limit = 200,
    sort = "s.name:asc"
  } = req.query;

  const allowed = [
    "enrollment",
    "name",
    "email",
    "mobile_number",
    "department_id",
    "branch_id",
    "admission_year"
  ];

  const { whereSql, values } = buildWhere(
    { enrollment, name, email, mobile_number, department_id, branch_id, admission_year },
    allowed
  );

  // parse sort
  let [sortCol, sortDir] = sort.split(":");
  sortDir = (sortDir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

  // map simple sort keys to columns
  const sortMap = {
    name: "s.name",
    enrollment: "s.enrollment",
    admission_year: "s.admission_year"
  };
  const orderBy = sortMap[sortCol] || "s.name";

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
  const lim = Math.max(1, parseInt(limit, 10));

  // total count (for pagination)
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM student s
    LEFT JOIN department d ON s.department_id = d.department_id
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    WHERE ${whereSql}
  `;
  const [countRows] = await pool.query(countQuery, values);
  const total = countRows[0]?.total || 0;

  const query = `
    SELECT
      s.enrollment,
      s.name,
      s.email,
      s.mobile_number,
      s.admission_year,
      d.department_id,
      d.department_code,
      d.department_name,
      b.branch_id,
      b.branch_code,
      b.branch_name
    FROM student s
    LEFT JOIN department d ON s.department_id = d.department_id
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    WHERE ${whereSql}
    ORDER BY ${orderBy} ${sortDir}
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(query, [...values, lim, offset]);

  return res.status(200).json(
    new ApiResponse("Students list", rows, {
      page: parseInt(page, 10),
      limit: lim,
      total
    })
  );
});

/** 
 * GET /api/students/search
 * Flexible search endpoint (same filters as list but returns matches without pagination by default)
 * Query params similar to listStudents
 */
export const searchStudents = asyncHandler(async (req, res) => {
  const {
    q,
    enrollment,
    name,
    dob,                      
    date_of_admission,        
    father_name,
    mother_name,
    guardian_number,
    email,
    mobile_number,
    department_name,
    department_code,
    branch_name,
    branch_code,
    admission_year,   // ONLY THIS – exact matching
    city,
    state,
    pincode,
    country,
    address_line1,
    address_line2,     // support address_line2
    subject_name,
    transaction_reference,
    transaction_id,
    transaction_type,
  } = req.body;

  let where = [];
  let values = [];

  // Direct student fields
  if (enrollment) {
    where.push("s.enrollment = ?");
    values.push(enrollment);
  }

  if (name) {
    where.push("s.name LIKE ?");
    values.push(`%${name}%`);
  }

  // DOB: exact match only
  if (dob) {
    where.push("s.dob = ?");
    values.push(dob);
  }

  // Date of admission: exact match only
  if (date_of_admission) {
    where.push("s.date_of_admission = ?");
    values.push(date_of_admission);
  }

  if (father_name) {
    where.push("s.father_name LIKE ?");
    values.push(`%${father_name}%`);
  }

  if (mother_name) {
    where.push("s.mother_name LIKE ?");
    values.push(`%${mother_name}%`);
  }

  if (guardian_number) {
    where.push("s.guardian_number = ?");
    values.push(guardian_number);
  }

  if (email) {
    where.push("s.email = ?");
    values.push(email);
  }

  if (mobile_number) {
    where.push("s.mobile_number = ?");
    values.push(mobile_number);
  }

  // Exactly one-year match (no range)
  if (admission_year) {
    where.push("s.admission_year = ?");
    values.push(admission_year);
  }

  // Department / Branch
  if (department_name) {
    where.push("d.department_name LIKE ?");
    values.push(`%${department_name}%`);
  }

  if (department_code) {
    where.push("d.department_code = ?");
    values.push(department_code);
  }

  if (branch_name) {
    where.push("b.branch_name LIKE ?");
    values.push(`%${branch_name}%`);
  }

  if (branch_code) {
    where.push("b.branch_code = ?");
    values.push(branch_code);
  }

  // Address filters
  if (city) {
    where.push("a.city LIKE ?");
    values.push(`%${city}%`);
  }

  if (state) {
    where.push("a.state LIKE ?");
    values.push(`%${state}%`);
  }

  if (pincode) {
    where.push("a.pincode = ?");
    values.push(pincode);
  }

  if (country) {
    where.push("a.country LIKE ?");
    values.push(`%${country}%`);
  }

  if (address_line1) {
    where.push("a.address_line1 LIKE ?");
    values.push(`%${address_line1}%`);
  }

  // address_line2 filter
  if (address_line2) {
    where.push("a.address_line2 LIKE ?");
    values.push(`%${address_line2}%`);
  }

  // Subject filter
  if (subject_name) {
    where.push("sub.subject_name LIKE ?");
    values.push(`%${subject_name}%`);
  }

  // Transactions
  if (transaction_reference) {
    where.push("st.reference LIKE ?");
    values.push(`%${transaction_reference}%`);
  }

  if (transaction_id) {
    where.push("st.transaction_id = ?");
    values.push(transaction_id);
  }

  if (transaction_type) {
    where.push("st.transaction_type = ?");
    values.push(transaction_type);
  }

  // Global Search (q) — includes admission_year and both address lines and date fields as text
  if (q) {
    where.push(`(
      s.enrollment LIKE ? OR
      s.name LIKE ? OR
      s.email LIKE ? OR
      s.mobile_number LIKE ? OR
      s.guardian_number LIKE ? OR
      s.father_name LIKE ? OR
      s.mother_name LIKE ? OR
      d.department_name LIKE ? OR
      d.department_code LIKE ? OR
      b.branch_name LIKE ? OR
      b.branch_code LIKE ? OR
      a.city LIKE ? OR
      a.state LIKE ? OR
      a.pincode LIKE ? OR
      sub.subject_name LIKE ? OR
      st.reference LIKE ? OR
      a.address_line1 LIKE ? OR
      a.address_line2 LIKE ? OR
      CAST(s.admission_year AS CHAR) LIKE ? OR
      CAST(s.dob AS CHAR) LIKE ? OR
      CAST(s.date_of_admission AS CHAR) LIKE ?
    )`);

    const like = `%${q}%`;

    values.push(
      like, // s.enrollment
      like, // s.name
      like, // s.email
      like, // s.mobile_number
      like, // s.guardian_number
      like, // s.father_name
      like, // s.mother_name
      like, // d.department_name
      like, // d.department_code
      like, // b.branch_name
      like, // b.branch_code
      like, // a.city
      like, // a.state
      like, // a.pincode
      like, // sub.subject_name
      like, // st.reference
      like, // a.address_line1
      like, // a.address_line2
      like, // s.admission_year (as text)
      like, // s.dob (as text)
      like  // s.date_of_admission (as text)
    );
  }

  if (where.length === 0) {
    throw new ApiError(400, "At least one search parameter is required");
  }

  // MAIN QUERY — included address lines and date fields in SELECT so caller can see them
  const query = `
    SELECT DISTINCT
      s.enrollment,
      s.name,
      s.email,
      s.mobile_number,
      s.department_id,
      d.department_code,
      d.department_name,
      s.branch_id,
      b.branch_code,
      b.branch_name,
      s.admission_year,
      a.address_line1,
      a.address_line2,
      s.dob,
      s.date_of_admission
    FROM student s
    LEFT JOIN department d ON s.department_id = d.department_id
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    LEFT JOIN student_address a ON s.enrollment = a.enrollment
    LEFT JOIN student_subject ss ON s.enrollment = ss.enrollment
    LEFT JOIN subject sub ON ss.subject_id = sub.subject_id
    LEFT JOIN subject_assignment sa ON sub.subject_id = sa.subject_id
    LEFT JOIN teacher t ON sa.teacher_id = t.teacher_id
    LEFT JOIN student_transaction st ON s.enrollment = st.enrollment
    WHERE ${where.join(" AND ")}
    ORDER BY s.name ASC
  `;

  const [rows] = await pool.query(query, values);

  if (!rows.length) {
    throw new ApiError(404, "No student found with given details");
  }

  res.status(200).json(new ApiResponse("Students found", rows));
});






/**
 * GET /api/students/:enrollment
 * Get a single student's basic details (core + department + branch)
 */
export const getStudent = asyncHandler(async (req, res) => {
  const { enrollment } = req.params;

  if (!enrollment) throw new ApiError(400, "Enrollment is required");

  const query = `
    SELECT 
      s.enrollment,
      s.name,
      s.age,
      s.dob,
      s.date_of_admission,
      s.email,
      s.mobile_number,
      s.father_name,
      s.mother_name,
      s.guardian_number,
      s.admission_year,
      d.department_id,
      d.department_code,
      d.department_name,
      b.branch_id,
      b.branch_code,
      b.branch_name
    FROM student s
    LEFT JOIN department d ON s.department_id = d.department_id
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    WHERE s.enrollment = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(query, [enrollment]);

  if (rows.length === 0) {
    throw new ApiError(404, "Student not found");
  }

  return res.status(200).json(new ApiResponse("Student fetched", rows[0]));
});

/**
 * GET /api/students/:enrollment/address
 */
export const getAddress = asyncHandler(async (req, res) => {
  const { enrollment } = req.params;
  if (!enrollment) throw new ApiError(400, "Enrollment is required");

  const query = `
    SELECT enrollment, address_line1, address_line2, city, state, country, pincode
    FROM student_address
    WHERE enrollment = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(query, [enrollment]);
  return res.status(200).json(new ApiResponse("Address fetched", rows[0] || null));
});

/**
 * GET /api/students/:enrollment/status
 */
export const getStatus = asyncHandler(async (req, res) => {
  const { enrollment } = req.params;
  if (!enrollment) throw new ApiError(400, "Enrollment is required");

  const query = `
    SELECT enrollment, current_year, current_semester, last_updated
    FROM student_status
    WHERE enrollment = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(query, [enrollment]);
  return res.status(200).json(new ApiResponse("Status fetched", rows[0] || null));
});

/**
 * GET /api/students/:enrollment/cpi
 * Optional query: ?semester_no=2
 */
export const getCpiList = asyncHandler(async (req, res) => {
  const { enrollment } = req.params;
  const { semester_no } = req.query;
  if (!enrollment) throw new ApiError(400, "Enrollment is required");

  const values = [enrollment];
  let where = "enrollment = ?";

  if (semester_no !== undefined && semester_no !== "") {
    where += " AND semester_no = ?";
    values.push(semester_no);
  }

  const query = `
    SELECT semester_no, credits_taken, semester_cpi
    FROM cpi
    WHERE ${where}
    ORDER BY semester_no
  `;
  const [rows] = await pool.query(query, values);
  return res.status(200).json(new ApiResponse("CPI list fetched", rows));
});

/**
 * GET /api/students/:enrollment/subjects
 * Optional filters: academic_year, semester, status
 */
export const listSubjects = asyncHandler(async (req, res) => {
  const { enrollment } = req.params;
  const { academic_year, semester, status } = req.query;

  if (!enrollment) throw new ApiError(400, "Enrollment is required");

  const conditions = ["ss.enrollment = ?"];
  const values = [enrollment];

  if (academic_year) {
    conditions.push("ss.academic_year = ?");
    values.push(academic_year);
  }
  if (semester) {
    conditions.push("ss.semester = ?");
    values.push(semester);
  }
  if (status) {
    conditions.push("ss.status = ?");
    values.push(status);
  }

  const whereSql = conditions.join(" AND ");

  const query = `
    SELECT
      ss.student_subject_id,
      ss.enrollment,
      ss.academic_year,
      ss.semester,
      ss.grade,
      ss.status AS enrollment_status,
      sub.subject_id,
      sub.subject_code,
      sub.subject_name,
      sub.credits,
      sa.assignment_id,
      sa.teacher_id,
      sa.academic_year AS assignment_academic_year,
      sa.semester AS assignment_semester,
      t.teacher_id AS teacher_id,
      t.teacher_code,
      t.first_name AS teacher_first_name,
      t.last_name AS teacher_last_name,
      t.email AS teacher_email,
      t.mobile_number AS teacher_mobile
    FROM student_subject ss
    JOIN subject sub ON ss.subject_id = sub.subject_id
    LEFT JOIN subject_assignment sa
      ON ss.subject_id = sa.subject_id
     AND ss.academic_year = sa.academic_year
     AND ss.semester = sa.semester
    LEFT JOIN teacher t ON sa.teacher_id = t.teacher_id
    WHERE ${whereSql}
    ORDER BY ss.academic_year DESC, ss.semester DESC, sub.subject_code
  `;

  const [rows] = await pool.query(query, values);

  // Transform teacher info into nested object for clarity
  const subjects = rows.map(r => ({
    student_subject_id: r.student_subject_id,
    enrollment: r.enrollment,
    academic_year: r.academic_year,
    semester: r.semester,
    grade: r.grade,
    status: r.enrollment_status,
    subject: {
      subject_id: r.subject_id,
      subject_code: r.subject_code,
      subject_name: r.subject_name,
      credits: r.credits
    },
    assignment: r.assignment_id ? {
      assignment_id: r.assignment_id,
      academic_year: r.assignment_academic_year,
      semester: r.assignment_semester,
      teacher: r.teacher_id ? {
        teacher_id: r.teacher_id,
        teacher_code: r.teacher_code,
        first_name: r.teacher_first_name,
        last_name: r.teacher_last_name,
        email: r.teacher_email,
        mobile_number: r.teacher_mobile
      } : null
    } : null
  }));

  return res.status(200).json(new ApiResponse("Student subjects fetched", subjects));
});

/**
 * GET /api/students/:enrollment/transactions
 * Optional query: page, limit, type, from, to
 */
export const listTransactions = asyncHandler(async (req, res) => {
  const { enrollment } = req.params;
  const { page = 1, limit = 25, type, from, to } = req.query;

  if (!enrollment) throw new ApiError(400, "Enrollment is required");

  const conditions = ["enrollment = ?"];
  const values = [enrollment];

  if (type) {
    conditions.push("transaction_type = ?");
    values.push(type);
  }
  if (from) {
    conditions.push("occurred_at >= ?");
    values.push(from);
  }
  if (to) {
    conditions.push("occurred_at <= ?");
    values.push(to);
  }

  const whereSql = conditions.join(" AND ");

  // total count
  const countQuery = `SELECT COUNT(*) AS total FROM student_transaction WHERE ${whereSql}`;
  const [countRows] = await pool.query(countQuery, values);
  const total = countRows[0]?.total || 0;

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
  const lim = Math.max(1, parseInt(limit, 10));

  const query = `
    SELECT transaction_id, transaction_type, amount, occurred_at, reference, note
    FROM student_transaction
    WHERE ${whereSql}
    ORDER BY occurred_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(query, [...values, lim, offset]);

  return res.status(200).json(new ApiResponse("Transactions fetched", rows, {
    page: parseInt(page, 10),
    limit: lim,
    total
  }));
});

/**
 * GET /api/students/:enrollment/full-profile
 * Returns full aggregated data (student, address, status, cpiList, subjects, transactions)
 */
export const getStudentFullProfile = asyncHandler(async (req, res) => {
  const { enrollment } = req.params;
  if (!enrollment) throw new ApiError(400, "Enrollment is required");

  // Student core
  const studentQuery = `
    SELECT 
      s.enrollment,
      s.name,
      s.age,
      s.dob,
      s.date_of_admission,
      s.email,
      s.mobile_number,
      s.father_name,
      s.mother_name,
      s.guardian_number,
      s.admission_year,
      d.department_id,
      d.department_code,
      d.department_name,
      b.branch_id,
      b.branch_code,
      b.branch_name
    FROM student s
    LEFT JOIN department d ON s.department_id = d.department_id
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    WHERE s.enrollment = ?
    LIMIT 1
  `;

  const addressQuery = `
    SELECT enrollment, address_line1, address_line2, city, state, country, pincode
    FROM student_address
    WHERE enrollment = ?
    LIMIT 1
  `;

  const statusQuery = `
    SELECT enrollment, current_year, last_updated
    FROM student_status
    WHERE enrollment = ?
    LIMIT 1
  `;

  const cpiQuery = `
    SELECT semester_no, credits_taken, semester_cpi
    FROM cpi
    WHERE enrollment = ?
    ORDER BY semester_no
  `;

  const subjectsQuery = `
    SELECT
      ss.student_subject_id,
      ss.academic_year,
      ss.semester,
      ss.grade,
      ss.status AS enrollment_status,
      sub.subject_id,
      sub.subject_code,
      sub.subject_name,
      sub.credits,
      sa.assignment_id,
      sa.teacher_id,
      t.teacher_code,
      t.first_name AS teacher_first_name,
      t.last_name AS teacher_last_name,
      t.email AS teacher_email,
      t.mobile_number AS teacher_mobile
    FROM student_subject ss
    JOIN subject sub ON ss.subject_id = sub.subject_id
    LEFT JOIN subject_assignment sa
      ON ss.subject_id = sa.subject_id
     AND ss.academic_year = sa.academic_year
     AND ss.semester = sa.semester
    LEFT JOIN teacher t ON sa.teacher_id = t.teacher_id
    WHERE ss.enrollment = ?
    ORDER BY ss.academic_year DESC, ss.semester DESC, sub.subject_code
  `;

  const txQuery = `
    SELECT transaction_id, transaction_type, amount, occurred_at, reference, note
    FROM student_transaction
    WHERE enrollment = ?
    ORDER BY occurred_at DESC
    LIMIT 200
  `;

  // Run queries in parallel
  const [
    [studentRows],
    [addressRows],
    [statusRows],
    [cpiRows],
    [subjectRows],
    [txRows]
  ] = await Promise.all([
    pool.query(studentQuery, [enrollment]),
    pool.query(addressQuery, [enrollment]),
    pool.query(statusQuery, [enrollment]),
    pool.query(cpiQuery, [enrollment]),
    pool.query(subjectsQuery, [enrollment]),
    pool.query(txQuery, [enrollment])
  ]);

  if (!studentRows || studentRows.length === 0) {
    throw new ApiError(404, "Student not found");
  }

  const student = studentRows[0];
  const address = (addressRows && addressRows[0]) ? addressRows[0] : null;
  const status = (statusRows && statusRows[0]) ? statusRows[0] : null;
  const cpiList = cpiRows || [];
  const transactions = txRows || [];

  // Map subjects to nested structure with teacher info
  const subjects = (subjectRows || []).map(r => ({
    student_subject_id: r.student_subject_id,
    academic_year: r.academic_year,
    semester: r.semester,
    grade: r.grade,
    status: r.enrollment_status,
    subject: {
      subject_id: r.subject_id,
      subject_code: r.subject_code,
      subject_name: r.subject_name,
      credits: r.credits
    },
    assignment: r.assignment_id ? {
      assignment_id: r.assignment_id,
      teacher: r.teacher_id ? {
        teacher_id: r.teacher_id,
        teacher_code: r.teacher_code,
        first_name: r.teacher_first_name,
        last_name: r.teacher_last_name,
        email: r.teacher_email,
        mobile_number: r.teacher_mobile
      } : null
    } : null
  }));

  const result = {
    student,
    address,
    status,
    cpiList,
    subjects,
    transactions
  };

  return res.status(200).json(new ApiResponse("Student full profile fetched", result));
});

/**
 * GET /api/students/general-search
 * Accepts params in query OR body:
 *   q, enrollment, name, email, mobile_number, admission_year,
 *   department_name, branch_name, city, subject_name, teacher_name, transaction_reference,
 *   page, limit, sort, full
 *
 * full=1 -> returns full profile (student + address + status + cpi + subjects + transactions)
 * Default returns lightweight student list (core fields + dept/branch).
 */
export const generalSearch = asyncHandler(async (req, res) => {
  // allow both GET (query) and POST (body)
  const params = { ...req.query, ...(req.body || {}) };

  const {
    q,
    enrollment,
    name,
    email,
    mobile_number,
    admission_year,
    department_name,
    branch_name,
    city,
    subject_name,
    teacher_name,
    transaction_reference,
    page = 1,
    limit = 25,
    sort = "name:asc",
    full = "0",
    useFullText = "1" // set to "0" to disable MATCH...AGAINST and fallback to LIKE
  } = params;
  console.log(params);
  const where = [];
  const values = [];

  if (enrollment) { where.push("s.enrollment = ?"); values.push(enrollment); }
  if (name) { where.push("s.name LIKE ?"); values.push(`%${name}%`); }
  if (email) { where.push("s.email = ?"); values.push(email); }
  if (mobile_number) { where.push("s.mobile_number = ?"); values.push(mobile_number); }
  if (admission_year) { where.push("s.admission_year = ?"); values.push(admission_year); }
  if (department_name) { where.push("d.department_name LIKE ?"); values.push(`%${department_name}%`); }
  if (branch_name) { where.push("b.branch_name LIKE ?"); values.push(`%${branch_name}%`); }
  if (city) { where.push("a.city LIKE ?"); values.push(`%${city}%`); }
  if (subject_name) { where.push("sub.subject_name LIKE ?"); values.push(`%${subject_name}%`); }
  if (teacher_name) {
    where.push("CONCAT(t.first_name,' ',COALESCE(t.last_name,'')) LIKE ?");
    values.push(`%${teacher_name}%`);
  }
  if (transaction_reference) { where.push("st.reference LIKE ?"); values.push(`%${transaction_reference}%`); }

  // GLOBAL SEARCH: use MATCH ... AGAINST if enabled, otherwise fallback to LIKEs.
  if (q) {
    const raw = String(q).trim();
    const like = `%${raw}%`;
    const isYear = /^\d{4}$/.test(raw);
    const useFT = String(useFullText) === "1";

    if (useFT) {
      // Build FT clauses but choose NATURAL mode automatically if raw contains boolean-special chars
      const ftClauses = [];

      // detect boolean-special characters that can break boolean-mode parsing
      const booleanSpecial = /[+\-<>()~*"@\\]/;
      const ftBooleanMode = !booleanSpecial.test(raw);
      const ftModeSql = ftBooleanMode ? "IN BOOLEAN MODE" : "IN NATURAL LANGUAGE MODE";

      // student table fulltext (name, email)
      ftClauses.push(`MATCH(s.name, s.email) AGAINST(? ${ftModeSql})`);
      values.push(raw);

      // department table
      ftClauses.push(`MATCH(d.department_name) AGAINST(? ${ftModeSql})`);
      values.push(raw);

      // branch table
      ftClauses.push(`MATCH(b.branch_name) AGAINST(? ${ftModeSql})`);
      values.push(raw);

      // address (city)
      ftClauses.push(`MATCH(a.city) AGAINST(? ${ftModeSql})`);
      values.push(raw);

      // subject
      ftClauses.push(`MATCH(sub.subject_name) AGAINST(? ${ftModeSql})`);
      values.push(raw);

      // teacher (first_name, last_name)
      ftClauses.push(`MATCH(t.first_name, t.last_name) AGAINST(? ${ftModeSql})`);
      values.push(raw);

      // fallback LIKEs for enrollment, mobile, email and transaction reference
      const otherChecks = [
        "s.enrollment LIKE ?",
        "s.mobile_number LIKE ?",
        "s.email LIKE ?",
        "st.reference LIKE ?"
      ];
      values.push(like, like, like, like);

      // assemble clause and include admission_year if raw looks like year
      let clause = `(${ftClauses.join(" OR ")} OR ${otherChecks.join(" OR ")}`;
      if (isYear) {
        clause += " OR s.admission_year = ?";
        values.push(parseInt(raw, 10));
      }
      clause += ")";

      where.push(clause);
    } else {
      // fallback to previous LIKE-based searching
      if (/^ENR/i.test(raw)) {
        // if looks like enrollment code, try exact + like
        where.push("(s.enrollment = ? OR s.enrollment LIKE ?)");
        values.push(raw, like);
      } else if (isYear) {
        // year -> admission_year plus like checks
        where.push(`(
          s.admission_year = ? OR
          s.enrollment LIKE ? OR
          s.name LIKE ? OR
          s.email LIKE ? OR
          s.mobile_number LIKE ? OR
          d.department_name LIKE ? OR
          b.branch_name LIKE ? OR
          a.city LIKE ? OR
          sub.subject_name LIKE ? OR
          CONCAT(t.first_name,' ',COALESCE(t.last_name,'')) LIKE ?
        )`);
        values.push(parseInt(raw, 10), like, like, like, like, like, like, like, like);
      } else {
        where.push(`(
          s.enrollment LIKE ? OR
          s.name LIKE ? OR
          s.email LIKE ? OR
          s.mobile_number LIKE ? OR
          d.department_name LIKE ? OR
          b.branch_name LIKE ? OR
          a.city LIKE ? OR
          sub.subject_name LIKE ? OR
          CONCAT(t.first_name,' ',COALESCE(t.last_name,'')) LIKE ?
        )`);
        values.push(like, like, like, like, like, like, like, like, like);
      }
    }
  }

  if (where.length === 0) {
    throw new ApiError(400, "At least one search parameter is required");
  }

  // sort mapping
  let [sortCol, sortDir] = (sort || "name:asc").split(":");
  sortDir = (sortDir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";
  const sortMap = {
    name: "s.name",
    enrollment: "s.enrollment",
    admission_year: "s.admission_year"
  };
  const orderBy = sortMap[sortCol] || "s.name";

  const pageNum = Math.max(1, parseInt(page, 10));
  const lim = Math.max(1, parseInt(limit, 10));
  const offset = (pageNum - 1) * lim;

  // Count distinct students matching filters (for pagination)
  const countQuery = `
    SELECT COUNT(DISTINCT s.enrollment) AS total
    FROM student s
    LEFT JOIN department d ON s.department_id = d.department_id
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    LEFT JOIN student_address a ON s.enrollment = a.enrollment
    LEFT JOIN student_subject ss ON s.enrollment = ss.enrollment
    LEFT JOIN subject sub ON ss.subject_id = sub.subject_id
    LEFT JOIN subject_assignment sa ON sub.subject_id = sa.subject_id
    LEFT JOIN teacher t ON sa.teacher_id = t.teacher_id
    LEFT JOIN student_transaction st ON s.enrollment = st.enrollment
    WHERE ${where.join(" AND ")}
  `;

  const [countRows] = await pool.query(countQuery, values);
  const total = countRows[0]?.total || 0;

  // Determine order column and a safe alias for use in SELECT + ORDER BY
  const orderByCol = orderBy; // e.g. "s.name"
  const enrollQuery = `
    SELECT DISTINCT s.enrollment, ${orderByCol} AS _sort_col
    FROM student s
    LEFT JOIN department d ON s.department_id = d.department_id
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    LEFT JOIN student_address a ON s.enrollment = a.enrollment
    LEFT JOIN student_subject ss ON s.enrollment = ss.enrollment
    LEFT JOIN subject sub ON ss.subject_id = sub.subject_id
    LEFT JOIN subject_assignment sa ON sub.subject_id = sa.subject_id
    LEFT JOIN teacher t ON sa.teacher_id = t.teacher_id
    LEFT JOIN student_transaction st ON s.enrollment = st.enrollment
    WHERE ${where.join(" AND ")}
    ORDER BY _sort_col ${sortDir}
    LIMIT ? OFFSET ?
  `;

  // append pagination params (note: values already contains the q-related params and other filters)
  const enrollParams = [...values, lim, offset];
  const [enrollRows] = await pool.query(enrollQuery, enrollParams);
  const enrollments = enrollRows.map(r => r.enrollment);

  if (!enrollments.length) {
    throw new ApiError(404, "No student found with given details");
  }

  // Lightweight result query (default)
  const lightQuery = `
    SELECT s.enrollment, s.name, s.email, s.mobile_number, s.admission_year,
           d.department_id, d.department_code, d.department_name,
           b.branch_id, b.branch_code, b.branch_name
    FROM student s
    LEFT JOIN department d ON s.department_id = d.department_id
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    WHERE s.enrollment IN (${enrollments.map(() => "?").join(",")})
    ORDER BY ${orderBy} ${sortDir}
  `;
  const [lightRows] = await pool.query(lightQuery, enrollments);

  // If full requested, assemble full profiles (re-using your queries)
  if (String(full) === "1") {
    const studentQuery = `SELECT s.enrollment, s.name, s.age, s.dob, s.date_of_admission,
      s.email, s.mobile_number, s.father_name, s.mother_name, s.guardian_number, s.admission_year,
      d.department_id, d.department_code, d.department_name,
      b.branch_id, b.branch_code, b.branch_name
      FROM student s
      LEFT JOIN department d ON s.department_id = d.department_id
      LEFT JOIN branch b ON s.branch_id = b.branch_id
      WHERE s.enrollment = ? LIMIT 1`;

    const addressQuery = `SELECT enrollment, address_line1, address_line2, city, state, country, pincode
      FROM student_address WHERE enrollment = ? LIMIT 1`;

    const statusQuery = `SELECT enrollment, current_year, current_semester, last_updated
      FROM student_status WHERE enrollment = ? LIMIT 1`;

    const cpiQuery = `SELECT semester_no, credits_taken, semester_cpi
      FROM cpi WHERE enrollment = ? ORDER BY semester_no`;

    const subjectsQuery = `
      SELECT ss.student_subject_id, ss.academic_year, ss.semester, ss.grade, ss.status AS enrollment_status,
             sub.subject_id, sub.subject_code, sub.subject_name, sub.credits,
             sa.assignment_id, sa.teacher_id,
             t.teacher_code, t.first_name AS teacher_first_name, t.last_name AS teacher_last_name,
             t.email AS teacher_email, t.mobile_number AS teacher_mobile
      FROM student_subject ss
      JOIN subject sub ON ss.subject_id = sub.subject_id
      LEFT JOIN subject_assignment sa
        ON ss.subject_id = sa.subject_id
       AND ss.academic_year = sa.academic_year
       AND ss.semester = sa.semester
      LEFT JOIN teacher t ON sa.teacher_id = t.teacher_id
      WHERE ss.enrollment = ?
      ORDER BY ss.academic_year DESC, ss.semester DESC, sub.subject_code
    `;

    const txQuery = `SELECT transaction_id, transaction_type, amount, occurred_at, reference, note
      FROM student_transaction WHERE enrollment = ? ORDER BY occurred_at DESC LIMIT 200`;

    const profiles = await Promise.all(enrollments.map(async (enr) => {
      const [
        [studentRows],
        [addressRows],
        [statusRows],
        [cpiRows],
        [subjectRows],
        [txRows]
      ] = await Promise.all([
        pool.query(studentQuery, [enr]),
        pool.query(addressQuery, [enr]),
        pool.query(statusQuery, [enr]),
        pool.query(cpiQuery, [enr]),
        pool.query(subjectsQuery, [enr]),
        pool.query(txQuery, [enr])
      ]);

      const student = studentRows && studentRows[0] ? studentRows[0] : null;
      const address = addressRows && addressRows[0] ? addressRows[0] : null;
      const status = statusRows && statusRows[0] ? statusRows[0] : null;
      const cpiList = cpiRows || [];
      const transactions = txRows || [];

      const subjects = (subjectRows || []).map(r => ({
        student_subject_id: r.student_subject_id,
        academic_year: r.academic_year,
        semester: r.semester,
        grade: r.grade,
        status: r.enrollment_status,
        subject: {
          subject_id: r.subject_id,
          subject_code: r.subject_code,
          subject_name: r.subject_name,
          credits: r.credits
        },
        assignment: r.assignment_id ? {
          assignment_id: r.assignment_id,
          teacher: r.teacher_id ? {
            teacher_id: r.teacher_id,
            teacher_code: r.teacher_code,
            first_name: r.teacher_first_name,
            last_name: r.teacher_last_name,
            email: r.teacher_email,
            mobile_number: r.teacher_mobile
          } : null
        } : null
      }));

      return { student, address, status, cpiList, subjects, transactions };
    }));

    return res.status(200).json(new ApiResponse("Students found (full)", profiles, {
      page: pageNum, limit: lim, total
    }));
  }

  // Default lightweight response (paginated)
  return res.status(200).json(new ApiResponse("Students found", lightRows, {
    page: pageNum, limit: lim, total
  }));
});

export const selectStudentController = asyncHandler(async (req, res) => {
  const query = `
    SELECT 
      * 
    FROM student s
    left join department d ON s.department_id = d.department_id
    left join branch b ON s.branch_id = b.branch_id
    LIMIT 30
  `;

  const [rows] = await pool.query(query); // removed values

  console.log(rows);

  return res
    .status(200)
    .json(new ApiResponse("Student fetched", rows));
});

export const getTotalStudents = asyncHandler(async (req, res) => {
  // change table name if different (e.g. student_master)
  const sql = `SELECT COUNT(*) AS total FROM student`;

  const result = await pool.query(sql);
  // many drivers return counts as strings, so parseInt defensively
  const total = result?.[0][0]?.total ?? result?.[0]?.total ?? 0;
  const totalNum = Number.isFinite(Number(total)) ? parseInt(total, 10) : 0;

  return res.json({
    statusCode: 200,
    data: { totalStudents: totalNum },
    success: true,
  });
});


export const getDepartmentBranchStats = asyncHandler(async (req, res) => {

  /* ---------------- Department count ---------------- */
  const [deptRows] = await pool.query(`
    SELECT 
      d.department_name AS name,
      COUNT(s.enrollment) AS count
    FROM department d
    LEFT JOIN student s ON s.department_id = d.department_id
    GROUP BY d.department_id
    ORDER BY count DESC
  `);

  /* ---------------- Branch count ---------------- */
  const [branchRows] = await pool.query(`
    SELECT 
      b.branch_name AS name,
      COUNT(s.enrollment) AS count
    FROM branch b
    LEFT JOIN student s ON s.branch_id = b.branch_id
    GROUP BY b.branch_id
    ORDER BY count DESC
  `);

  return res.status(200).json(
    new ApiResponse(200, {
      departments: deptRows,
      branches: branchRows
    }, "Department & Branch stats fetched")
  );
});
