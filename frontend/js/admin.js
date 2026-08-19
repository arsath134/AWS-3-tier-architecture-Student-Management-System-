/*
 * ADMIN DASHBOARD
 */

let students = [];
let courses = [];
let currentSubjectCourseId = null;

let editingStudentId = null;
let editingCourseId = null;
let editingSubjectId = null;
let editingMarkId = null;
let editingAttendanceId = null;


/* ================================
   PAGE LOAD
================================ */

document.addEventListener("DOMContentLoaded", () => {

    const userData = sessionStorage.getItem("user");

    if (!userData) {
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userData);

    if (user.role !== "admin") {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("adminUsername").textContent =
        user.username;

    loadDashboard();
    loadStudents();
    loadCourses();

    setupForms();
});


/* ================================
   SECTION
================================ */

function showSection(sectionId, button) {

    document
        .querySelectorAll(".content-section")
        .forEach(section => {
            section.classList.add("hidden");
        });

    const section = document.getElementById(sectionId);

    if (section) {
        section.classList.remove("hidden");
    }

    document
        .querySelectorAll(".nav-btn")
        .forEach(navButton => {
            navButton.classList.remove("active");
        });

    if (button) {
        button.classList.add("active");
    }

    if (sectionId === "dashboard") {
        loadDashboard();
    }

    if (sectionId === "students") {
        loadStudents();
    }

    if (sectionId === "courses") {
        loadCourses();
    }

    if (sectionId === "subjects") {
        loadCourses();
    }

    if (sectionId === "marks") {
        loadStudents();
        loadCourses();
        loadMarks();
    }

    if (sectionId === "attendance") {
        loadStudents();
        loadCourses();
        loadAttendance();
    }
}


/* ================================
   LOGOUT
================================ */

function logout() {

    sessionStorage.removeItem("user");
    localStorage.clear();

    window.location.href = "login.html";
}


/* ================================
   API HELPER
================================ */

async function apiRequest(url, options = {}) {

    const response = await fetch(url, options);

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {

        throw new Error(
            data.message || "Request failed"
        );
    }

    return data;
}


/* ================================
   DASHBOARD
================================ */

async function loadDashboard() {

    try {

        const studentResponse =
            await apiRequest(`${API_BASE_URL}/students`);

        const courseResponse =
            await apiRequest(`${API_BASE_URL}/courses`);

        document.getElementById("studentCount").textContent =
            studentResponse.length;

        document.getElementById("courseCount").textContent =
            courseResponse.length;

        let subjectCount = 0;

        for (const course of courseResponse) {

            const subjects =
                await apiRequest(
                    `${API_BASE_URL}/courses/${course.course_id}/subjects`
                );

            subjectCount += subjects.length;
        }

        document.getElementById("subjectCount").textContent =
            subjectCount;

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );
    }
}


/* ================================
   STUDENTS
================================ */

async function loadStudents() {

    try {

        students =
            await apiRequest(
                `${API_BASE_URL}/students`
            );

        const tbody =
            document.getElementById(
                "studentsTableBody"
            );

        tbody.innerHTML = "";

        if (students.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        No students found.
                    </td>
                </tr>
            `;

            populateStudentSelects([]);

            return;
        }

        students.forEach(student => {

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>${student.student_id}</td>
                <td>${student.roll_no}</td>
                <td>${escapeHtml(student.name)}</td>
                <td>${escapeHtml(student.username || "-")}</td>
                <td>${escapeHtml(student.email)}</td>
                <td>${student.age || "-"}</td>
                <td>${escapeHtml(student.course_name || "-")}</td>

                <td class="actions">

                    <button
                        class="edit-btn"
                        onclick="editStudent(${student.student_id})">
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteStudent(${student.student_id})">
                        Delete
                    </button>

                </td>
            `;

            tbody.appendChild(row);
        });

        populateStudentSelects(students);

    } catch (error) {

        console.error(
            "Students error:",
            error
        );

        document.getElementById(
            "studentsTableBody"
        ).innerHTML = `
            <tr>
                <td colspan="8">
                    Failed to load students.
                </td>
            </tr>
        `;
    }
}


