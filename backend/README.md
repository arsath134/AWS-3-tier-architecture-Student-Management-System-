# Student Management System - Backend

Backend API for the Student Management System, built with **Python Flask** and **PyMySQL**.

The backend runs on a separate AWS EC2 instance named **`student-backend`** as part of the project's 3-tier architecture.

## Architecture

```text
Application Load Balancer
          ↓
Backend EC2
student-backend
          ↓
Amazon RDS
MySQL
```

## Features

* Admin and Student login
* Student CRUD operations
* Course CRUD operations
* Subject CRUD operations
* Marks management
* Attendance management
* Student profile
* REST API

## Technologies

* Python
* Flask
* PyMySQL
* Amazon EC2
* Amazon RDS
* MySQL

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Set database credentials using environment variables:

```bash
export DB_HOST="your-rds-endpoint"
export DB_USER="your-database-user"
export DB_PASSWORD="your-database-password"
export DB_NAME="student_db"
```

Run the backend:

```bash
python app.py
```

Backend runs on:

```text
0.0.0.0:5000
```

## Security

Database credentials are stored as environment variables and are **not included in the GitHub repository**.

## Author

**Mohamed Arsath**

