import React, { useState } from "react";
import Teacher from "./Teacher.jsx";
import StudentExam from "./StudentExam.jsx";
import { FaChalkboardTeacher, FaUserGraduate, FaSignInAlt, FaChevronRight } from "react-icons/fa";
import "./SignIn.css"; 

const Signin = () => {
  const [role, setRole] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);

  if (role === "teacher") {
    return <Teacher />;
  } else if (role === "student") {
    return <StudentExam />;
  }

  return (
    <div className="signin-container">

      <nav className="navbar">
        <div className="nav-content">
          <div className="logo-wrapper">
            <FaSignInAlt className="logo-icon" />
            <span className="logo-text">ExamPortal Pro</span>
          </div>
          <div className="nav-links">
            <a href="#" className="nav-link">Home</a>
            <a href="#" className="nav-link">Features</a>
            <a href="#" className="nav-link">Pricing</a>
            <a href="#" className="nav-link">Developers</a>
          </div>
          <button className="nav-button">Get Started</button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        <div className="signin-card">
          {/* Header */}
          <div className="card-header">
            <h1 className="header-title">Welcome to ExamPortal</h1>
            <p className="header-subtitle">Select your role to continue</p>
          </div>
          
          {/* Buttons */}
          <div className="card-body">
            <button
              onClick={() => setRole("teacher")}
              onMouseEnter={() => setHoveredButton("teacher")}
              onMouseLeave={() => setHoveredButton(null)}
              className={`role-button ${hoveredButton === "teacher" ? "teacher-active" : ""}`}
            >
             <div className="button-content">
                <div className={`icon-wrapper ${hoveredButton === "teacher" ? "icon-active" : ""}`}>
                  <FaChalkboardTeacher className="button-icon" />
                </div>
                <div className="text-content">
                  <h3 className="button-title">Teacher</h3>
                  <p className="button-description">Manage exams, students, and results</p>
                </div>
              </div>
              <div className={`chevron ${hoveredButton === "teacher" ? "chevron-active" : ""}`}>
                <FaChevronRight />
              </div>
            </button>

            <button
              onClick={() => setRole("student")}
              onMouseEnter={() => setHoveredButton("student")}
              onMouseLeave={() => setHoveredButton(null)}
              className={`role-button ${hoveredButton === "student" ? "student-active" : ""}`}
            >
              <div className="button-content">
                <div className={`icon-wrapper ${hoveredButton === "student" ? "icon-active" : ""}`}>
                  <FaUserGraduate className="button-icon" />
                </div>
                <div className="text-content">
                  <h3 className="button-title">Student</h3>
                  <p className="button-description">Take exams and view results</p>
                </div>
              </div>
              <div className={`chevron ${hoveredButton === "student" ? "chevron-active" : ""}`}>
                <FaChevronRight />
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="card-footer">
            <div className="footer-content">
              <p className="footer-text">
                Thank you for using <span className="product-name">ExamPortal Pro</span> - Your trusted examination solution
              </p>
              <div className="footer-links">
                <a href="#" className="footer-link">Support</a>
                <span className="divider">•</span>
                <a href="#" className="footer-link">Privacy Policy</a>
                <span className="divider">•</span>
                <a href="#" className="footer-link">Terms of Service</a>
              </div>
              <p className="copyright">
                © {new Date().getFullYear()} ExamPortal. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;