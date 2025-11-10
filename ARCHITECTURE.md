# HMS Microservices Architecture

## Overview
A scalable Hospital Management System (HMS) built with Node.js microservices, PostgreSQL databases, Docker containerization, and Kubernetes orchestration. Features include patient management, doctor scheduling, appointment booking, billing, prescriptions, notifications, and robust business rules for healthcare workflows.

---

## Architecture Diagram
```mermaid
graph TD
    PatientService[Patient Service]
    DoctorService[Doctor Service]
    AppointmentService[Appointment Service]
    BillingService[Billing Service]
    PrescriptionService[Prescription Service]
    NotificationService[Notification Service]
    PatientDB[(Patient DB)]
    DoctorDB[(Doctor DB)]
    AppointmentDB[(Appointment DB)]
    BillingDB[(Billing DB)]
    PrescriptionDB[(Prescription DB)]
    NotificationDB[(Notification DB)]

    PatientService -- REST --> PatientDB
    DoctorService -- REST --> DoctorDB
    AppointmentService -- REST --> AppointmentDB
    BillingService -- REST --> BillingDB
    PrescriptionService -- REST --> PrescriptionDB
    NotificationService -- REST --> NotificationDB
    AppointmentService -- REST --> PatientService
    AppointmentService -- REST --> DoctorService
    AppointmentService -- REST --> BillingService
    BillingService -- REST --> PaymentService
```

---

## Service Descriptions

- **Patient Service:** Manages patient records, registration, and updates. Owns patient data and exposes endpoints for CRUD operations.
- **Doctor Service:** Handles doctor profiles, schedules, and availability. Owns doctor data and provides endpoints for profile and schedule management.
- **Appointment Service:** Orchestrates booking, rescheduling, cancellation, and completion of appointments. Coordinates with patient, doctor, and billing services.
- **Billing Service:** Generates bills, applies refund rules, and tracks payment status. Owns billing data and interacts with appointment and payment services.
- **Prescription Service:** Manages prescriptions issued by doctors for patients. Owns prescription data and provides endpoints for prescription management.
- **Notification Service:** Sends alerts and reminders to patients and doctors. Integrates with other services to trigger notifications.

---

## API Endpoints

| Service      | Endpoint                  | Method | Request Sample | Response Sample |
|--------------|---------------------------|--------|---------------|----------------|
| Patient      | /patients                 | POST   | `{ "name": "John Doe", "dob": "1990-01-01" }` | `{ "id": 1, "name": "John Doe" }` |
| Doctor       | /doctors                  | GET    |               | `[ { "id": 1, "name": "Dr. Smith" } ]` |
| Appointment  | /appointments             | POST   | `{ "patientId": 1, "doctorId": 2, "slot": "2025-11-12T10:00" }` | `{ "id": 10, "status": "BOOKED" }` |
| Billing      | /bills                    | GET    |               | `[ { "id": 5, "amount": 500 } ]` |
| Prescription | /prescriptions            | POST   | `{ "patientId": 1, "doctorId": 2, "meds": ["Paracetamol"] }` | `{ "id": 3, "status": "ISSUED" }` |
| Notification | /notify                   | POST   | `{ "userId": 1, "message": "Your appointment is tomorrow" }` | `{ "status": "sent" }` |

---

## Components

### 1. Microservices
Each service is a Node.js application with its own REST API and database connection:

- **Appointment Service** (`appointment-service`)
  - Manages appointments between patients and doctors.
  - Connects to its own Postgres database (`appointment-db`).
- **Billing Service** (`billing-service`)
  - Handles billing and invoices for patient treatments.
  - Connects to its own Postgres database (`billing-db`).
- **Doctor Service** (`doctor-service`)
  - Manages doctor profiles and schedules.
  - Connects to its own Postgres database (`doctor-db`).
- **Patient Service** (`patient-service`)
  - Manages patient records and information.
  - Connects to its own Postgres database (`patient-db`).
- **Payment Service** (`payment-service`)
  - Handles payment processing and records.
  - Connects to its own Postgres database (`payment-db`).
- **Prescription Service** (`prescription-service`)
  - Manages prescriptions issued to patients.
  - Connects to its own Postgres database (`prescription-db`).

Each service exposes its own API endpoint (e.g., `/appointments`, `/patients`, etc.) and communicates with its database only.

---

### 2. Databases
Each microservice has a dedicated PostgreSQL database container. This ensures data isolation and scalability. Database containers are named and configured to match their corresponding service.

---

### 3. Containerization
- **Docker Compose:**
  - Used for local development and testing.
  - Defines all services and databases in `docker-compose.yml`.
  - Volumes are used for database persistence.
