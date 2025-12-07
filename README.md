# 0.0 Team information
| Name | Student Number | Email address |
| ----- | ----- | ----- |
|Jerry Chen | 1006944899 | jianuojerry.chen@mail.utoronto.ca|
|Muchen Liu|1006732145 | muchen.liu@mail.utoronto.ca |
|Spiro Li | 1012635427| supeng.li@mail.utoronto.ca|
|Weijie Zhu|1009310906 | weijie.zhu@mail.utoronto.ca |

# 1.0 Motivation

At the University of Toronto, news about campus activities and student life, including workshops, career fairs, and networking events, is disseminated across various platforms. This disintegrated communication framework, with **scattered event and activity details**, confuses students because they struggle to stay informed about events that align with their interests. Although there are some current solutions for event integration, such as Quercus announcements and social media by event organizations, they have **significant shortcomings**. Quercus pages are limited to university-based activities, while social media pages are spread across multiple accounts that are still difficult to follow up with. Due to the inconvenience, most students miss opportunities to be part of the wider campus life, as they often overlook extracurricular activities that can enhance their university experience. Meanwhile, some organizations struggle to attract students and expand their business.

To address the communication gap between students and event organizations, the team plans to develop a tool that integrates fragmented event and activity information at UofT, providing students and event organizers with a better experience for attending and hosting events. Therefore, University Connection (UniConn) is proposed as a **centralized,** **cloud-based platform** that consolidates all UofT-related events into a single, accessible, and user-friendly interface. The proposed solution, UniConn, aims to minimize the loss of communication caused by the current scattered event information.

The **target users** for UniConn can be separated and authenticated by two groups: **Students** who are actively seeking organized access to campus events, and **event organizers** who require a streamlined and interactive platform to reach their audiences more effectively. The system will enable users with different roles to engage in effective and comprehensive interactions. For **event organizers**, such as departments and organizations, UniConn will enable them to publish event details and tally the registration statistics for the events in a dashboard format. For **Students**, UniConn will allow them to browse, filter, and interact with events that align with their academic and social interests, fostering a more connected and collaborative campus environment.

By centralizing event and activity information, UniConn significantly improves communication efficiency, accessibility, and community engagement within the university ecosystem. Beyond its practical impact, the project also showcases the application of modern cloud-native architecture. The system includes a **Node.js** backend built with **Express.js**, a lightweight **HTML-based** frontend, and **persistent storage** using **PostgreSQL**. Development and testing are supported locally through **Docker Compose**, while cloud deployment leverages **Docker Swarm** orchestration to ensure reliability, performance, and extensibility.


# 2.0 Objective


## 2.1 Unify Campus Event Information

UniConn’s primary objective is to **centralize all campus event information**. Instead of checking multiple platforms, students can access workshops, career fairs, networking events, and other activities in one place. This reduces confusion, improves visibility, and ensures opportunities are not missed due to fragmented information.

## 2.2 Empower Both Students and Organizers

The platform is designed to **serve both students and organizers with tailored experiences**. Students can easily discover events, manage attendance, and participate in discussions. Organizers—such as clubs, departments, and campus groups—can publish events, reach their audience, and monitor engagement. This dual-role design supports the full event lifecycle from creation to participation.

## 2.3 Promote Real-Time Community Interaction

UniConn aims to foster **live engagement and community interaction** around campus activities. Real-time chat, interest indicators, and instant updates make the platform feel active and social, helping students connect with peers who share similar interests and stay engaged with ongoing events.

## 2.4 Deliver a Reliable and Scalable Service

A key objective is to ensure the system remains **stable, responsive, and fault-tolerant** during high-traffic periods. The implementation supports concurrent users, preserves critical data (accounts, events, RSVPs, comments), and minimizes disruption during updates or migrations.

## 2.5 Enable Transparent System Monitoring

The platform provides **clear visibility into performance and system health**. By exposing metrics, tracking resource usage, and offering health checks, UniConn enables administrators to detect issues early and maintain a high-quality, continuously improving service.


# 3.0 Technical Stack (Modify this as reference)

