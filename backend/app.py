from flask import Flask, request, jsonify
import pymysql

app = Flask(__name__)

# ==============================
# DATABASE CONFIGURATION
# ==============================

DB_HOST = "student-db.cdu6wimkivp3.ap-southeast-2.rds.amazonaws.com"
DB_USER = "student_admin"
DB_PASSWORD = "admin123"
DB_NAME = "student_db"


def get_connection():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=3306,
        cursorclass=pymysql.cursors.DictCursor
    )


# ==============================
# HOME
# ==============================

@app.route("/")
def home():
    return "Student Management Backend is running!"


# ==============================
# LOGIN
# ==============================

@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    username = data.get("username")
    password = data.get("password")
    role = data.get("role")

    if not username or not password or not role:
        return jsonify({
            "success": False,
            "message": "Username, password and role are required"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT user_id, username, role
                FROM users
                WHERE username = %s
                AND password = %s
                AND role = %s
            """, (username, password, role.lower()))

            user = cursor.fetchone()

            if user:
                return jsonify({
                    "success": True,
                    "message": "Login successful",
                    "user": user
                })

            return jsonify({
                "success": False,
                "message": "Invalid username, password or role"
            }), 401

    finally:
        connection.close()


# ============================================================
# COURSES
# ============================================================

@app.route("/courses", methods=["GET"])
def get_courses():

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT course_id, course_name, department
                FROM courses
                ORDER BY course_name
            """)

            return jsonify(cursor.fetchall())

    finally:
        connection.close()


@app.route("/courses", methods=["POST"])
def add_course():

    data = request.get_json()

    course_name = data.get("course_name")
    department = data.get("department")

    if not course_name or not department:
        return jsonify({
            "success": False,
            "message": "Course name and department are required"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                INSERT INTO courses
                (course_name, department)
                VALUES (%s, %s)
            """, (course_name, department))

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Course added successfully",
                "course_id": cursor.lastrowid
            }), 201

    except pymysql.err.IntegrityError:
        return jsonify({
            "success": False,
            "message": "Course already exists"
        }), 409

    finally:
        connection.close()


@app.route("/courses/<int:course_id>", methods=["PUT"])
def update_course(course_id):

    data = request.get_json()

    course_name = data.get("course_name")
    department = data.get("department")

    if not course_name or not department:
        return jsonify({
            "success": False,
            "message": "Course name and department are required"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                UPDATE courses
                SET course_name = %s,
                    department = %s
                WHERE course_id = %s
            """, (course_name, department, course_id))

            if cursor.rowcount == 0:
                return jsonify({
                    "success": False,
                    "message": "Course not found"
                }), 404

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Course updated successfully"
            })

    except pymysql.err.IntegrityError:
        return jsonify({
            "success": False,
            "message": "Course name already exists"
        }), 409

    finally:
        connection.close()


@app.route("/courses/<int:course_id>", methods=["DELETE"])
def delete_course(course_id):

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            # Delete dependent attendance
            cursor.execute("""
                DELETE FROM attendance
                WHERE course_id = %s
            """, (course_id,))

            # Delete dependent marks
            cursor.execute("""
                DELETE FROM marks
                WHERE course_id = %s
            """, (course_id,))

            # Delete subjects
            cursor.execute("""
                DELETE FROM subjects
                WHERE course_id = %s
            """, (course_id,))

            # Delete course
            cursor.execute("""
                DELETE FROM courses
                WHERE course_id = %s
            """, (course_id,))

            if cursor.rowcount == 0:
                connection.rollback()

                return jsonify({
                    "success": False,
                    "message": "Course not found"
                }), 404

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Course deleted successfully"
            })

    finally:
        connection.close()


# ============================================================
# SUBJECTS
# ============================================================