- **Kubernetes (Minikube):**
  - Used for scalable, production-like orchestration.
  - Each service and database is defined as a Deployment and Service in YAML manifests (in the `k8s/` folder).
  - NodePort services expose APIs for external access.

---

## Service Interaction
- Services are loosely coupled and communicate via REST APIs.
- Each service is responsible for its own data and business logic.
- There is no direct database sharing between services.
- Services can be scaled independently.

---

## Data Flow Example
1. **Patient books an appointment:**
   - Patient Service creates/updates patient record.
   - Appointment Service schedules appointment with Doctor Service.
2. **Doctor issues a prescription:**
   - Prescription Service records prescription for patient.
3. **Billing and payment:**
   - Billing Service generates invoice for treatment.
   - Payment Service processes payment and updates billing status.

---

## Deployment Workflow
### Docker Compose
1. Run `docker-compose up --build` to start all services and databases.
2. Import initial SQL data if needed.
3. Test endpoints using Postman or similar tools.

### Kubernetes (Minikube)
1. Build Docker images inside Minikube's Docker daemon.
2. Apply manifests: `kubectl apply -f k8s/`
3. Import SQL data into database pods if needed.
4. Access services using `minikube service <service-name>`.

---

## Scaling & Fault Tolerance
- Each service can be scaled by increasing replica count in its Deployment.
- Failure in one service does not affect others (unless they depend on its API).
- Databases are isolated, reducing risk of data corruption.

---

## Security & Isolation
- Each service has its own database credentials and environment variables.
- No direct database access between services.
- Sensitive data (passwords, connection strings) should be managed via Kubernetes Secrets in production.

---

## Extensibility
- New services can be added easily by creating new microservices and database containers.
- APIs can be extended for new features.

---

## Folder Structure
```
appointment-service/
  Dockerfile
  index.js
  package.json
billing-service/
  Dockerfile
  index.js
  package.json
... (other services)
k8s/
  (Kubernetes YAML manifests)
db-init/
  (SQL initialization files)
docker-compose.yml
README.md
```
---

## System Overview

## Service Breakdown

### 1. Appointment Service
Purpose: Manages appointments between patients and doctors.
Main Endpoints:
- POST /appointments – Create appointment
- GET /appointments/:id – Get appointment details
- GET /appointments – List appointments
Function Calls:
- createAppointment(patientId, doctorId, time)
- getAppointment(id)
- listAppointments(filter)
Database: hms_appointments (Postgres)
Container: appointment-service:latest

### 2. Doctor Service
Purpose: Manages doctor profiles and schedules.
Main Endpoints:
- POST /doctors – Add doctor
- GET /doctors/:id – Get doctor details
- GET /doctors – List doctors
Function Calls:
- addDoctor(profile)
- getDoctor(id)
- listDoctors(specialty)
Database: hms_doctors (Postgres)
Container: doctor-service:latest

### 3. Patient Service
Purpose: Manages patient records.
Main Endpoints:
- POST /patients – Add patient
- GET /patients/:id – Get patient details
- GET /patients – List patients
Function Calls:
- addPatient(profile)
- getPatient(id)
- listPatients(filter)
Database: hms_patients (Postgres)
Container: patient-service:latest

### 4. Billing Service
Purpose: Handles billing and invoices.
Main Endpoints:
- POST /bills – Create bill
- GET /bills/:id – Get bill details
- GET /bills – List bills
Function Calls:
- createBill(patientId, amount, details)
- getBill(id)
- listBills(filter)
Database: hms_billing (Postgres)
Container: billing-service:latest

### 5. Payment Service
Purpose: Processes payments.
Main Endpoints:
- POST /payments – Make payment
- GET /payments/:id – Get payment details
- GET /payments – List payments
Function Calls:
- makePayment(billId, amount, method)
- getPayment(id)
- listPayments(filter)
Database: hms_payments (Postgres)
Container: payment-service:latest

### 6. Prescription Service
Purpose: Manages prescriptions.
Main Endpoints:
- POST /prescriptions – Add prescription
- GET /prescriptions/:id – Get prescription details
- GET /prescriptions – List prescriptions
Function Calls:
- addPrescription(patientId, doctorId, medication)
- getPrescription(id)
- listPrescriptions(filter)
Database: hms_prescriptions (Postgres)
Container: prescription-service:latest

---

## Application Setup & Containerization

