/*
 * STUDENT DASHBOARD
 */


/* ================================
   SHOW SECTION
================================ */

function showSection(sectionId) {

    const sections =
        document.querySelectorAll(".content-section");

    sections.forEach(section => {
        section.classList.add("hidden");
    });

    const selectedSection =
        document.getElementById(sectionId);

    if (selectedSection) {
        selectedSection.classList.remove("hidden");
    }

    const buttons =
        document.querySelectorAll(".nav-btn");

    buttons.forEach(button => {
        button.classList.remove("active");
    });

    buttons.forEach(button => {

        if (
            button.getAttribute("onclick") ===
            `showSection('${sectionId}')`
        ) {
            button.classList.add("active");
        }

    });


    if (sectionId === "profile") {
        loadStudentProfile();
    }

    if (sectionId === "marks") {
        loadStudentMarks();
    }

    if (sectionId === "attendance") {
        loadStudentAttendance();
    }

}


/* ================================
   LOGOUT
================================ */

function logout() {

    sessionStorage.removeItem("user");

    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    window.location.href = "login.html";
}


/* ================================
   GET LOGGED-IN USER
================================ */

function getLoggedInUser() {

    const userData =
        sessionStorage.getItem("user");

    if (!userData) {

        window.location.href =
            "login.html";

        return null;
    }

    try {

        return JSON.parse(userData);

    } catch (error) {

        console.error(
            "Invalid user data:",
            error
        );

        sessionStorage.removeItem("user");

        window.location.href =
            "login.html";

        return null;
    }
}


/* ================================
   LOAD STUDENT PROFILE
================================ */

async function loadStudentProfile() {

    const user =
        getLoggedInUser();

    if (!user) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/students/${encodeURIComponent(user.username)}`
            );

        if (!response.ok) {
            throw new Error(
                "Student profile could not be loaded"
            );
        }

        const student =
            await response.json();


        /* TOPBAR */

        document.getElementById(
            "studentUsername"
        ).textContent =
            student.username || user.username;


        /* DASHBOARD */

        document.getElementById(
            "dashboardName"
        ).textContent =
            student.name || "-";


        document.getElementById(
            "dashboardRollNo"
        ).textContent =
            student.roll_no || "-";


        document.getElementById(
            "dashboardCourse"
        ).textContent =
            student.course_name || "-";


        /* PROFILE */

        document.getElementById(
            "profileUsername"
        ).textContent =
            student.username || user.username;


        document.getElementById(
            "profileName"
        ).textContent =
            student.name || "-";


        document.getElementById(
            "profileRollNo"
        ).textContent =
            student.roll_no || "-";


        document.getElementById(
            "profileEmail"
        ).textContent =
            student.email || "-";


        document.getElementById(
            "profileCourse"
        ).textContent =
            student.course_name || "-";


        document.getElementById(
            "profileDepartment"
        ).textContent =
            student.department || "-";


        document.getElementById(
            "profileAge"
        ).textContent =
            student.age || "-";


    } catch (error) {

        console.error(
            "Profile error:",
            error
        );

        document.getElementById(
            "dashboardName"
        ).textContent =
            "Unable to load";
    }

}


/* ================================
   LOAD MARKS
================================ */

async function loadStudentMarks() {

    const user =
        getLoggedInUser();

    if (!user) {
        return;
    }

    const tableBody =
        document.getElementById(
            "marksTableBody"
        );

    tableBody.innerHTML = `
        <tr>
            <td colspan="3">
                Loading marks...
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/marks/${encodeURIComponent(user.username)}`
            );


        if (!response.ok) {

            throw new Error(
                "Marks API unavailable"
            );
        }


        const data =
            await response.json();


        console.log(
            "Marks data:",
            data
        );


        /* OVERALL MARKS */

        const overall =
            data.overall || {};

        document.getElementById(
            "totalSubjects"
        ).textContent =
            overall.total_subjects ?? 0;


        document.getElementById(
            "averageMarks"
        ).textContent =
            overall.average_marks ?? 0;


        document.getElementById(
            "dashboardAverageMarks"
        ).textContent =
            overall.total_subjects > 0
                ? overall.average_marks
                : "No marks";


        /* SUBJECT MARKS */

        const subjects =
            data.subjects || [];


        tableBody.innerHTML = "";


        if (
            !Array.isArray(subjects) ||
            subjects.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        No marks available yet.
                    </td>
                </tr>
            `;

            return;
        }


        subjects.forEach(mark => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${mark.subject || "-"}
                </td>

                <td>
                    ${mark.marks ?? "-"}
                </td>

                <td>
                    ${mark.grade || "-"}
                </td>

            `;


            tableBody.appendChild(row);

        });


    } catch (error) {

        console.error(
            "Marks error:",
            error
        );


        document.getElementById(
            "totalSubjects"
        ).textContent = "0";


        document.getElementById(
            "averageMarks"
        ).textContent = "0";


        document.getElementById(
            "dashboardAverageMarks"
        ).textContent = "Unavailable";


        tableBody.innerHTML = `
            <tr>
                <td colspan="3">
                    Unable to load marks.
                </td>
            </tr>
        `;
    }

}


/* ================================
   LOAD ATTENDANCE
================================ */

async function loadStudentAttendance() {

    const user =
        getLoggedInUser();

    if (!user) {
        return;
    }


    const tableBody =
        document.getElementById(
            "attendanceTableBody"
        );


    tableBody.innerHTML = `
        <tr>
            <td colspan="5">
                Loading attendance...
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/attendance/${encodeURIComponent(user.username)}`
            );


        if (!response.ok) {

            throw new Error(
                "Attendance API unavailable"
            );
        }


        const data =
            await response.json();


        console.log(
            "Attendance data:",
            data
        );


        /* =========================
           OVERALL ATTENDANCE
        ========================= */

        const overall =
            data.overall || {};


        document.getElementById(
            "totalClasses"
        ).textContent =
            overall.total_classes ?? 0;


        document.getElementById(
            "presentClasses"
        ).textContent =
            overall.attended_classes ?? 0;


        document.getElementById(
            "absentClasses"
        ).textContent =
            overall.absent_classes ?? 0;


        document.getElementById(
            "attendancePercentage"
        ).textContent =
            `${overall.percentage ?? 0}%`;


        document.getElementById(
            "dashboardAttendance"
        ).textContent =
            `${overall.percentage ?? 0}%`;


        /* =========================
           SUBJECT ATTENDANCE
        ========================= */

        const subjects =
            data.subjects || [];


        tableBody.innerHTML = "";


        if (
            !Array.isArray(subjects) ||
            subjects.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        No attendance records available yet.
                    </td>
                </tr>
            `;

            return;
        }


        subjects.forEach(attendance => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${attendance.subject || "-"}
                </td>

                <td>
                    ${attendance.total_classes ?? 0}
                </td>

                <td>
                    ${attendance.attended_classes ?? 0}
                </td>

                <td>
                    ${attendance.absent ?? 0}
                </td>

                <td>
                    ${attendance.percentage ?? 0}%
                </td>

            `;


            tableBody.appendChild(row);

        });


    } catch (error) {

        console.error(
            "Attendance error:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Unable to load attendance.
                </td>
            </tr>
        `;

    }

}


/* ================================
   INITIAL LOAD
================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const user =
            getLoggedInUser();

        if (!user) {
            return;
        }


        document.getElementById(
            "studentUsername"
        ).textContent =
            user.username;


        loadStudentProfile();

        loadStudentMarks();

        loadStudentAttendance();

    }
);