UniConn is built using modern, cloud-native technologies designed for scalability, reliability, and maintainability.

| Category | Technology | Purpose |
| -------- | ---------- | ------- |
| **Backend Framework** | Node.js + Express.js | Provides a lightweight and efficient RESTful API framework for handling event management, user authentication, and real-time interactions |
| **Real-Time Communication** | Socket.io | Enables real-time bidirectional communication for live event updates and collaborative features such as instant notifications and WebSocket-based interactions |
| **Database** | PostgreSQL 16 | Stores all event data, user profiles, RSVPs, comments, and authentication records with ACID compliance and relational integrity |
| **Data Persistence** | DigitalOcean Volumes | Ensures persistent data storage across container restarts and deployments |
| **Authentication** | JWT (JSON Web Tokens) + bcrypt | Implements secure authentication and role-based access control. JWT tokens manage user sessions, while bcrypt ensures password security through hashing |
| **Email Notifications** | SendGrid API | Handles automated email notifications for RSVP confirmations, event reminders, and event updates to keep users informed |
| **Metrics Collection** | Prometheus | Collects comprehensive system metrics from the application, Traefik, and system exporters |
| **Metrics Visualization** | Grafana | Provides custom dashboards tracking CPU usage, memory consumption, API latency, request rates, and database performance |
| **Reverse Proxy & Load Balancer** | Traefik | Acts as a reverse proxy and load balancer with built-in service discovery, automatic HTTPS, and Prometheus metrics integration for traffic monitoring and routing |
| **Cloud Monitoring** | DigitalOcean Monitoring | Complements the self-hosted monitoring stack with cloud provider metrics and alerting for infrastructure health |
| **Containerization** | Docker + Docker Compose | Containerizes all services (API, PostgreSQL) for consistent local development and testing environments |
| **Orchestration** | Docker Swarm (on DigitalOcean) | Orchestrates production deployment with automatic service replication, load balancing, and rolling updates. Chosen over Kubernetes for its simplicity and built-in integration with Docker, making it ideal for medium-scale deployments while maintaining cloud-native scalability |
| **CI/CD** | GitHub Actions | Automates build, test, and deployment pipelines to ensure code quality and streamline releases |
| **Security** | Helmet.js | Enhances API security by setting HTTP headers that protect against common web vulnerabilities |
| **Metrics Library** | prom-client | Exposes application-level metrics (request duration, error rates) to Prometheus for observability |
| **Configuration Management** | dotenv | Manages environment variables and secrets securely across development and production environments |

# 4.0 Features

The application provides a complete set of user-facing and platform-level capabilities that meet course requirements and achieve the project goal of **unifying campus events**, **empowering students and organizers**, **supporting real-time interaction**, and delivering a **reliable, observable, and secure service**.

## 4.1 User Features

### 4.1.1 Student Experience

Students explore campus events through a **unified, continuously updated interface**. Real-time updates let students instantly see newly **created, edited, or deleted** events. Discovery is supported through keyword search, category/faculty filters, and date-range filtering. A **one-click registration** system manages attendance, while a personal profile modal provides account details. When SendGrid is enabled, students receive welcome and RSVP confirmation emails.

**Student capabilities:**
- Real-time event browsing and updates  
- Keyword search and advanced filtering  
- Registration and live updates  
- Public comments with self-deletion  
- Welcome and RSVP emails  

These features give students a single, real-time view of campus activities and easy ways to participate, supporting Objectives **2.1**, **2.2**, and **2.3**.

### 4.1.2 Organizer Experience

Organizers can **create** events with full metadata and instantly broadcast them. They can **edit or delete** only their own events, ensuring proper access control. An analytics dashboard provides **event counts, registration patterns, attendance trends, and top-performing events**. Organizers can view attendees, moderate comments, and receive event creation/update emails when SendGrid is active.

**Organizer capabilities:**
- Event creation with full metadata  
- Editing and deletion with ownership enforcement  
- Live update broadcasting  
- Analytics dashboard for engagement insights  
- Full attendee visibility  
- Comment moderation  
- Event creation/update emails  

