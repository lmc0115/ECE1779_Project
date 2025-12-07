  

# Motivation

At the University of Toronto, news about campus activities and student life, including workshops, career fairs, and networking events, is disseminated across various platforms. This disintegrated communication framework, with **scattered event and activity details**, confuses students because they struggle to stay informed about events that align with their interests. Although there are some current solutions for event integration, such as Quercus announcements and social media by event organizations, they have **significant shortcomings**. Quercus pages are limited to university-based activities, while social media pages are spread across multiple accounts that are still difficult to follow up with. Due to the inconvenience, most students miss opportunities to be part of the wider campus life, as they often overlook extracurricular activities that can enhance their university experience. Meanwhile, some organizations struggle to attract students and expand their business.

To address the communication gap between students and event organizations, the team plans to develop a tool that integrates fragmented event and activity information at UofT, providing students and event organizers with a better experience for attending and hosting events. Therefore, University Connection (UniConn) is proposed as a **centralized,** **cloud-based platform** that consolidates all UofT-related events into a single, accessible, and user-friendly interface. The proposed solution, UniConn, aims to minimize the loss of communication caused by the current scattered event information.

The **target users** for UniConn can be separated and authenticated by two groups: **UofT students** who are actively seeking organized access to campus events, and **event organizers** who require a streamlined and interactive platform to reach their audiences more effectively. The system will enable users with different roles to engage in effective and comprehensive interactions. For **event organizers**, such as departments, clubs, and organizations, UniConn will enable them to publish event details and organizer profiles in a standardized and easily searchable format. For **UofT students**, UniConn will allow them to browse, filter, and interact with events that align with their academic and social interests, fostering a more connected and collaborative campus environment.

By centralizing event and activity information, **UniConn effectively enhances communication efficiency, accessibility, and community engagement within the university ecosystem**. In addition to its practical impact, the project also demonstrates the application of modern cloud-native architecture, featuring Dockerized backend services, PostgreSQL databases, and scalable deployment on DigitalOcean to ensure reliability, performance, and extensibility.


# Objective & Key Features

## Objective

The platform to be developed will set up a <b>centralized event aggregation platform</b> that will bring together events from different University of Toronto departments, faculties, and student organizations in one user-friendly portal. <b>This platform will act as the main entry point serving students, faculty members, and authorized organizations to find, organize, and attend university-wide events, to avoid excessive dispersed event information spread across different platforms.</b> The platform will allow authorized department personnel and verified organizers to <b>upload, edit, and manage</b> event information directly on the platform, making sure that the listings are always current and correct. The authorized student users will be able to <b>view and take part</b> in event participations as well as collaborative discussions, making sure that the students can attend any event or discuss anything that suits them.

Along with the centralized event aggregation platform, the system will also include <b>collaborative engagement features</b> such as event discussions, commenting, and RSVP functionality, to promote interaction and engagement across faculties. These social components aim to promote a sense of community among students, encouraging cross-disciplinary participation and dialogue around shared interests and academic activities.

In addition to the collaborative engagement features, all user data, events, and discussion threads will be securely stored in a <b>PostgreSQL database</b> backed by persistent DigitalOcean volumes. This approach will not only ensure <b>reliable state management</b> and data durability, but also allow the system to maintain integrity and continuity across container restarts, software updates, and redeployments.

Besides the reliable state management, the platform will also be deployed following <b>cloud-native design principles</b> using <b>Docker Swarm on DigitalOcean</b>. This enables effective container orchestration, replication, and load balancing, ensuring the application remains responsive and stable even under heavy, concurrent traffic conditions, such as during major university events or registration periods.

Furthermore, the system will integrate observability and monitoring functions through combined dashboards depicting major performance metrics such as CPU utilization, memory usage, API latency, and database utilization. The monitoring facilities will facilitate enhanced transparency, proactive debugging, as well as maintain the platform's reliability and performance during its cloud migrations.


## Technical Stack

UniConn is built using modern, cloud-native technologies designed for scalability, reliability, and maintainability.

**Backend**

**Node.js + Express.js**
Provides a lightweight and efficient RESTful API framework for handling event management, user authentication, and real-time interactions.

**Socket.io**
Enables real-time bidirectional communication for live event updates and collaborative features such as instant notifications and WebSocket-based interactions.

