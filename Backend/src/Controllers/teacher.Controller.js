import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { pool } from "../Database/index.js";

/* ----------------------------------------------------------
   1) BASIC TEACHER DATA (teacher table only)
----------------------------------------------------------- */
export const getTeacherBasic = asyncHandler(async (req, res) => {
  const teacherId = req.params.id;  // TCH001 etc.

  if (!teacherId) {
    throw new ApiError(400, "Invalid teacher ID");
  }

  const query = `
    SELECT teacher_id, teacher_code, first_name, last_name,
           email, mobile_number, hire_date, notes
    FROM teacher
    WHERE teacher_code = ?
  `;

  // IMPORTANT for MySQL:
  const [rows] = await pool.query(query, [teacherId]);

  if (rows.length === 0) {
    throw new ApiError(404, "Teacher not found");
  }

  console.log(rows[0]);  // correct

  return res
    .status(200)
    .json(new ApiResponse(200, rows[0], "Teacher data fetched"));
});

/* ----------------------------------------------------------
   2) FULL TEACHER PROFILE
   Includes:
   - Teacher table data
   - Teacher detail table (dob, qualification, etc.)
   - Subjects assigned (subject_assignment + subject)
   - Student count (how many students the teacher actually teaches)
   - Branches attached to teacher
----------------------------------------------------------- */

export const getTeacherFull = asyncHandler(async (req, res) => {
  const teacherCode = req.params.teacherId; // e.g. "TCH001"
  console.log("Fetching full profile for teacherCode:", teacherCode);
  if (!teacherCode) {
    throw new ApiError(400, "Invalid teacher ID");
  }

  // 1) Fetch base teacher row by teacher_code
  const teacherBaseQuery = `
    SELECT teacher_id, teacher_code, first_name, last_name,
           email, mobile_number, hire_date, notes
    FROM teacher
    WHERE teacher_code = ?
    LIMIT 1
  `;
  const [teacherRows] = await pool.query(teacherBaseQuery, [teacherCode]);

  if (!teacherRows || teacherRows.length === 0) {
    throw new ApiError(404, "Teacher not found");
  }
  const teacher = teacherRows[0];
  const teacherId = teacher.teacher_id; // numeric id used for joins

  // 2) Fetch teacher_detail (if exists)
  const detailQuery = `
    SELECT teacher_id, dob, qualification, experience_years, address
    FROM teacher_detail
    WHERE teacher_id = ?
    LIMIT 1
  `;
  const [detailRows] = await pool.query(detailQuery, [teacherId]);
  const teacher_detail = detailRows && detailRows.length ? detailRows[0] : null;

  // 3) Fetch subjects assigned to the teacher
  const subjectsQuery = `
    SELECT sa.assignment_id, sa.subject_id, s.subject_code, s.subject_name,
           s.credits, sa.academic_year, sa.semester, s.department_id
    FROM subject_assignment sa
    JOIN subject s ON s.subject_id = sa.subject_id
    WHERE sa.teacher_id = ?
    ORDER BY sa.academic_year DESC, sa.semester DESC, s.subject_name
  `;
  const [subjectsRows] = await pool.query(subjectsQuery, [teacherId]);
  const subjects = subjectsRows || [];

  // 4) Count distinct students taught by this teacher (matching subject_id + academic_year + semester)
  let student_count = 0;
  if (subjects.length > 0) {
    const countQuery = `
      SELECT COUNT(DISTINCT ss.enrollment) AS student_count
      FROM subject_assignment sa
      JOIN student_subject ss
        ON sa.subject_id = ss.subject_id
       AND sa.academic_year = ss.academic_year
       AND sa.semester = ss.semester
      WHERE sa.teacher_id = ?
        AND ss.status IN ('enrolled','completed')
    `;
    const [countRows] = await pool.query(countQuery, [teacherId]);
    student_count = (countRows && countRows.length) ? Number(countRows[0].student_count) || 0 : 0;
  }

  // 5) Get distinct branches where those students belong
  let branches = [];
  if (subjects.length > 0) {
    const branchQuery = `
      SELECT DISTINCT b.branch_id, b.branch_code, b.branch_name, b.department_id
      FROM subject_assignment sa
      JOIN student_subject ss
        ON sa.subject_id = ss.subject_id
       AND sa.academic_year = ss.academic_year
       AND sa.semester = ss.semester
      JOIN student st ON st.enrollment = ss.enrollment
      JOIN branch b ON b.branch_id = st.branch_id
      WHERE sa.teacher_id = ?
    `;
    const [branchRows] = await pool.query(branchQuery, [teacherId]);
    branches = branchRows || [];
  }

  // final response
  return res.status(200).json(
    new ApiResponse(200, {
      teacher,
      teacher_detail,
      subjects,
      student_count,
      branches
    }, "Full teacher profile fetched")
  );
});