These tools support Objectives **2.1**, **2.2**, **2.3**, and **2.4**, making event management efficient and interactive.

### 4.1.3 Shared API and Interaction Features

All authenticated users share a common API surface using JWT-based authentication. They can browse events, view details, load comments and RSVPs, and receive real-time updates through a shared Socket.IO connection. Users join event rooms, receive broadcasts for event/comment/RSVP changes, and participate in live chat.

These shared interactions ensure a consistent, responsive experience aligned with the objectives of unified access, real-time communication, and transparent engagement.

## 4.2 DevOps Features

UniConn includes operational tools to ensure reliability and observability. A `/api/health` endpoint validates API and database responsiveness, while `/api/metrics` exposes Prometheus-formatted metrics visualized in **Grafana**. **Traefik** provides routing dashboards and logs, and DigitalOcean offers CPU, memory, disk, and network graphs for infrastructure monitoring. Sensitive credentials are managed as secrets, enabling secure rotation without code changes.

Together, these DevOps features support Objectives **2.4 Deliver a Reliable and Scalable Service** and **2.5 Enable Transparent System Monitoring**, ensuring stable performance during development, deployment, and peak usage periods.


# 5.0 User Guide

## 5.1 Getting Started

1. Open UniConn in a modern web browser (Chrome, Edge, or Firefox) using the URL `http://143.198.39.167/`. (You may need to disable auto `HTTPS` redirecting on your browser first.)  
2. The first screen shown is the **Login page**, with options to enter an email and password or to create a new account.  
3. If this is the first visit, click **“Create an Account”** to register; otherwise, log in with an existing account.  

|**Login Page** |**Register Page**|
|--|--|
![login](UserGuideSources/login.png)|![register](UserGuideSources/register.png)|

### 5.1.1 Creating an Account

1. On the **Registration** page, fill in:
   - **Full Name** – the name to be shown on comments, RSVPs, and analytics.  
   - **Email** – used as the login account and for email notifications.  
   - **Password** – a secure password for the account.  
   - **Role** – choose **Student** or **Organizer** depending on how the platform will be used.  
2. Click **“Register”**.  
3. If registration succeeds, UniConn automatically logs in the new user and redirects to the appropriate dashboard. When email is configured, a welcome email is also sent.  
4. If there is a problem (for example, an already registered email), an error message will be shown for specific guidance.  

|**Duplicate Email Detection**            | **Email Comfirmation**|
|--|--|
| ![register](UserGuideSources/errorregister.png)||

### 5.1.2 Logging In

1. On the **Login** page, enter the registered email and password.  
2. Click **“Login”**. On success, UniConn opens either the **Student Dashboard** or **Organizer Dashboard** based on the user’s role.  


|**Student Dashboard** |**Organizer Dashboard**|
|--|--|
|![student](UserGuideSources/student.png) | ![organizer](UserGuideSources/organizer.png)|


## 5.2 General Guidance

### 5.2.1 Browsing and Filtering Events

1. After logging in, select the **Browse Events** tab.  
2. New events appear automatically as organizers create them, without requiring a page refresh.  
3. Use the **search box** to filter by keywords in the event title or description.  
4. Use the **faculty** and **category** dropdowns to narrow the list to events that match specific academic areas or themes.  
5. Use the **start** and **end date** filters to focus on events happening within a chosen time window.  

[Screenshot: Student dashboard – Browse Events with filters]

### 5.2.2 Commenting and Real-Time Discussion

1. Select an event to open its **details and discussion** area.  
2. In the **Comments** section, type a message then submit it.  
3. Newly added comments appear instantly for all connected users viewing that event, comments will be stored in DB and load automatically after each log-in action.  
4. Student can **only delete their own comments**. Organizers can **delete any comments they made or appeared in the evnets they created**. 

[Screenshot: Event details view with comment list and input box]


### 5.2.3 Live Event Chat and Presence