@app.route("/courses/<int:course_id>/subjects", methods=["GET"])
def get_subjects(course_id):

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    subject_id,
                    course_id,
                    subject_name
                FROM subjects
                WHERE course_id = %s
                ORDER BY subject_name
            """, (course_id,))

            return jsonify(cursor.fetchall())

    finally:
        connection.close()


@app.route("/subjects", methods=["POST"])
def add_subject():

    data = request.get_json()

    course_id = data.get("course_id")
    subject_name = data.get("subject_name")

    if not course_id or not subject_name:
        return jsonify({
            "success": False,
            "message": "Course and subject name are required"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                INSERT INTO subjects
                (course_id, subject_name)
                VALUES (%s, %s)
            """, (course_id, subject_name))

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Subject added successfully",
                "subject_id": cursor.lastrowid
            }), 201

    except pymysql.err.IntegrityError:
        return jsonify({
            "success": False,
            "message": "Subject already exists or course does not exist"
        }), 409

    finally:
        connection.close()


@app.route("/subjects/<int:subject_id>", methods=["PUT"])
def update_subject(subject_id):

    data = request.get_json()

    course_id = data.get("course_id")
    subject_name = data.get("subject_name")

    if not course_id or not subject_name:
        return jsonify({
            "success": False,
            "message": "Course and subject name are required"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                UPDATE subjects
                SET course_id = %s,
                    subject_name = %s
                WHERE subject_id = %s
            """, (course_id, subject_name, subject_id))

            if cursor.rowcount == 0:
                return jsonify({
                    "success": False,
                    "message": "Subject not found"
                }), 404

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Subject updated successfully"
            })

    finally:
        connection.close()


@app.route("/subjects/<int:subject_id>", methods=["DELETE"])
def delete_subject(subject_id):

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                DELETE FROM attendance
                WHERE subject_id = %s
            """, (subject_id,))

            cursor.execute("""
                DELETE FROM marks
                WHERE subject_id = %s
            """, (subject_id,))

            cursor.execute("""
                DELETE FROM subjects
                WHERE subject_id = %s
            """, (subject_id,))

            if cursor.rowcount == 0:
                connection.rollback()

                return jsonify({
                    "success": False,
                    "message": "Subject not found"
                }), 404

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Subject deleted successfully"
            })

    finally:
        connection.close()


# ============================================================
# STUDENTS
# ============================================================

@app.route("/students", methods=["GET"])
def get_students():

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    s.student_id,
                    s.user_id,
                    u.username,
                    s.roll_no,
                    s.name,
                    s.email,
                    s.course_id,
                    c.course_name,
                    s.age
                FROM students s
                JOIN users u
                    ON s.user_id = u.user_id
                LEFT JOIN courses c
                    ON s.course_id = c.course_id
                ORDER BY s.roll_no
            """)

            return jsonify(cursor.fetchall())

    finally:
        connection.close()


@app.route("/students", methods=["POST"])
def add_student():

    data = request.get_json()

    username = data.get("username")
    password = data.get("password")
    roll_no = data.get("roll_no")
    name = data.get("name")
    email = data.get("email")
    course_id = data.get("course_id")
    age = data.get("age")

    if not all([
        username,
        password,
        roll_no,
        name,
        email,
        course_id
    ]):
        return jsonify({
            "success": False,
            "message": "Username, password, roll number, name, email and course are required"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                INSERT INTO users
                (username, password, role)
                VALUES (%s, %s, 'student')
            """, (username, password))

            user_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO students
                (
                    user_id,
                    roll_no,
                    name,
                    email,
                    course_id,
                    age
                )
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                roll_no,
                name,
                email,
                course_id,
                age
            ))

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Student added successfully",
                "student_id": cursor.lastrowid
            }), 201

    except pymysql.err.IntegrityError as error:

        connection.rollback()

        message = str(error)

        if "username" in message.lower():
            message = "Username already exists"
        elif "roll_no" in message.lower():
            message = "Roll number already exists"
        elif "email" in message.lower():
            message = "Email already exists"
        else:
            message = "Student already exists or invalid course"

        return jsonify({
            "success": False,
            "message": message
        }), 409

    finally:
        connection.close()