/* ================================
   STUDENT FORM
================================ */

function openStudentForm() {

    editingStudentId = null;

    document.getElementById(
        "studentFormTitle"
    ).textContent = "Add Student";

    document.getElementById(
        "studentForm"
    ).reset();

    document.getElementById(
        "studentPassword"
    ).required = true;

    document.getElementById(
        "studentFormCard"
    ).classList.remove("hidden");

    document.getElementById(
        "studentMessage"
    ).textContent = "";
}


function closeStudentForm() {

    document.getElementById(
        "studentFormCard"
    ).classList.add("hidden");

    editingStudentId = null;
}


function editStudent(studentId) {

    const student =
        students.find(
            item => item.student_id == studentId
        );

    if (!student) return;

    editingStudentId = studentId;

    document.getElementById(
        "studentFormTitle"
    ).textContent = "Edit Student";

    document.getElementById(
        "studentUsername"
    ).value = student.username || "";

    document.getElementById(
        "studentPassword"
    ).value = "";

    document.getElementById(
        "studentPassword"
    ).required = false;

    document.getElementById(
        "studentRollNo"
    ).value = student.roll_no;

    document.getElementById(
        "studentName"
    ).value = student.name;

    document.getElementById(
        "studentEmail"
    ).value = student.email;

    document.getElementById(
        "studentAge"
    ).value = student.age || "";

    document.getElementById(
        "studentCourse"
    ).value = student.course_id;

    document.getElementById(
        "studentFormCard"
    ).classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


async function deleteStudent(studentId) {

    const student =
        students.find(
            item => item.student_id == studentId
        );

    if (!student) return;

    const confirmed =
        confirm(
            `Delete student "${student.name}"?\n\nThis will also delete their marks and attendance.`
        );

    if (!confirmed) return;

    try {

        const result =
            await apiRequest(
                `${API_BASE_URL}/students/${studentId}`,
                {
                    method: "DELETE"
                }
            );

        alert(result.message);

        await loadStudents();
        await loadDashboard();
        await loadMarks();
        await loadAttendance();

    } catch (error) {

        alert(error.message);

    }
}


/* ================================
   COURSES
================================ */

async function loadCourses() {

    try {

        courses =
            await apiRequest(
                `${API_BASE_URL}/courses`
            );

        const tbody =
            document.getElementById(
                "coursesTableBody"
            );

        tbody.innerHTML = "";

        if (courses.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="4">
                        No courses found.
                    </td>
                </tr>
            `;

        } else {

            courses.forEach(course => {

                const row =
                    document.createElement("tr");

                row.innerHTML = `
                    <td>${course.course_id}</td>
                    <td>${escapeHtml(course.course_name)}</td>
                    <td>${escapeHtml(course.department)}</td>

                    <td class="actions">

                        <button
                            class="edit-btn"
                            onclick="editCourse(${course.course_id})">
                            Edit
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteCourse(${course.course_id})">
                            Delete
                        </button>

                    </td>
                `;

                tbody.appendChild(row);
            });
        }

        populateCourseSelects(courses);

    } catch (error) {

        console.error(
            "Courses error:",
            error
        );
    }
}


/* ================================
   COURSE FORM
================================ */

function editCourse(courseId) {

    const course =
        courses.find(
            item => item.course_id == courseId
        );

    if (!course) return;

    editingCourseId = courseId;

    document.getElementById(
        "courseFormTitle"
    ).textContent = "Edit Course";

    document.getElementById(
        "courseName"
    ).value = course.course_name;

    document.getElementById(
        "department"
    ).value = course.department;

    document.querySelector(
        "#courseForm .submit-btn"
    ).textContent = "Update Course";

    document.getElementById(
        "cancelCourseEdit"
    ).classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function cancelCourseEdit() {

    editingCourseId = null;

    document.getElementById(
        "courseForm"
    ).reset();

    document.getElementById(
        "courseFormTitle"
    ).textContent = "Add Course";

    document.querySelector(
        "#courseForm .submit-btn"
    ).textContent = "Add Course";

    document.getElementById(
        "cancelCourseEdit"
    ).classList.add("hidden");
}


async function deleteCourse(courseId) {

    const course =
        courses.find(
            item => item.course_id == courseId
        );

    if (!course) return;

    const confirmed =
        confirm(
            `Delete course "${course.course_name}"?\n\nThis will also delete its subjects, marks and attendance.`
        );

    if (!confirmed) return;

    try {

        const result =
            await apiRequest(
                `${API_BASE_URL}/courses/${courseId}`,
                {
                    method: "DELETE"
                }
            );

        alert(result.message);

        await loadCourses();
        await loadDashboard();
        await loadStudents();

    } catch (error) {

        alert(error.message);
    }
}


/* ================================
   COURSE SELECTS
================================ */

function populateCourseSelects(courseList) {

    const selects = [
        "studentCourse",
        "subjectCourse",
        "viewSubjectCourse",
        "marksCourse",
        "attendanceCourse"
    ];

    selects.forEach(id => {

        const select =
            document.getElementById(id);

        if (!select) return;

        const currentValue = select.value;

        select.innerHTML =
            `<option value="">Select Course</option>`;

        courseList.forEach(course => {

            const option =
                document.createElement("option");

            option.value =
                course.course_id;

            option.textContent =
                course.course_name;

            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    });
}


/* ================================
   STUDENT SELECTS
================================ */

function populateStudentSelects(studentList) {

    const selects = [
        "marksStudent",
        "attendanceStudent"
    ];

    selects.forEach(id => {

        const select =
            document.getElementById(id);

        if (!select) return;

        const currentValue = select.value;

        select.innerHTML =
            `<option value="">Select Student</option>`;

        studentList.forEach(student => {

            const option =
                document.createElement("option");

            option.value =
                student.student_id;

            option.textContent =
                `${student.name} (${student.roll_no})`;

            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    });
}


/* ================================
   SUBJECTS
=============================================== */

async function loadSubjects(courseId) {

    const tbody =
        document.getElementById(
            "subjectsTableBody"
        );

    if (!courseId) {

        tbody.innerHTML = `
            <tr>
                <td colspan="3">
                    Select a course to view subjects.
                </td>
            </tr>
        `;

        return;
    }

    currentSubjectCourseId = courseId;

    try {

        const subjects =
            await apiRequest(
                `${API_BASE_URL}/courses/${courseId}/subjects`
            );

        tbody.innerHTML = "";

        if (subjects.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="3">
                        No subjects found.
                    </td>
                </tr>
            `;

            return;
        }

        subjects.forEach(subject => {

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>${subject.subject_id}</td>
                <td>${escapeHtml(subject.subject_name)}</td>

                <td class="actions">

                    <button
                        class="edit-btn"
                        onclick="editSubject(${subject.subject_id}, ${subject.course_id}, '${escapeAttribute(subject.subject_name)}')">
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteSubject(${subject.subject_id})">
                        Delete
                    </button>

                </td>
            `;

            tbody.appendChild(row);
        });

    } catch (error) {

        console.error(
            "Subjects error:",
            error
        );
    }
}


function editSubject(subjectId, courseId, subjectName) {

    editingSubjectId = subjectId;

    document.getElementById(
        "subjectFormTitle"
    ).textContent = "Edit Subject";

    document.getElementById(
        "subjectCourse"
    ).value = courseId;

    document.getElementById(
        "subjectName"
    ).value = subjectName;

    document.querySelector(
        "#subjectForm .submit-btn"
    ).textContent = "Update Subject";

    document.getElementById(
        "cancelSubjectEdit"
    ).classList.remove("hidden");
}


function cancelSubjectEdit() {

    editingSubjectId = null;

    document.getElementById(
        "subjectForm"
    ).reset();

    document.getElementById(
        "subjectFormTitle"
    ).textContent = "Add Subject";

    document.querySelector(
        "#subjectForm .submit-btn"
    ).textContent = "Add Subject";

    document.getElementById(
        "cancelSubjectEdit"
    ).classList.add("hidden");
}


async function deleteSubject(subjectId) {

    const confirmed =
        confirm(
            "Delete this subject?\n\nIts marks and attendance records will also be deleted."
        );

    if (!confirmed) return;

    try {

        const result =
            await apiRequest(
                `${API_BASE_URL}/subjects/${subjectId}`,
                {
                    method: "DELETE"
                }
            );

        alert(result.message);

        if (currentSubjectCourseId) {
            await loadSubjects(currentSubjectCourseId);
        }

        await loadDashboard();

    } catch (error) {

        alert(error.message);
    }
}


/* ================================
   MARKS
================================ */

let marks = [];

async function loadMarks() {

    try {

        marks =
            await apiRequest(
                `${API_BASE_URL}/marks`
            );

        const tbody =
            document.getElementById(
                "marksTableBody"
            );

        tbody.innerHTML = "";

        if (marks.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        No marks records found.
                    </td>
                </tr>
            `;

            return;
        }

        marks.forEach(mark => {

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>${mark.mark_id}</td>
                <td>${escapeHtml(mark.student_name)}</td>
                <td>${mark.roll_no}</td>
                <td>${escapeHtml(mark.course_name)}</td>
                <td>${escapeHtml(mark.subject_name)}</td>
                <td>${mark.marks}</td>
                <td>${escapeHtml(mark.grade || "-")}</td>

                <td class="actions">

                    <button
                        class="edit-btn"
                        onclick="editMark(${mark.mark_id})">
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteMark(${mark.mark_id})">
                        Delete
                    </button>

                </td>
            `;

            tbody.appendChild(row);
        });

    } catch (error) {

        console.error(
            "Marks error:",
            error
        );
    }
}


function editMark(markId) {

    const mark =
        marks.find(
            item => item.mark_id == markId
        );

    if (!mark) return;

    editingMarkId = markId;

    document.getElementById(
        "marksFormTitle"
    ).textContent = "Edit Marks";

    document.getElementById(
        "marksStudent"
    ).value = mark.student_id;

    document.getElementById(
        "marksCourse"
    ).value = mark.course_id;

    loadSubjectsForSelect(
        mark.course_id,
        "marksSubject",
        mark.subject_id
    );

    document.getElementById(
        "marksValue"
    ).value = mark.marks;

    document.getElementById(
        "grade"
    ).value = mark.grade || "";

    document.querySelector(
        "#marksForm .submit-btn"
    ).textContent = "Update Marks";

    document.getElementById(
        "cancelMarksEdit"
    ).classList.remove("hidden");
}


function cancelMarksEdit() {

    editingMarkId = null;

    document.getElementById(
        "marksForm"
    ).reset();

    document.getElementById(
        "marksFormTitle"
    ).textContent = "Add Marks";

    document.querySelector(
        "#marksForm .submit-btn"
    ).textContent = "Add Marks";

    document.getElementById(
        "cancelMarksEdit"
    ).classList.add("hidden");

    document.getElementById(
        "marksSubject"
    ).innerHTML =
        `<option value="">Select Subject</option>`;
}


async function deleteMark(markId) {

    if (!confirm("Delete this marks record?")) {
        return;
    }

    try {

        const result =
            await apiRequest(
                `${API_BASE_URL}/marks/${markId}`,
                {
                    method: "DELETE"
                }
            );

        alert(result.message);

        await loadMarks();

    } catch (error) {

        alert(error.message);
    }
}


/* ================================
   ATTENDANCE
================================ */

let attendance = [];

async function loadAttendance() {

    try {

        attendance =
            await apiRequest(
                `${API_BASE_URL}/attendance`
            );

        const tbody =
            document.getElementById(
                "attendanceTableBody"
            );

        tbody.innerHTML = "";

        if (attendance.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="10">
                        No attendance records found.
                    </td>
                </tr>
            `;

            return;
        }

        attendance.forEach(record => {

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>${record.attendance_id}</td>
                <td>${escapeHtml(record.student_name)}</td>
                <td>${record.roll_no}</td>
                <td>${escapeHtml(record.course_name)}</td>
                <td>${escapeHtml(record.subject_name)}</td>
                <td>${record.total_classes}</td>
                <td>${record.attended_classes}</td>
                <td>${record.absent}</td>
                <td>${record.percentage}%</td>

                <td class="actions">

                    <button
                        class="edit-btn"
                        onclick="editAttendance(${record.attendance_id})">
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteAttendance(${record.attendance_id})">
                        Delete
                    </button>

                </td>
            `;

            tbody.appendChild(row);
        });

    } catch (error) {

        console.error(
            "Attendance error:",
            error
        );
    }
}


function editAttendance(attendanceId) {

    const record =
        attendance.find(
            item => item.attendance_id == attendanceId
        );

    if (!record) return;

    editingAttendanceId = attendanceId;

    document.getElementById(
        "attendanceFormTitle"
    ).textContent = "Edit Attendance";

    document.getElementById(
        "attendanceStudent"
    ).value = record.student_id;

    document.getElementById(
        "attendanceCourse"
    ).value = record.course_id;

    loadSubjectsForSelect(
        record.course_id,
        "attendanceSubject",
        record.subject_id
    );

    document.getElementById(
        "totalClasses"
    ).value = record.total_classes;

    document.getElementById(
        "attendedClasses"
    ).value = record.attended_classes;

    document.querySelector(
        "#attendanceForm .submit-btn"
    ).textContent = "Update Attendance";

    document.getElementById(
        "cancelAttendanceEdit"
    ).classList.remove("hidden");
}


function cancelAttendanceEdit() {

    editingAttendanceId = null;

    document.getElementById(
        "attendanceForm"
    ).reset();

    document.getElementById(
        "attendanceFormTitle"
    ).textContent = "Add Attendance";

    document.querySelector(
        "#attendanceForm .submit-btn"
    ).textContent = "Add Attendance";

    document.getElementById(
        "cancelAttendanceEdit"
    ).classList.add("hidden");

    document.getElementById(
        "attendanceSubject"
    ).innerHTML =
        `<option value="">Select Subject</option>`;
}


async function deleteAttendance(attendanceId) {

    if (!confirm("Delete this attendance record?")) {
        return;
    }

    try {

        const result =
            await apiRequest(
                `${API_BASE_URL}/attendance/${attendanceId}`,
                {
                    method: "DELETE"
                }
            );

        alert(result.message);

        await loadAttendance();

    } catch (error) {

        alert(error.message);
    }
}


/* ================================
   SUBJECT SELECT LOADER
================================ */

async function loadSubjectsForSelect(
    courseId,
    selectId,
    selectedSubjectId = null
) {

    if (!courseId) return;

    try {

        const subjects =
            await apiRequest(
                `${API_BASE_URL}/courses/${courseId}/subjects`
            );

        const select =
            document.getElementById(selectId);

        select.innerHTML =
            `<option value="">Select Subject</option>`;

        subjects.forEach(subject => {

            const option =
                document.createElement("option");

            option.value =
                subject.subject_id;

            option.textContent =
                subject.subject_name;

            select.appendChild(option);
        });

        if (selectedSubjectId) {
            select.value = selectedSubjectId;
        }

    } catch (error) {

        console.error(
            "Subject select error:",
            error
        );
    }
}


/* ================================
   FORMS
================================ */

function setupForms() {

    /* ==========================
       STUDENT FORM
    ========================== */

    document
        .getElementById("studentForm")
        .addEventListener("submit", async event => {

            event.preventDefault();

            const password =
                document.getElementById(
                    "studentPassword"
                ).value.trim();

            const data = {

                username:
                    document.getElementById(
                        "studentUsername"
                    ).value.trim(),

                roll_no:
                    Number(
                        document.getElementById(
                            "studentRollNo"
                        ).value
                    ),

                name:
                    document.getElementById(
                        "studentName"
                    ).value.trim(),

                email:
                    document.getElementById(
                        "studentEmail"
                    ).value.trim(),

                age:
                    document.getElementById(
                        "studentAge"
                    ).value
                        ? Number(
                            document.getElementById(
                                "studentAge"
                            ).value
                        )
                        : null,

                course_id:
                    Number(
                        document.getElementById(
                            "studentCourse"
                        ).value
                    )
            };

            if (password) {
                data.password = password;
            }

            try {

                let result;

                if (editingStudentId) {

                    result =
                        await apiRequest(
                            `${API_BASE_URL}/students/${editingStudentId}`,
                            {
                                method: "PUT",
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },
                                body:
                                    JSON.stringify(data)
                            }
                        );

                } else {

                    result =
                        await apiRequest(
                            `${API_BASE_URL}/students`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },
                                body:
                                    JSON.stringify(data)
                            }
                        );
                }

                showMessage(
                    "studentMessage",
                    result.message,
                    "success"
                );

                await loadStudents();
                await loadDashboard();

                closeStudentForm();

            } catch (error) {

                showMessage(
                    "studentMessage",
                    error.message,
                    "error"
                );
            }
        });


    /* ==========================
       COURSE FORM
    ========================== */

    document
        .getElementById("courseForm")
        .addEventListener("submit", async event => {

            event.preventDefault();

            const data = {

                course_name:
                    document.getElementById(
                        "courseName"
                    ).value.trim(),

                department:
                    document.getElementById(
                        "department"
                    ).value.trim()
            };

            try {

                let result;

                if (editingCourseId) {

                    result =
                        await apiRequest(
                            `${API_BASE_URL}/courses/${editingCourseId}`,
                            {
                                method: "PUT",
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },
                                body:
                                    JSON.stringify(data)
                            }
                        );

                } else {

                    result =
                        await apiRequest(
                            `${API_BASE_URL}/courses`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },
                                body:
                                    JSON.stringify(data)
                            }
                        );
                }

                showMessage(
                    "courseMessage",
                    result.message,
                    "success"
                );

                cancelCourseEdit();

                await loadCourses();
                await loadDashboard();

            } catch (error) {

                showMessage(
                    "courseMessage",
                    error.message,
                    "error"
                );
            }
        });


    /* ==========================
       SUBJECT FORM
    ========================== */

    document
        .getElementById("subjectForm")
        .addEventListener("submit", async event => {

            event.preventDefault();

            const data = {

                course_id:
                    Number(
                        document.getElementById(
                            "subjectCourse"
                        ).value
                    ),

                subject_name:
                    document.getElementById(
                        "subjectName"
                    ).value.trim()
            };

            try {

                let result;

                if (editingSubjectId) {

                    result =
                        await apiRequest(
                            `${API_BASE_URL}/subjects/${editingSubjectId}`,
                            {
                                method: "PUT",
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },
                                body:
                                    JSON.stringify(data)
                            }
                        );

                } else {

                    result =
                        await apiRequest(
                            `${API_BASE_URL}/subjects`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },
                                body:
                                    JSON.stringify(data)
                            }
                        );
                }

                showMessage(
                    "subjectMessage",
                    result.message,
                    "success"
                );

                const courseId =
                    data.course_id;

                cancelSubjectEdit();

                document.getElementById(
                    "viewSubjectCourse"
                ).value = courseId;

                await loadSubjects(courseId);
                await loadDashboard();

            } catch (error) {

                showMessage(
                    "subjectMessage",
                    error.message,
                    "error"
                );
            }
        });


    /* ==========================
       MARKS FORM
    ========================== */

    document
        .getElementById("marksForm")
        .addEventListener("submit", async event => {

            event.preventDefault();

            const data = {

                student_id:
                    Number(
                        document.getElementById(
                            "marksStudent"
                        ).value
                    ),

                course_id:
                    Number(
                        document.getElementById(
                            "marksCourse"
                        ).value
                    ),

                subject_id:
                    Number(
                        document.getElementById(
                            "marksSubject"
                        ).value
                    ),

                marks:
                    Number(
                        document.getElementById(
                            "marksValue"
                        ).value
                    ),

                grade:
                    document.getElementById(
                        "grade"
                    ).value.trim()
            };

            try {

                let result;

                if (editingMarkId) {

                    result =
                        await apiRequest(
                            `${API_BASE_URL}/marks/${editingMarkId}`,
                            {
                                method: "PUT",
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },
                                body:
                                    JSON.stringify(data)
                            }
                        );

                } else {

                    result =
                        await apiRequest(
                            `${API_BASE_URL}/marks`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },
                                body:
                                    JSON.stringify(data)
                            }
                        );
                }

                showMessage(
                    "marksMessage",
                    result.message,
                    "success"
                );

                cancelMarksEdit();

                await loadMarks();

            } catch (error) {

                showMessage(
                    "marksMessage",
                    error.message,
                    "error"
                );
            }
        });


    /* ==========================
       ATTENDANCE FORM
    ========================== */

    document
        .getElementById("attendanceForm")
        .addEventListener("submit", async event => {

            event.preventDefault();

            const total =
                Number(
                    document.getElementById(
                        "totalClasses"
                    ).value
                );

            const attended =
                Number(
                    document.getElementById(
                        "attendedClasses"
                    ).value
                );

            if (attended > total) {

                showMessage(
                    "attendanceMessage",
                    "Attended classes cannot exceed total classes.",
                    "error"
                );

                return;
            }

            const data = {

                student_id:
                    Number(
                        document.getElementById(
                            "attendanceStudent"
                        ).value
                    ),

                course_id:
                    Number(
                        document.getElementById(
                            "attendanceCourse"
                        ).value
                    ),

                subject_id:
                    Number(
                        document.getElementById(
                            "attendanceSubject"
                        ).value
                    ),

                total_classes:
                    total,

                attended_classes:
                    attended
            };

            try {

                let result;

                if (editingAttendanceId) {

                    result =
                        await apiRequest(
                            `${API_BASE_URL}/attendance/${editingAttendanceId}`,
                            {
                                method: "PUT",
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },
                                body:
                                    JSON.stringify(data)
                            }
                        );

                } else {

                    result =
                        await apiRequest(
                            `${API_BASE_URL}/attendance`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },
                                body:
                                    JSON.stringify(data)
                            }
                        );
                }

                showMessage(
                    "attendanceMessage",
                    result.message,
                    "success"
                );

                cancelAttendanceEdit();

                await loadAttendance();

            } catch (error) {

                showMessage(
                    "attendanceMessage",
                    error.message,
                    "error"
                );
            }
        });


    /* ==========================
       COURSE → SUBJECT
    ========================== */

    document
        .getElementById("marksCourse")
        .addEventListener("change", event => {

            loadSubjectsForSelect(
                event.target.value,
                "marksSubject"
            );
        });


    document
        .getElementById("attendanceCourse")
        .addEventListener("change", event => {

            loadSubjectsForSelect(
                event.target.value,
                "attendanceSubject"
            );
        });


    document
        .getElementById("viewSubjectCourse")
        .addEventListener("change", event => {

            loadSubjects(
                event.target.value
            );
        });
}


/* ================================
   HELPERS
================================ */

function showMessage(
    elementId,
    message,
    type
) {

    const element =
        document.getElementById(elementId);

    element.textContent = message;

    element.className =
        `message-${type}`;
}


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}