**PostgreSQL 16**
Stores all event data, user profiles, RSVPs, comments, and authentication records with ACID compliance and relational integrity. Integrated with DigitalOcean Volumes for persistent data storage across container restarts and deployments.

**JWT (JSON Web Tokens) + bcrypt**
Implements secure authentication and role-based access control. JWT tokens manage user sessions, while bcrypt ensures password security through hashing.

**SendGrid API**
Handles automated email notifications for RSVP confirmations, event reminders, and event updates to keep users informed.

**Monitoring & Observability**

**Prometheus + Grafana**
Provides comprehensive system monitoring with custom dashboards tracking CPU usage, memory consumption, API latency, request rates, and database performance. Prometheus collects metrics from the application, Traefik, and system exporters.

**Traefik**
Acts as a reverse proxy and load balancer with built-in service discovery, automatic HTTPS, and Prometheus metrics integration for traffic monitoring and routing.

**DigitalOcean Monitoring**
Complements the self-hosted monitoring stack with cloud provider metrics and alerting for infrastructure health.

**Containerization & Orchestration**

**Docker + Docker Compose**
Containerizes all services (API, PostgreSQL) for consistent local development and testing environments.

**Docker Swarm (on DigitalOcean)**
Orchestrates production deployment with automatic service replication, load balancing, and rolling updates. Chosen over Kubernetes for its simplicity and built-in integration with Docker, making it ideal for medium-scale deployments while maintaining cloud-native scalability.

**CI/CD & DevOps**

**GitHub Actions**
Automates build, test, and deployment pipelines to ensure code quality and streamline releases.

**Other Key Technologies**

**Helmet.js**
Enhances API security by setting HTTP headers that protect against common web vulnerabilities.

**prom-client**
Exposes application-level metrics (request duration, error rates) to Prometheus for observability.

**dotenv**
Manages environment variables and secrets securely across development and production environments.


## Key Features

| Objective | Key Features / Implementation | Description |
| ----- | ----- | ----- |
| **Centralized Event Aggregation** | Using REST API for event data management and retrieval according to different users | Provides standardized REST API endpoints that will enable access for different users based on user authentication levels, perform appropriate CRUD operations (such as creating, updating, viewing, or deleting event data). |
|  | Search and filter events by timestamp, faculty, type and other related preferences. | Enables users to quickly locate specific events within the centralized database. |
| **Collaborative Engagement and Real-Time Insights** | Via DigitalOcean Functions for Serverless notifications  | Sending automated alerts/notifications when organizers create or update events, or reminding students or organizers when crucial events occur. |
|  | Integration with External Services for extra notifications | Integrate with external services (e.g., SendGrid API) to send automated RSVP confirmations and event reminders, enhancing the serverless notification workflow.  |
| **Reliable State Management and Data Integrity** | Using PostgreSQL for event storage with persistent DigitalOcean volumes | Stores all event information securely and ensures data durability across redeployments and restarts for long-term records. |
|  | User authentication and organization-based access | Integrates secure authentication and manages role-based authorization for different users (e.g., department staff, organizers, and student users). Also, enforcing HTTPS encryption and secrets management to protect credentials, API keys, and sensitive configurations. |
| **Cloud-Native Deployment and Scalability** | Containerization and Local Development (Docker \+ Docker Compose) | Running the core services (e.g.Node.js backend, PostgreSQL database and Redis) in separate Docker containers. Using a Docker Compose file to manage the multi-container setup to maintain development and deployment consistency. |
|  | Deployment on DigitalOcean using Docker Swarm for orchestration | Provides container orchestration, replication, and load balancing for scalable performance under high traffic. |
| **Observability and System Reliability** | Monitoring alerts for high event volume or system health | Tracks CPU, memory, API latency, and database load. Also monitoring alerts for unusual system behavior. |


# Tentative Plan

## Goals and Deliverables