@app.route("/students/<int:student_id>", methods=["PUT"])
def update_student(student_id):

    data = request.get_json()

    username = data.get("username")
    password = data.get("password")
    roll_no = data.get("roll_no")
    name = data.get("name")
    email = data.get("email")
    course_id = data.get("course_id")
    age = data.get("age")

    if not all([
        username,
        roll_no,
        name,
        email,
        course_id
    ]):
        return jsonify({
            "success": False,
            "message": "Username, roll number, name, email and course are required"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT user_id
                FROM students
                WHERE student_id = %s
            """, (student_id,))

            student = cursor.fetchone()

            if not student:
                return jsonify({
                    "success": False,
                    "message": "Student not found"
                }), 404

            user_id = student["user_id"]

            if password:
                cursor.execute("""
                    UPDATE users
                    SET username = %s,
                        password = %s
                    WHERE user_id = %s
                """, (username, password, user_id))
            else:
                cursor.execute("""
                    UPDATE users
                    SET username = %s
                    WHERE user_id = %s
                """, (username, user_id))

            cursor.execute("""
                UPDATE students
                SET roll_no = %s,
                    name = %s,
                    email = %s,
                    course_id = %s,
                    age = %s
                WHERE student_id = %s
            """, (
                roll_no,
                name,
                email,
                course_id,
                age,
                student_id
            ))

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Student updated successfully"
            })

    except pymysql.err.IntegrityError:
        connection.rollback()

        return jsonify({
            "success": False,
            "message": "Username, roll number or email already exists"
        }), 409

    finally:
        connection.close()


@app.route("/students/<int:student_id>", methods=["DELETE"])
def delete_student(student_id):

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT user_id
                FROM students
                WHERE student_id = %s
            """, (student_id,))

            student = cursor.fetchone()

            if not student:
                return jsonify({
                    "success": False,
                    "message": "Student not found"
                }), 404

            user_id = student["user_id"]

            cursor.execute("""
                DELETE FROM attendance
                WHERE student_id = %s
            """, (student_id,))

            cursor.execute("""
                DELETE FROM marks
                WHERE student_id = %s
            """, (student_id,))

            cursor.execute("""
                DELETE FROM students
                WHERE student_id = %s
            """, (student_id,))

            cursor.execute("""
                DELETE FROM users
                WHERE user_id = %s
            """, (user_id,))

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Student deleted successfully"
            })

    finally:
        connection.close()


@app.route("/students/<username>", methods=["GET"])
def get_student_profile(username):

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    s.student_id,
                    u.user_id,
                    u.username,
                    s.roll_no,
                    s.name,
                    s.email,
                    s.age,
                    s.course_id,
                    c.course_name,
                    c.department
                FROM users u
                JOIN students s
                    ON u.user_id = s.user_id
                LEFT JOIN courses c
                    ON s.course_id = c.course_id
                WHERE u.username = %s
                AND u.role = 'student'
            """, (username,))

            student = cursor.fetchone()

            if not student:
                return jsonify({
                    "success": False,
                    "message": "Student not found"
                }), 404

            return jsonify(student)

    finally:
        connection.close()


# ============================================================
# MARKS
# ============================================================

@app.route("/marks", methods=["GET"])
def get_all_marks():

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    m.mark_id,
                    m.student_id,
                    m.course_id,
                    m.subject_id,
                    s.name AS student_name,
                    s.roll_no,
                    c.course_name,
                    sub.subject_name,
                    m.marks,
                    m.grade
                FROM marks m
                JOIN students s
                    ON m.student_id = s.student_id
                JOIN courses c
                    ON m.course_id = c.course_id
                JOIN subjects sub
                    ON m.subject_id = sub.subject_id
                ORDER BY s.roll_no, sub.subject_name
            """)

            return jsonify(cursor.fetchall())

    finally:
        connection.close()