### Folder Structure
```
Scalable-Services-Assignment-HMS-App/
│
├─ appointment-service/
│    ├─ Dockerfile
│    ├─ index.js
│    └─ package.json
├─ billing-service/
│    ├─ Dockerfile
│    ├─ index.js
│    └─ package.json
├─ doctor-service/
│    ├─ Dockerfile
│    ├─ index.js
│    └─ package.json
├─ patient-service/
│    ├─ Dockerfile
│    ├─ index.js
│    └─ package.json
├─ payment-service/
│    ├─ Dockerfile
│    ├─ index.js
│    └─ package.json
├─ prescription-service/
│    ├─ Dockerfile
│    ├─ index.js
│    └─ package.json
├─ db-init/
│    └─ *.sql
├─ k8s/
│    └─ *.yaml
├─ docker-compose.yml
└─ ARCHITECTURE.md
```

### Docker Compose Example
```
Build and start all services:
docker-compose up --build
Import SQL data if needed.
Test endpoints using Postman.
```

### Kubernetes Example
```
Build Docker images inside Minikube.
Apply manifests:
kubectl apply -f k8s/
Import SQL data into database pods.
Access services using:
minikube service <service-name>
```

---

## Service Communication Diagram

---

## Summary Table
| Service      | Port  | DB Name           | Main Functions                |
|--------------|-------|-------------------|-------------------------------|
| appointment  | 3001  | hms_appointments  | create, get, list appointments|
| billing      | 3002  | hms_billing       | create, get, list bills       |
| doctor       | 3003  | hms_doctors       | add, get, list doctors        |
| patient      | 3004  | hms_patients      | add, get, list patients       |
| payment      | 3005  | hms_payments      | make, get, list payments      |
| prescription | 3006  | hms_prescriptions | add, get, list prescriptions  |

---

## Extensibility & Security
- Add new services by creating new microservices and database containers.
- APIs can be extended for new features.
- Use Kubernetes Secrets for sensitive data in production.
- Each service is isolated for security and fault tolerance.

---

## Inter-Service Workflows

### 1. Booking an Appointment

```mermaid
sequenceDiagram
    participant Patient
    participant PatientService
    participant AppointmentService
    participant DoctorService
    participant AppointmentDB
    participant DoctorDB

    Patient->>PatientService: POST /patients
    PatientService->>AppointmentService: POST /appointments
    AppointmentService->>AppointmentDB: Create appointment
    AppointmentService->>DoctorService: GET /doctors/:id
    DoctorService->>DoctorDB: Fetch doctor details
    AppointmentService->>AppointmentDB: Link doctor to appointment
```

---

### 2. Reschedule Appointment
- **Endpoint:** `PUT /appointments/:id/reschedule`
- **Rules:**
  - Max 2 reschedules per appointment.
  - Cannot reschedule within 1 hour of slot start.
- **Statuses:**
  - `RESCHEDULED` (with reschedule count)
  - `RESCHEDULE_LIMIT_EXCEEDED` (if >2)
  - `RESCHEDULE_CUTOFF_EXCEEDED` (if <1h)

```mermaid
sequenceDiagram
    participant Patient
    participant AppointmentService
    participant AppointmentDB

    Patient->>AppointmentService: PUT /appointments/:id/reschedule
    AppointmentService->>AppointmentDB: Check reschedule count & slot time
    alt Allowed
        AppointmentService->>AppointmentDB: Update appointment slot & status
    else Not Allowed
        AppointmentService->>Patient: Error (limit/cutoff)
    end
```

---

### 3. Cancel Appointment
- **Endpoint:** `DELETE /appointments/:id/cancel`
- **Rules:**
  - Cancel > 2h before start → full refund.
  - Cancel ≤ 2h → 50% fee (document amount or rule).
  - No-show → 100% consultation fee charged or flagged.
- **Statuses:**
  - `CANCELLED_FULL_REFUND`
  - `CANCELLED_PARTIAL_REFUND`
  - `NO_SHOW`

```mermaid
sequenceDiagram
    participant Patient
    participant AppointmentService
    participant BillingService
    participant AppointmentDB
    participant BillingDB

    Patient->>AppointmentService: DELETE /appointments/:id/cancel
    AppointmentService->>AppointmentDB: Check time to slot
    alt >2h before
        AppointmentService->>BillingService: Issue full refund
        BillingService->>BillingDB: Update bill
    else ≤2h before
        AppointmentService->>BillingService: Issue partial refund (50%)
        BillingService->>BillingDB: Update bill
    end
    AppointmentService->>AppointmentDB: Update status
```

---

### 4. No-Show Handling
- **Endpoint:** `PUT /appointments/:id/no-show` (system/desk action)
- **Process:**
  - Reception marks appointment NO_SHOW after grace period (e.g., 15 minutes).
  - Appointment → Billing: create/adjust bill per no-show fee policy.
- **Status:**
  - `NO_SHOW`