| Phase | Timeline | Goals | Key Deliverables |
| ----- | ----- | ----- | ----- |
| **Phase 1: Project Setup & Architecture Design** | 10.20-10.26 | \- Define system architecture and data model \- Set up Dockerized development environment \- Configure PostgreSQL and Redis containers | \- Architecture diagram \- Database schema design \- Working Docker Compose setup (API \+ DB \+ Redis) |
| **Phase 2: Backend API & Authentication** | 10.27-11.2 | \- Implement RESTful API endpoints for events, users, and authentication \- Enable JWT-based user authentication and role management | \- Auth & user management APIs \- CRUD endpoints for event data \- Secure HTTPS-ready backend |
| **Phase 3: Event Aggregation & Interaction Features** | 11.3-11.16 | \- Implement event aggregation, search, and filtering \- Enable collaborative features (commenting, RSVP, notifications) | \- Functional search and filter endpoints \- Commenting and RSVP modules \- DigitalOcean Function or SendGrid integration for notifications |
| **Phase 4: Cloud Deployment & Monitoring** | 11.3-11.16 | \- Deploy services to DigitalOcean with Docker Swarm \- Configure monitoring dashboards for API latency, CPU, and DB load | \- Live DigitalOcean deployment \- Monitoring dashboards and alerting configured |
| **Phase 5: Testing, Optimization**  | 11.17-11.21 | \- Perform integration and load testing | \- Tested and stable system |
| **Phase 6: Final Report** | 11.21-12.9 | \- Prepare final project report and presentation | \- Final report \+ presentation slides |

## Division of Work and Roles

| Category | Role | Responsibilities / Tasks |
| ----- | ----- | ----- |
| **Backend Development** | Spiro Li | \- Design API endpoints for events and users \- Implement authentication (JWT) and role \-based access  \- Handle REST routing and request validation |
| **Database & Data Management** | Weijie Zhu | \- Design PostgreSQL schema \- Manage migrations and indexing \- Integrate persistent DigitalOcean Volumes for data durability |
| **Cloud & DevOps** | Jerry Chen | \- Set up Docker Compose for local dev \- Deploy with Docker Swarm on DigitalOcean \- Configure CI/CD with GitHub Actions \- Manage monitoring and logging tools |
| **Frontend & Integration / Testing** | Muchen Liu | \- Integrate API endpoints with frontend (if applicable) \- Implement search/filter UI logic \- Conduct testing and documentation \- Prepare final report & presentation materials |

## Development Tools and Libraries

| Component | Tool / Library | Purpose |
| ----- | ----- | ----- |
| **Backend Framework** | Node.js (Express.js) | REST API development |
| **Database** | PostgreSQL \+ DigitalOcean Volumes | Persistent event and user data storage |
| **Cache / Queue** | Redis | Caching and notification management |
| **Containerization** | Docker, Docker Compose | Isolated environment setup for services |
| **Deployment** | Docker Swarm (DigitalOcean) | Orchestration, scaling, and load balancing |
| **CI/CD** | GitHub Actions | Automated builds, testing, and deployment |
| **Monitoring** | Prometheus \+ Grafana (or DigitalOcean Monitoring) | Observability and performance metrics |
| **External APIs** | SendGrid / DigitalOcean Functions | Email and event notifications |
| **Security** | HTTPS, JWT, dotenv(optional) | Data protection and secure access |
| **Version Control** | Git / GitHub | Code collaboration and version tracking |

---

## Evaluation Metrics

| Aspect | Metric | Expected Goal  |
| ----- | ----- | ----- |
| **Functionality** | % of key features implemented | ≥ 90% of planned functionality operational |
| **Reliability** | API uptime and DB persistence under restart | ≥ 99% uptime with persistent data |
| **Performance** | Average API response time | ≤ 200ms under normal load |
| **Scalability** | Concurrent user handling via Swarm | System stable with 100+ simultaneous requests |
| **Security** | Authentication and role-based access | All endpoints secured via JWT and HTTPS |
| **Maintainability** | Code modularity and documentation | All modules well-documented and tested |
| **User Experience** | Search accuracy and ease of navigation | High user satisfaction (subjective eval) |

## Expected Outcomes

* A fully functional, **cloud-deployed centralized event aggregation system** for UofT.

* **Secure user authentication** and **role-based event management**.

* Reliable **PostgreSQL-based storage** with volume persistence.

* **Scalable and monitored** application running on Docker Swarm.

* Integrated **notification and collaboration** features (comments, RSVP, etc.).


## Individual Contributions

**Spiro Li**

Spiro implemented the JWT-based authentication system with login, registration, and role-based access control, and developed the SendGrid notification service that automatically sends email confirmations for user registrations, event creation/updates, and RSVP confirmations. He also designed and implemented the RESTful API architecture with Express.js, including all event, comment, and RSVP endpoints with proper validation, and integrated WebSocket real-time functionality using Socket.io to broadcast live updates for events, comments, and RSVPs to connected clients.
