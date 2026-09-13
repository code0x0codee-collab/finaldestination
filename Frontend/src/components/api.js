// src/api.js
const MOCK_STATS = {
  totalStudents: 1256,
  totalTeachers: 102,
  todayAttendancePct: 88,
  pendingFeesCount: 45,
  newAdmissionsThisYear: 210,
};

const MOCK_DEPTS = [
  { name: "CSE", count: 520 },
  { name: "ECE", count: 360 },
  { name: "ME", count: 160 },
  { name: "Civil", count: 110 },
  { name: "Others", count: 106 },
];

const MOCK_ALERTS = [
  { id: 1, type: "Attendance", text: "12 students < 50% attendance" },
  { id: 2, type: "Fees", text: "45 students with pending fees" },
];

const MOCK_STUDENTS = [
  {
    enrollment: "2021001",
    name: "Abhishek Gupta",
    department: "CSE",
    year: "2021",
    attendance: 92,
    feesStatus: "Paid",
  },
  {
    enrollment: "2021002",
    name: "Priya Singh",
    department: "ECE",
    year: "2021",
    attendance: 78,
    feesStatus: "Due",
  },
  {
    enrollment: "2021003",
    name: "Rahul Verma",
    department: "ME",
    year: "2021",
    attendance: 85,
    feesStatus: "Paid",
  },
  {
    enrollment: "2021004",
    name: "Neha Sharma",
    department: "Civil",
    year: "2021",
    attendance: 66,
    feesStatus: "Due",
  },
  {
    enrollment: "2021005",
    name: "Amit Yadav",
    department: "CSE",
    year: "2021",
    attendance: 91,
    feesStatus: "Paid",
  },
  {
    enrollment: "2022001",
    name: "Shreya Pandey",
    department: "ECE",
    year: "2022",
    attendance: 72,
    feesStatus: "Paid",
  },
  {
    enrollment: "2022002",
    name: "Karan Singh",
    department: "ME",
    year: "2022",
    attendance: 48,
    feesStatus: "Due",
  },
  {
    enrollment: "2022003",
    name: "Muskan Agarwal",
    department: "CSE",
    year: "2022",
    attendance: 87,
    feesStatus: "Paid",
  },
  {
    enrollment: "2022004",
    name: "Vivek Kumar",
    department: "Civil",
    year: "2022",
    attendance: 59,
    feesStatus: "Due",
  },
  {
    enrollment: "2022005",
    name: "Sanya Kapoor",
    department: "ECE",
    year: "2022",
    attendance: 93,
    feesStatus: "Paid",
  },

  {
    enrollment: "2023001",
    name: "Rohan Mehta",
    department: "CSE",
    year: "2023",
    attendance: 81,
    feesStatus: "Paid",
  },
  {
    enrollment: "2023002",
    name: "Divya Rathi",
    department: "ECE",
    year: "2023",
    attendance: 69,
    feesStatus: "Due",
  },
  {
    enrollment: "2023003",
    name: "Harsh Tiwari",
    department: "ME",
    year: "2023",
    attendance: 55,
    feesStatus: "Due",
  },
  {
    enrollment: "2023004",
    name: "Ananya Mishra",
    department: "Civil",
    year: "2023",
    attendance: 77,
    feesStatus: "Paid",
  },
  {
    enrollment: "2023005",
    name: "Priya Singh",
    department: "CSE",
    year: "2023",
    attendance: 45,
    feesStatus: "Due",
  },

  {
    enrollment: "2024001",
    name: "Shivam Gupta",
    department: "CSE",
    year: "2024",
    attendance: 82,
    feesStatus: "Paid",
  },
  {
    enrollment: "2024002",
    name: "Tanya Malik",
    department: "ECE",
    year: "2024",
    attendance: 74,
    feesStatus: "Paid",
  },
  {
    enrollment: "2024003",
    name: "Deepak Chauhan",
    department: "Civil",
    year: "2024",
    attendance: 52,
    feesStatus: "Due",
  },
  {
    enrollment: "2024004",
    name: "Nisha Rawat",
    department: "ME",
    year: "2024",
    attendance: 89,
    feesStatus: "Paid",
  },
  {
    enrollment: "2024005",
    name: "Arjun Soni",
    department: "CSE",
    year: "2024",
    attendance: 61,
    feesStatus: "Due",
  },
];


const MOCK_TEACHERS = [
  { id: "t01", name: "Anita Rao", dept: "CSE" },
  { id: "t02", name: "Ramesh Verma", dept: "ECE" },
];

function wait(ms = 250) {
  return new Promise((res) => setTimeout(res, ms));
}

export const api = {
  fetchDashboardStats: async () => {
    await wait(300);
    return { stats: MOCK_STATS, depts: MOCK_DEPTS, alerts: MOCK_ALERTS };
  },

  searchStudents: async ({ q = "", page = 1, limit = 25 } = {}) => {
    await wait(200);
    const filtered = MOCK_STUDENTS.filter((s) =>
      `${s.name} ${s.enrollment} ${s.department}`.toLowerCase().includes(q.toLowerCase())
    );
    return { data: filtered, total: filtered.length, page };
  },

  searchTeachers: async ({ q = "" } = {}) => {
    await wait(200);
    const filtered = MOCK_TEACHERS.filter((t) =>
      `${t.name} ${t.dept}`.toLowerCase().includes(q.toLowerCase())
    );
    return { data: filtered };
  },

  login: async ({ username, password }) => {
    await wait(300);
    if (username === "director" && password === "password") {
      return { ok: true, user: { name: "Director Sharma", role: "director", _id: "director-001", email: "director@example.com" }, token: "fake-jwt" };
    }
    return { ok: false, message: "Invalid credentials" };
  },
};