export const searchTeachers = asyncHandler(async (req, res) => {
  const {
    q,
    teacher_id,
    teacher_code,
    name,            // search in first_name + last_name
    email,
    mobile_number,
    department_name,
    branch_name,
    branch_id,
    subject_name,
    qualification,
    hire_date_from,
    hire_date_to
  } = req.body;

  const where = [];
  const values = [];

  // Direct teacher fields
  if (teacher_id) {
    where.push("t.teacher_id = ?");
    values.push(teacher_id);
  }

  if (teacher_code) {
    where.push("t.teacher_code = ?");
    values.push(teacher_code);
  }

  if (name) {
    // search in "first_name last_name"
    where.push("CONCAT(t.first_name, ' ', COALESCE(t.last_name,'')) LIKE ?");
    values.push(`%${name}%`);
  }

  if (email) {
    where.push("t.email = ?");
    values.push(email);
  }

  if (mobile_number) {
    where.push("t.mobile_number = ?");
    values.push(mobile_number);
  }

  // teacher_detail fields
  if (qualification) {
    where.push("td.qualification LIKE ?");
    values.push(`%${qualification}%`);
  }

  // department filter (via subject -> department)
  if (department_name) {
    where.push("d.department_name LIKE ?");
    values.push(`%${department_name}%`);
  }

  // branch filter:
  // - b: branch of students who took the teacher's subjects
  // - dept_branch: branches that belong to subject.department_id
  if (branch_name) {
    where.push("(b.branch_name LIKE ? OR dept_branch.branch_name LIKE ?)");
    values.push(`%${branch_name}%`, `%${branch_name}%`);
  }
  if (branch_id) {
    where.push("(b.branch_id = ? OR dept_branch.branch_id = ?)");
    values.push(branch_id, branch_id);
  }

  // subject filter
  if (subject_name) {
    where.push("sub.subject_name LIKE ?");
    values.push(`%${subject_name}%`);
  }

  // hire date range
  if (hire_date_from) {
    where.push("t.hire_date >= ?");
    values.push(hire_date_from);
  }
  if (hire_date_to) {
    where.push("t.hire_date <= ?");
    values.push(hire_date_to);
  }

  // Global search 'q' (across many teacher-related fields)
  if (q) {
    where.push(`(
      t.teacher_code LIKE ? OR
      CONCAT(t.first_name, ' ', COALESCE(t.last_name,'')) LIKE ? OR
      t.email LIKE ? OR
      t.mobile_number LIKE ? OR
      td.qualification LIKE ? OR
      d.department_name LIKE ? OR
      sub.subject_name LIKE ? OR
      b.branch_name LIKE ? OR
      dept_branch.branch_name LIKE ?
    )`);
    const like = `%${q}%`;
    // push same like for each placeholder in the same order
    values.push(like, like, like, like, like, like, like, like, like);
  }

  if (where.length === 0) {
    throw new ApiError(400, "At least one search parameter is required");
  }

  /*
    Main query explanation:
    - We join subject_assignment -> subject to find subjects a teacher teaches
    - We left join student_subject -> student -> branch (b) to discover branches and students_count
    - We left join branch dept_branch ON subject.department_id = dept_branch.department_id to include branches
      that belong to the subject's department
    - We aggregate with GROUP_CONCAT and COUNT(DISTINCT ...) and GROUP BY teacher fields
  */
  const query = `
    SELECT
      t.teacher_id,
      t.teacher_code,
      CONCAT(t.first_name, ' ', COALESCE(t.last_name, '')) AS name,
      t.email,
      t.mobile_number,
      t.hire_date,
      td.qualification,
      td.dob,
      td.experience_years,

      -- aggregated subject names & count
      GROUP_CONCAT(DISTINCT sub.subject_name SEPARATOR ', ') AS subjects,
      COUNT(DISTINCT sub.subject_id) AS subjects_count,

      -- how many distinct students taught (across all assignments)
      COUNT(DISTINCT ss.enrollment) AS students_count,

      -- branches where those students belong AND branches derived from subject->department
      GROUP_CONCAT(DISTINCT b.branch_name SEPARATOR ', ') AS student_branches,
      GROUP_CONCAT(DISTINCT dept_branch.branch_name SEPARATOR ', ') AS dept_branches,
      -- unify both for convenience (may contain duplicates across fields; client can dedupe)
      GROUP_CONCAT(DISTINCT COALESCE(b.branch_name, dept_branch.branch_name) SEPARATOR ', ') AS branches

    FROM teacher t
    LEFT JOIN teacher_detail td ON td.teacher_id = t.teacher_id
    LEFT JOIN subject_assignment sa ON sa.teacher_id = t.teacher_id
    LEFT JOIN subject sub ON sub.subject_id = sa.subject_id

    -- students who took those subjects (to compute students_count and branches)
    LEFT JOIN student_subject ss ON ss.subject_id = sa.subject_id
                                AND ss.academic_year = sa.academic_year
                                AND ss.semester = sa.semester
    LEFT JOIN student st ON st.enrollment = ss.enrollment
    LEFT JOIN branch b ON b.branch_id = st.branch_id

    -- branches that belong to the subject's department
    LEFT JOIN branch dept_branch ON dept_branch.department_id = sub.department_id

    LEFT JOIN department d ON d.department_id = sub.department_id

    WHERE ${where.join(" AND ")}
    GROUP BY t.teacher_id, t.teacher_code, t.first_name, t.last_name, t.email, t.mobile_number, t.hire_date,
             td.qualification, td.dob, td.experience_years
    ORDER BY t.first_name ASC, t.last_name ASC
    LIMIT 500
  `;

  const [rows] = await pool.query(query, values);

  if (!rows || rows.length === 0) {
    throw new ApiError(404, "No teacher found with given details");
  }

  // Optional: convert CSV fields to arrays (uncomment if you want arrays)
  /*
  const normalized = rows.map(r => ({
    ...r,
    subjects: r.subjects ? r.subjects.split(',').map(x => x.trim()).filter(Boolean) : [],
    student_branches: r.student_branches ? r.student_branches.split(',').map(x => x.trim()).filter(Boolean) : [],
    dept_branches: r.dept_branches ? r.dept_branches.split(',').map(x => x.trim()).filter(Boolean) : [],
    branches: r.branches ? r.branches.split(',').map(x => x.trim()).filter(Boolean) : []
  }));
  return res.status(200).json(new ApiResponse("Teachers found", normalized));
  */

  return res.status(200).json(new ApiResponse("Teachers found", rows));
});

export const setTeacherController = asyncHandler(async (req, res) => {
  const query = `
    SELECT 
      * 
    FROM teacher 
    LIMIT 30
  `;

  const [rows] = await pool.query(query); // removed values

  console.log(rows);

  return res
    .status(200)
    .json(new ApiResponse("Student fetched", rows));
});

export const getTotalTeachers = asyncHandler(async (req, res) => {
  // change table name if different (e.g. teachers_master)
  const sql = `SELECT COUNT(*) AS total FROM teacher`;

  const result = await pool.query(sql);
 
  const total = result?.[0][0]?.total ?? result?.[0]?.total ?? 0;
  const totalNum = Number.isFinite(Number(total)) ? parseInt(total, 10) : 0;

  return res.json({
    statusCode: 200,
    data: { totalTeachers: totalNum },
    success: true,
  });
});