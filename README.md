# HMS Assignment

A scalable Hospital Management System (HMS) built with Node.js microservices, PostgreSQL databases, Docker containerization, and Kubernetes orchestration. The system supports patient management, doctor scheduling, appointment booking, billing, prescriptions, and payment workflows.

## Microservices
- **Doctor Service:** Manages doctor profiles and schedules.
- **Patient Service:** Handles patient records and registration.
- **Appointment Service:** Orchestrates booking, rescheduling, cancellation, and completion of appointments.
- **Prescription Service:** Manages prescriptions issued by doctors for patients.
- **Billing Service:** Generates bills, applies refund rules, and tracks payment status.
- **Payment Service:** Processes payments and updates billing status.

## Features
- RESTful APIs for each domain
- Isolated PostgreSQL database per service
- Business rules for rescheduling, cancellation, refunds, and no-shows
- Containerized with Docker and orchestrated via Docker Compose or Kubernetes
- Easily extensible and scalable

## Tech Stack
- Node.js
- PostgreSQL
- Docker & Docker Compose
- Kubernetes (Minikube)

## Structure
Each service is located in its own folder. See the `docker-compose.yml` for service orchestration. Kubernetes manifests are in the `k8s/` folder.

## Getting Started

1. Clone the repository.
2. Use Docker Compose to build and run all services:
   ```sh
   docker-compose up --build
   ```
3. For Kubernetes, build images inside Minikube and apply manifests:
   ```sh
   kubectl apply -f k8s/
   ```
4. See the `ARCHITECTURE.md` for detailed architecture, workflows, and API documentation.