1. For selected events, a **live chat panel** shows messages exchanged in real time.  
2. When the student opens an event, UniConn automatically connects them to the corresponding chat room.  
3. As other users send messages or start typing, the chat panel updates immediately with new content and typing indicators.  
4. A participant counter shows how many users are currently viewing or chatting about the event.  

[Screenshot: Live chat panel with messages, typing indicator, and participant count]

### 5.2.4 Viewing, Editing Personal Information and Logging Out

1. At the top of the Student Dashboard, click the **Personal Information / My Profile** bar.  
2. A modal opens showing the student’s **name**, **email**, and **role**, along with a **edit** and **Logout** button.  
3. Click on **edit** for editing personal information of the current account or log out when finished using the system.  

[Screenshot: Student profile modal showing personal information]


## Student
### 5.3.1 Registering for Events

1. In the **Browse Events** tab, locate an event of interest.  
2. Use the event’s **registration control** (for example, a single button or status selector) to choose an attendance status such as *Going*, *Interested*, or *Cancelled*.  
3. The updated status is saved to the system and displayed immediately in the UI. Aggregate counts for each event are updated as more students respond.  
4. When email notifications are enabled, a confirmation email is sent after a successful registration or change in status.  

[Screenshot: Event card with registration control and status]

.


### 5.2.5 Viewing Personal Information and Logging Out

1. At the top of the Student Dashboard, click the **Personal Information / My Profile** bar.  
2. A modal opens showing the student’s **name**, **email**, and **role**, along with a **Logout** button.  
3. Review these details to confirm the current account or log out when finished using the system.  

[Screenshot: Student profile modal showing personal information]


## 5.3 Organizer Workflow

### 5.3.1 Creating a New Event

1. Log in as an **Organizer** to open the Organizer Dashboard.  
2. Navigate to the **My Events** or **Manage Events** tab (depending on the UI label).  
3. Click the **“Create Event”** button or equivalent control.  
4. Fill in the event form, including:
   - Title and detailed description  
   - Location (room, building, or online link)  
   - Faculty and category  
   - Start date and time, end date and time  
5. Submit the form to publish the event. The event is added to the central event list and becomes immediately visible to students.  

[Screenshot: Organizer create-event form]

This workflow directly contributes to Objectives **2.1** and **2.2**, allowing organizers to enrich the shared event pool and reach students through a single, unified platform.

### 5.3.2 Editing and Deleting Events

1. In the Organizer Dashboard, open the **My Events** list.  
2. Select an event owned by the current organizer.  
3. Choose **Edit** to adjust details such as time, description, or location, then save the changes. All connected clients receive updated information in real time.  
4. Choose **Delete** to remove the event entirely if it is cancelled. Once deleted, the event disappears from the student view and from analytics.  

[Screenshot: Organizer event list with edit and delete actions]

Ownership rules ensure that organizers can modify only their own events, which supports Objective **2.2 Empower Both Students and Organizers** and keeps event data reliable (Objective **2.4**).

### 5.3.3 Viewing Registrations and Analytics

1. From the Organizer Dashboard, open the **Analytics** or **Overview** section.  
2. Review key metrics such as:
   - Number of events created by the organizer  
   - Registration counts and distributions across events  
   - Attendance trends and top-performing events  
3. Use this information to refine event timing, topics, or promotion strategies.  

[Screenshot: Organizer analytics dashboard]

These analytics give organizers feedback on how students are engaging, which supports Objective **2.2** by helping organizers make more informed decisions about their events.

### 5.3.4 Moderating Comments

1. Open an owned event from the Organizer Dashboard and scroll to the **Comments** section.  
2. Review the list of comments posted by students.  
3. If a comment is inappropriate or off-topic, use the **delete** action to remove it.  

[Screenshot: Organizer view with comment moderation controls]

Comment moderation helps maintain a productive discussion environment while still encouraging open communication around events (Objective **2.3**).


## 5.4 Shared Real-Time and Cross-Role Features

Regardless of role, all authenticated users share several core interaction patterns:

- **Unified API and event view** – every user sees the same underlying event data, filtered and presented according to their role, satisfying Objective **2.1**.  
- **Real-time updates** – changes to events, registrations, and comments propagate instantly through WebSocket connections, reinforcing Objective **2.3**.  
- **Consistent navigation and layout** – both dashboards use similar structures (tabs, cards, modals), reducing learning effort and supporting Objective **2.2** by making the platform approachable for all users.

# 6.0 Development Guide

This section explains how to set up locally for testing and how to deploy to the DigitalOcean Swarm cluster. Quick path: from the project root run `./localcompose.sh` for local testing and `bash devops/scripts/swarmdeploy/redeploy.sh` for cloud deployment. If either script is not executable on Unix/macOS, run `chmod +x <script>` once.

## 6.1 Local Deployment (Testing)

Option 1: One-step local bring-up  
1. Run `./localcompose.sh`.  
2. Script actions (summary):  
   - Validates Docker is available.  
   - Brings up API and PostgreSQL via Docker Compose.  
   - Exposes the app at `http://localhost:8080`.  
   - Loads the schema automatically on first boot via the initdb hook.  
   - Provides a simple down command (`docker compose down`) to stop.

Option 2: Deploy step by step (mirrors the script)  
1. Ensure Docker Desktop/Engine is running.  
2. Prepare `.env` with local values (API port 8080, DB name/user/password, JWT secret).  
3. Start services: `docker compose -f docker-compose.local.yaml up -d` (schema auto-loads the first time via `/docker-entrypoint-initdb.d/schema.sql`).  
4. If you ever need to re-apply the schema manually:  
   `docker compose -f docker-compose.local.yaml exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/schema.sql`  
5. Verify: `docker compose -f docker-compose.local.yaml ps` and `docker compose -f docker-compose.local.yaml logs -f api db`.  
6. Open `http://localhost:8080` to use the app; test APIs via `http://localhost:8080/api/...`.  
7. Stop: `docker compose -f docker-compose.local.yaml down` (add `-v` to reset the DB volume).

## 6.2 Cloud Deployment (DigitalOcean Swarm)

Option 1: One-step cloud redeploy  
1. SSH to the Swarm manager (with the attached DO volume).  
2. Run `bash devops/scripts/swarmdeploy/redeploy.sh`.  
3. Script actions (summary):  
   - Checks/creates Docker secrets via `create-secrets.sh` if missing.  
   - Fixes volume permissions for PostgreSQL.  
   - Builds/pushes images (when configured), then deploys Traefik, UniConn, and monitoring stacks.  
   - Forces service updates so replicas refresh to the latest image.  
   - Prints service endpoints (app and monitoring).

Option 2: Deploy step by step (mirrors the script)  
1. Ensure secrets exist: run `devops/scripts/swarmdeploy/create-secrets.sh` if needed (see 6.3).  
2. Confirm the DO volume is mounted (e.g., `/mnt/volume_uniconn_01`) and owned by UID 999 for Postgres data.  
3. Deploy Traefik stack: `docker stack deploy -c devops/docker/swarm/traefik.yaml traefik`.  
4. Deploy app stack: `docker stack deploy -c devops/docker/swarm/uniconn.yaml uniconn`.  
5. Deploy monitoring stack: `docker stack deploy -c devops/docker/swarm/monitoring/monitoring-stack.yaml monitoring`.  
6. Verify services: `docker service ls`, `docker service ps uniconn_api`, `docker service logs uniconn_api -f`.  
7. Test endpoints: `http://<manager-ip>/` for the app, `http://<manager-ip>:8080` for Traefik dashboard (if enabled), `http://<manager-ip>:3000` for Grafana.

## 6.3 Environment Variables, Secrets, and First-Time Initialization

- Local `.env` (fill in your own values, no defaults baked in):  
  - `POSTGRES_DB=`  
  - `POSTGRES_USER=`  
  - `POSTGRES_PASSWORD=`  
  - `JWT_SECRET=`  
  - `SENDGRID_API_KEY=` (optional)  
  - `SENDGRID_FROM_EMAIL=` (optional)  
  - `NODE_ENV=development`  
  These feed both Compose and helper scripts such as `localcompose.sh`.