```mermaid
sequenceDiagram
    participant Reception
    participant AppointmentService
    participant BillingService
    participant AppointmentDB
    participant BillingDB

    Reception->>AppointmentService: PUT /appointments/:id/no-show
    AppointmentService->>AppointmentDB: Update status to NO_SHOW
    AppointmentService->>BillingService: Create/adjust bill for no-show fee
    BillingService->>BillingDB: Update bill
```

---

### 5. Complete Appointment → Bill & Pay
- **Endpoint:** `PUT /appointments/:id/complete`
- **Process:**
  - Appointment status → COMPLETED
  - Appointment → Billing Service to create bill (consultation + meds + 5% tax).
- **Status:**
  - `COMPLETED`

```mermaid
sequenceDiagram
    participant Doctor
    participant AppointmentService
    participant BillingService
    participant PaymentService
    participant AppointmentDB
    participant BillingDB
    participant PaymentDB

    Doctor->>AppointmentService: PUT /appointments/:id/complete
    AppointmentService->>AppointmentDB: Update status to COMPLETED
    AppointmentService->>BillingService: Create bill (consultation + meds + tax)
    BillingService->>BillingDB: Store bill
    Patient->>PaymentService: POST /payments
    PaymentService->>PaymentDB: Record payment
    PaymentService->>BillingService: Update bill status
```

---

## Database-Per-Service

### Example ER Diagram (Appointment Service)
```mermaid
erDiagram
    APPOINTMENT {
        int id
        int patient_id
        int doctor_id
        datetime slot
        string status
        int reschedule_count
    }
    PATIENT ||--o{ APPOINTMENT : books
    DOCTOR ||--o{ APPOINTMENT : attends
```
_Note: Each service has its own DB. Read models may be replicated for reporting._

---

## Context Map

| Service         | Owns Data         | Consumes Data From      |
|-----------------|------------------|------------------------|
| Patient         | PatientDB        | Appointment, Billing   |
| Doctor          | DoctorDB         | Appointment, Prescription |
| Appointment     | AppointmentDB    | Patient, Doctor, Billing |
| Billing         | BillingDB        | Appointment, Payment   |
| Prescription    | PrescriptionDB   | Doctor, Patient        |
| Notification    | NotificationDB   | All services           |

---

## Inter-service Workflows

### Booking
1. Patient requests appointment.
2. Appointment Service checks doctor availability.
3. Appointment created, status = BOOKED.

### Rescheduling
- Max 2 reschedules, not allowed <1h before slot.
- Status changes: RESCHEDULED, LIMIT_EXCEEDED, CUTOFF_EXCEEDED.

### Cancel
- >2h: full refund, ≤2h: 50% fee, no-show: 100% fee.

### No-Show
- Reception marks NO_SHOW, triggers billing adjustment.

### Completion
- Doctor marks COMPLETED, triggers bill creation and payment.

---

## Business Rules

- Max 2 reschedules per appointment.
- No reschedule within 1 hour of slot.
- Cancel >2h: full refund; ≤2h: 50% fee.
- No-show: 100% consultation fee.
- Bill includes consultation, meds, 5% tax.

---

## Containerization

- Each service has a Dockerfile:
  ```Dockerfile
  FROM node:18
  WORKDIR /app
  COPY package*.json ./
  RUN npm install
  COPY . .
  EXPOSE <port>
  CMD ["node", "index.js"]
  ```
- `docker-compose.yml` example:
  ```yaml
  version: '3.8'
  services:
    appointment-service:
      build: ./appointment-service
      ports:
        - "3001:3001"
      environment:
        DATABASE_URL: postgresql://postgres:postgres@appointment-db:5432/hms_appointments
    appointment-db:
      image: postgres:18
      environment:
        POSTGRES_DB: hms_appointments
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
      ports:
        - "5431:5432"
      volumes:
        - appointment-db-data:/var/lib/postgresql
  volumes:
    appointment-db-data:
  ```

---

## Kubernetes Deployment

- Example manifests for Deployment, Service, ConfigMap/Secret, PVC.
- Diagram of pods and services.

---

## Monitoring & Logs

- Metrics: Prometheus, Grafana dashboard.
- Logs: JSON format, centralized logging.
- Tracing: Jaeger or Zipkin.

---

## Testing

- Unit test sample (Jest/Mocha).
- Postman collection.
- Sample test run output.

---

## Design Decisions

- Microservices for scalability and isolation.
- DB-per-service for autonomy.
- REST for synchronous calls, messaging for async (if used).
- Containerization for portability.

---

## Setup Instructions

1. Clone repo.
2. Run `docker-compose up --build`.
3. Seed DBs with SQL files.
4. Access Swagger UI at `/swagger` endpoint.