@app.route("/marks", methods=["POST"])
def add_marks():

    data = request.get_json()

    student_id = data.get("student_id")
    course_id = data.get("course_id")
    subject_id = data.get("subject_id")
    marks = data.get("marks")
    grade = data.get("grade")

    if (
        student_id is None
        or course_id is None
        or subject_id is None
        or marks is None
    ):
        return jsonify({
            "success": False,
            "message": "Student, course, subject and marks are required"
        }), 400

    if int(marks) < 0 or int(marks) > 100:
        return jsonify({
            "success": False,
            "message": "Marks must be between 0 and 100"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                INSERT INTO marks
                (
                    student_id,
                    course_id,
                    subject_id,
                    marks,
                    grade
                )
                VALUES (%s, %s, %s, %s, %s)
            """, (
                student_id,
                course_id,
                subject_id,
                marks,
                grade
            ))

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Marks added successfully",
                "mark_id": cursor.lastrowid
            }), 201

    finally:
        connection.close()


@app.route("/marks/<int:mark_id>", methods=["PUT"])
def update_marks(mark_id):

    data = request.get_json()

    student_id = data.get("student_id")
    course_id = data.get("course_id")
    subject_id = data.get("subject_id")
    marks = data.get("marks")
    grade = data.get("grade")

    if (
        student_id is None
        or course_id is None
        or subject_id is None
        or marks is None
    ):
        return jsonify({
            "success": False,
            "message": "All mark fields are required"
        }), 400

    if int(marks) < 0 or int(marks) > 100:
        return jsonify({
            "success": False,
            "message": "Marks must be between 0 and 100"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                UPDATE marks
                SET student_id = %s,
                    course_id = %s,
                    subject_id = %s,
                    marks = %s,
                    grade = %s
                WHERE mark_id = %s
            """, (
                student_id,
                course_id,
                subject_id,
                marks,
                grade,
                mark_id
            ))

            if cursor.rowcount == 0:
                return jsonify({
                    "success": False,
                    "message": "Mark record not found"
                }), 404

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Marks updated successfully"
            })

    finally:
        connection.close()


@app.route("/marks/<int:mark_id>", methods=["DELETE"])
def delete_marks(mark_id):

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                DELETE FROM marks
                WHERE mark_id = %s
            """, (mark_id,))

            if cursor.rowcount == 0:
                return jsonify({
                    "success": False,
                    "message": "Mark record not found"
                }), 404

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Marks deleted successfully"
            })

    finally:
        connection.close()


@app.route("/marks/<username>", methods=["GET"])
def get_student_marks(username):

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    m.mark_id,
                    m.student_id,
                    m.course_id,
                    m.subject_id,
                    sub.subject_name AS subject,
                    m.marks,
                    m.grade
                FROM marks m
                JOIN students s
                    ON m.student_id = s.student_id
                JOIN users u
                    ON s.user_id = u.user_id
                JOIN subjects sub
                    ON m.subject_id = sub.subject_id
                WHERE u.username = %s
                AND u.role = 'student'
                ORDER BY sub.subject_name
            """, (username,))

            return jsonify(cursor.fetchall())

    finally:
        connection.close()


# ============================================================
# ATTENDANCE
# ============================================================