- Swarm secrets (create once before first deploy): run `devops/scripts/swarmdeploy/create-secrets.sh` on the Swarm manager. It will prompt for `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET`, and optional `SENDGRID_API_KEY`, then create the corresponding Docker secrets (`uniconn_postgres_db`, `uniconn_postgres_user`, `uniconn_postgres_password`, `uniconn_jwt_secret`, `uniconn_sendgrid_api_key`, `uniconn_sendgrid_from_email`).
- First-time database initialization in Swarm: once the `uniconn` stack is up and the `db` service is healthy, apply the schema one time:  
  `docker exec -i $(docker ps -q -f name=uniconn_db) psql -U "$(docker secret inspect --format='{{.Spec.Data}}' uniconn_postgres_user | base64 -d)" -d "$(docker secret inspect --format='{{.Spec.Data}}' uniconn_postgres_db | base64 -d)" < uniconn-backend/db/schema.sql`  
  (Adjust the container name filter if your stack uses a different prefix.) After the schema is loaded, normal deploys reuse the persisted volume without reapplying the file.


# 7.0 Deployment Information

- **UniConn (live)**: `http://143.198.39.167/`  
- **Grafana dashboard**: `http://143.198.39.167:3000/`

[Screenshot: Deployed UniConn home]
[Screenshot: Grafana dashboard overview]

# 8.0 Lessons Learned and Concluding Remarks

Building UniConn provided valuable insights into developing and deploying cloud-native applications. One of the most critical lessons was the importance of **clear service boundary definition**. Separating concerns between authentication, event management, comments, RSVPs, and notifications into distinct API routes made the backend modular and maintainable, but required careful planning of inter-service communication patterns and shared database access.

**Debugging distributed systems** proved more challenging than anticipated. With three replicated API instances behind Traefik's load balancer, tracing issues required implementing comprehensive logging and understanding sticky sessions. WebSocket connections in a load-balanced environment demanded particular attention—we learned that sticky sessions are essential for maintaining real-time connections, and that proper room-based broadcasting helps coordinate state across replicas.

**Persistent storage and state management** was another significant learning area. Configuring PostgreSQL with DigitalOcean Volumes required careful attention to file permissions (postgres user 999:999), volume mounting on the correct node (manager constraint), and understanding that container restarts preserve data but require proper health checks to avoid race conditions during startup. Managing Docker Secrets for sensitive credentials reinforced the importance of secure configuration management in production environments.

**Database schema evolution** highlighted the need for forward-thinking design. Supporting both `registrations` and `rsvps` tables for backward compatibility, while maintaining referential integrity through foreign key constraints and cascading deletes, taught us to balance flexibility with data consistency. Implementing proper indexes for filtering (by faculty, category, date) significantly improved query performance as the dataset grew.

**API design challenges** included implementing role-based access control that enforces ownership rules (organizers can only modify their own events) while allowing admin overrides. Integrating SendGrid for automated email notifications required handling async operations gracefully with fire-and-forget patterns to avoid blocking API responses.

**Collaborative development** using Git, along with Docker Compose for consistent local environments, minimized "works on my machine" issues. The deployment automation scripts (redeploy.sh, create-secrets.sh) evolved from manual commands into robust, repeatable workflows with pre-flight checks and rollback capabilities.

Finally, implementing **observability with Prometheus and Grafana** demonstrated that monitoring is not optional—it's essential for understanding system behavior under load, identifying bottlenecks, and maintaining reliability. Exposing custom metrics (request duration, error rates) alongside infrastructure metrics provided actionable insights for optimization.

Overall, UniConn successfully demonstrated how modern cloud-native technologies can solve real-world problems. The project reinforced that building scalable, reliable systems requires not just writing code, but thoughtfully designing architectures, carefully managing state, and implementing comprehensive testing and monitoring. The hands-on experience with Docker Swarm, PostgreSQL, WebSockets, and DevOps practices provided practical skills directly applicable to industry cloud deployments, while delivering a functional platform that addresses genuine communication gaps in university campus life.


