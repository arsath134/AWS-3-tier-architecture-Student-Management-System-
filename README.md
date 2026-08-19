# Student Management System

A web-based Student Management System built using HTML, CSS, JavaScript, Python Flask, and MySQL.

The application is deployed on AWS using a 3-tier architecture with separate frontend, backend, and database layers.

## Architecture


                              INTERNET
                                  │
                                  ▼
                        ┌──────────────────┐
                        │ Internet Gateway │
                        └────────┬─────────┘
                                 │
                         VPC: 12.0.0.0/21
                                 │
                    ┌────────────▼────────────┐
                    │      PUBLIC SUBNET      │
                    │                         │
                    │  Route Table            │
                    │  0.0.0.0/0 → IGW        │ 
                    │                         │
                    │  ┌────────────────────┐ │
                    │  │ Application Load   │ │
                    │  │ Balancer           │ │
                    │  │ SG: ALB-SG         │ │
                    │  │ :80 / :443         │ │
                    │  └─────────┬──────────┘ │
                    └────────────┼────────────┘
                                 │
                         ┌───────▼────────┐
                         │  TARGET GROUPS │
                         └───────┬────────┘
                           ┌─────┴─────┐
                           │           │
                 ┌─────────▼───┐   ┌───▼──────────────┐
                 │ FRONTEND TG │   │  BACKEND TG      │
                 │    :80      │   │     :5000        │
                 └──────┬──────┘   └──────┬───────────┘
                        │                 │
                        │ PRIVATE SUBNETS │
                        │                 │
              ┌─────────▼──────┐   ┌──────▼─────────────┐
              │  FRONTEND EC2  │   │    BACKEND EC2     │
              │                │   │                    │
              │  HTML/CSS/JS   │   │ student-backend    │
              │  :80           │   │ Flask API :5000    │
              │                │   │                    │
              │  Frontend-SG   │   │ Backend-SG         │
              └────────────────┘   └──────────┬─────────┘
                                               │
                                               │ :3306
                                               ▼
                                  ┌────────────────────────┐
                                  │    PRIVATE DB SUBNET   │
                                  │                        │
                                  │    RDS-SG              │
                                  │                        │
                                  │    Amazon RDS MySQL    │
                                  │    student_db          │
                                  │    :3306               │
                                  └────────────────────────┘

                                     SECURITY GROUP FLOW

                                          Internet
                                              │
                                              ▼
                                            ALB-SG
                                       :80 / :443
                                        │
                                        ├──────────────► Frontend-SG :80
                                        │
                                        └──────────────► Backend-SG :5000
                                        │
                                        ▼
                                  RDS-SG :3306

                                      ROUTE TABLES

                                    Public Route Table
                                           │
                                           ├── 12.0.0.0/21 → local
                                           └── 0.0.0.0/0   → Internet Gateway

                                   Private Route Table
                                           │
                                           └── 12.0.0.0/21 → local

### Tiers

Presentation Tier
- HTML
- CSS
- JavaScript
- Frontend EC2

Application Tier
- Python
- Flask
- PyMySQL
- Backend EC2 (`student-backend`)

Database Tier
- MySQL
- Amazon RDS


# Technologies

- HTML
- CSS
- JavaScript
- Python
- Flask
- PyMySQL
- MySQL
- Amazon EC2
- Amazon RDS
- Application Load Balancer
- Amazon VPC
- AWS Systems Manager


# Features

## Admin

- Admin login
- Add students
- Update students
- Delete students
- Add courses
- Update courses
- Delete courses
- Add subjects
- Update subjects
- Delete subjects
- Add marks
- Update marks
- Delete marks
- Add attendance
- Update attendance
- Delete attendance

## Student

- Student login
- View profile
- View course information
- View marks
- View attendance
- View attendance percentage


# AWS Configuration

## 1. VPC

Create a custom VPC for the application.

Example:

VPC
├── Public Subnet
│   └── Application Load Balancer
│
├── Private Application Subnet
│   ├── Frontend EC2
│   └── Backend EC2
│
└── Private Database Subnet
    └── Amazon RDS

The ALB is public, while the EC2 instances and RDS remain private.


## 2. Frontend EC2

Create a separate EC2 instance for the frontend.

The frontend contains:

- HTML
- CSS
- JavaScript

The frontend communicates with the backend through the Application Load Balancer.


## 3. Backend EC2

Create a separate EC2 instance for the backend.

EC2 instance name:

student-backend

The backend runs:

- Python
- Flask
- PyMySQL

Flask listens on port 5000.

The backend connects to Amazon RDS for database operations.


## 4. Amazon RDS

Create an Amazon RDS MySQL database in the private database subnet.

Database:

student_db

Tables:

- users
- students
- courses
- subjects
- marks
- attendance

The RDS instance should not be publicly accessible.

Database access is allowed only from the backend EC2 security group.


## 5. Application Load Balancer

Create an Application Load Balancer as the public entry point.

The ALB:

- Receives public HTTP/HTTPS requests
- Routes requests to the application tier
- Provides a single public endpoint

Example routing:

/api/* → Backend Target Group
/*     → Frontend Target Group

The exact routing depends on the ALB listener configuration.


# Security Group Configuration

Use separate Security Groups for each AWS component:

- student-alb-sg
- student-frontend-sg
- student-backend-sg
- student-rds-sg


## 1. ALB Security Group

Security Group:

student-alb-sg

### Inbound Rules

| Type  | Port | Source       |
|-------|------|--------------|
| HTTP  | 80   | 0.0.0.0/0    |
| HTTPS | 443  | 0.0.0.0/0    |

The ALB is the public entry point.

### Outbound

Allow traffic to the frontend and backend target groups.


## 2. Frontend EC2 Security Group

Security Group:

student-frontend-sg

### Inbound Rules

| Type  | Port | Source           |
|-------|------|------------------|
| HTTP  | 80   | student-alb-sg   |

Only the ALB should access the frontend server.

SSH should not be opened publicly.

AWS Systems Manager can be used to manage the EC2 instance.


## 3. Backend EC2 Security Group

Security Group:

student-backend-sg

### Inbound Rules

| Type        | Port | Source           |
|-------------|------|------------------|
| Custom TCP  | 5000 | student-alb-sg   |

The Flask backend runs on port 5000.

Only the ALB should access the backend API.

Do not expose port 5000 to the internet.


## 4. RDS Security Group

Security Group:

student-rds-sg

### Inbound Rules

| Type          | Port | Source              |
|---------------|------|---------------------|
| MySQL/Aurora  | 3306 | student-backend-sg  |

Only the backend EC2 can connect to MySQL.

Do not allow:

3306 → 0.0.0.0/0


# Port Summary

| Component      | Port | Allowed Source          |
|----------------|------|-------------------------|
| ALB            | 80   | Internet                |
| ALB            | 443  | Internet                |
| Frontend EC2   | 80   | ALB Security Group      |
| Backend EC2    | 5000 | ALB Security Group      |
| RDS MySQL      | 3306 | Backend Security Group  |


# AWS Systems Manager

AWS Systems Manager can be used to manage the private EC2 instances without exposing SSH directly to the internet.

The EC2 instances should have an IAM role containing:

AmazonSSMManagedInstanceCore

The SSM Agent must also be running on the EC2 instances.


# Backend Setup

Go to the backend directory:

cd backend

Create a virtual environment:

python3 -m venv venv

Activate it:

source venv/bin/activate

Install dependencies:

pip install -r requirements.txt


# Database Environment Variables

Database credentials are not stored in GitHub.

Configure the backend using environment variables:

export DB_HOST="your-rds-endpoint"
export DB_USER="your-database-user"
export DB_PASSWORD="your-database-password"
export DB_NAME="student_db"

The Flask application reads these values using Python os.getenv().


# Run Backend

Start the Flask application:

python app.py

The backend runs on:

0.0.0.0:5000

Test locally on the backend EC2:

curl http://localhost:5000/

Expected response:

Student Management Backend is running!


# Database Setup

The database schema is available in:

database/schema.sql

It creates the required tables:

- users
- students
- courses
- subjects
- marks
- attendance

# Deployment Flow

1. Create VPC
2. Create public and private subnets
3. Create Security Groups
4. Create private RDS MySQL
5. Create Frontend EC2
6. Create Backend EC2 named "student-backend"
7. Deploy Flask backend
8. Deploy frontend
9. Create Target Groups
10. Create Application Load Balancer
11. Configure listeners and routing
12. Test the application through the ALB


# Project Status

The Student Management System is deployed using AWS 3-tier architecture with:

- Separate Frontend EC2
- Separate Backend EC2
- Private Amazon RDS
- Application Load Balancer
- VPC networking
- Security Groups
- AWS Systems Manager


# Author

Mohamed Arsath