@app.route("/attendance", methods=["GET"])
def get_all_attendance():

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    a.attendance_id,
                    a.student_id,
                    a.course_id,
                    a.subject_id,
                    s.name AS student_name,
                    s.roll_no,
                    c.course_name,
                    sub.subject_name,
                    a.total_classes,
                    a.attended_classes,
                    (a.total_classes - a.attended_classes) AS absent,
                    ROUND(
                        (a.attended_classes / a.total_classes) * 100,
                        2
                    ) AS percentage
                FROM attendance a
                JOIN students s
                    ON a.student_id = s.student_id
                JOIN courses c
                    ON a.course_id = c.course_id
                JOIN subjects sub
                    ON a.subject_id = sub.subject_id
                ORDER BY s.roll_no, sub.subject_name
            """)

            return jsonify(cursor.fetchall())

    finally:
        connection.close()


@app.route("/attendance", methods=["POST"])
def add_attendance():

    data = request.get_json()

    student_id = data.get("student_id")
    course_id = data.get("course_id")
    subject_id = data.get("subject_id")
    total_classes = data.get("total_classes")
    attended_classes = data.get("attended_classes")

    if (
        student_id is None
        or course_id is None
        or subject_id is None
        or total_classes is None
        or attended_classes is None
    ):
        return jsonify({
            "success": False,
            "message": "All attendance fields are required"
        }), 400

    if attended_classes > total_classes:
        return jsonify({
            "success": False,
            "message": "Attended classes cannot exceed total classes"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                INSERT INTO attendance
                (
                    student_id,
                    course_id,
                    subject_id,
                    total_classes,
                    attended_classes
                )
                VALUES (%s, %s, %s, %s, %s)
            """, (
                student_id,
                course_id,
                subject_id,
                total_classes,
                attended_classes
            ))

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Attendance added successfully",
                "attendance_id": cursor.lastrowid
            }), 201

    finally:
        connection.close()


@app.route("/attendance/<int:attendance_id>", methods=["PUT"])
def update_attendance(attendance_id):

    data = request.get_json()

    student_id = data.get("student_id")
    course_id = data.get("course_id")
    subject_id = data.get("subject_id")
    total_classes = data.get("total_classes")
    attended_classes = data.get("attended_classes")

    if (
        student_id is None
        or course_id is None
        or subject_id is None
        or total_classes is None
        or attended_classes is None
    ):
        return jsonify({
            "success": False,
            "message": "All attendance fields are required"
        }), 400

    if int(attended_classes) > int(total_classes):
        return jsonify({
            "success": False,
            "message": "Attended classes cannot exceed total classes"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                UPDATE attendance
                SET student_id = %s,
                    course_id = %s,
                    subject_id = %s,
                    total_classes = %s,
                    attended_classes = %s
                WHERE attendance_id = %s
            """, (
                student_id,
                course_id,
                subject_id,
                total_classes,
                attended_classes,
                attendance_id
            ))

            if cursor.rowcount == 0:
                return jsonify({
                    "success": False,
                    "message": "Attendance record not found"
                }), 404

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Attendance updated successfully"
            })

    finally:
        connection.close()


@app.route("/attendance/<int:attendance_id>", methods=["DELETE"])
def delete_attendance(attendance_id):

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                DELETE FROM attendance
                WHERE attendance_id = %s
            """, (attendance_id,))

            if cursor.rowcount == 0:
                return jsonify({
                    "success": False,
                    "message": "Attendance record not found"
                }), 404

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Attendance deleted successfully"
            })

    finally:
        connection.close()


@app.route("/attendance/<username>", methods=["GET"])
def get_student_attendance(username):

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    a.attendance_id,
                    a.student_id,
                    a.course_id,
                    a.subject_id,
                    sub.subject_name AS subject,
                    a.total_classes,
                    a.attended_classes,
                    (a.total_classes - a.attended_classes) AS absent,
                    ROUND(
                        (a.attended_classes / a.total_classes) * 100,
                        2
                    ) AS percentage
                FROM attendance a
                JOIN students s
                    ON a.student_id = s.student_id
                JOIN users u
                    ON s.user_id = u.user_id
                JOIN subjects sub
                    ON a.subject_id = sub.subject_id
                WHERE u.username = %s
                AND u.role = 'student'
                ORDER BY sub.subject_name
            """, (username,))

            return jsonify(cursor.fetchall())

    finally:
        connection.close()


# ==============================
# RUN SERVER
# ==============================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000
    )
