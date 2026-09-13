import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./components/Loginpage/Login";
import Homepage from "./components/Homepage/Homepage";
import StudentProfile from "./components/studentProfile/StudentProfile";
import TeacherProfile from "./components/teacherProfile/Teacherprofile";
import OrbitingLoader from "./components/PageLoader";

function AppRoutes() {
  const location = useLocation();
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    setPageLoading(true);

    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {pageLoading && <OrbitingLoader />}

      <Routes location={location}>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/students/:enrollment" element={<StudentProfile />} />
        <Route path="/teachers/:teacherId" element={<TeacherProfile />} />
      </Routes>
    </>
  );
}

export default AppRoutes;
