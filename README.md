# TaskFlow //  Task Space

TaskFlow is a premium, glassmorphic dark-themed Kanban task management workspace built with React (Vite) on the frontend, Node.js + Express on the backend, and MongoDB as the database. It is fully containerized using Docker and Docker Compose.

## Architecture Overview

```
                        +----------------------------------+
                        |           User Browser           |
                        +----------------------------------+
                                         |
                                         | Port 5173
                                         v
                        +----------------------------------+
                        |  Client Container (Vite Server)  |
                        +----------------------------------+
                                         |
                                         | Proxies /api/* (via Docker DNS)
                                         v
                        +----------------------------------+
                        |     Express Server Container     |
                        +----------------------------------+
                                         |
                                         | Port 27017
                                         v
                        +----------------------------------+
                        |        MongoDB Container         |
                        +----------------------------------+
```

## Getting Started / Running the App

You can run TaskFlow in two ways: **Option A (Docker)** or **Option B (Manual Local Setup)**.

### Option A: Running via Docker (Easiest & Recommended)
This runs the frontend client, backend server, and MongoDB database automatically in Docker.

1. Ensure Docker Desktop is running on your machine.
2. In your terminal, navigate to the root project directory and run:
   ```bash
   docker-compose up -d --build
   ```
3. Once the build completes and containers start, open your browser and navigate to:
   - **Frontend Workspace**: [http://localhost:5173](http://localhost:5173)
   - **Backend API Server**: [http://localhost:5000/api/tasks](http://localhost:5000/api/tasks)
4. To stop the application:
   ```bash
   docker-compose down
   ```
   *(To wipe all database tasks and start completely fresh, use `docker-compose down -v`)*

---

### Option B: Running Manually on your Local Host Machine
If you want to run the code directly on your local system:

#### Step 1: Start only the MongoDB Database Container
The backend server needs MongoDB to be active. Run the Docker DB container on port `27017` by running:
```bash
docker start taskflow_db
```
*(If the container is not created yet, run `docker-compose up -d mongo` from the root directory).*

#### Step 2: Start the Backend Server
1. Open a terminal and navigate to the `/server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
   *(Keep this terminal open and running).*

#### Step 3: Start the Frontend Client
1. Open a **new, separate terminal window** and navigate to the `/client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the link displayed in your terminal (typically [http://localhost:5173](http://localhost:5173)).


## Cloud Deployment Guide

Here are standard options for deploying this containerized project to the cloud.

### 1. DigitalOcean (Recommended: Droplet or App Platform)

#### Option A: Deploy to a Droplet (Virtual Machine)
1. Provision a DigitalOcean **Docker 1-Click Droplet** from the Marketplace.
2. SSH into your droplet:
   ```bash
   ssh root@your_droplet_ip
   ```
3. Clone your repository onto the droplet.
4. Run the docker-compose command:
   ```bash
   docker-compose up -d --build
   ```
5. Your app will be live at `http://your_droplet_ip:5173`. You can point a custom domain and add SSL using Nginx or Caddy on the host.

#### Option B: DigitalOcean App Platform
1. Since the app is multi-container, you can define a `spec.yaml` representing a multi-component App Platform configuration containing the server container, client container, and a managed MongoDB database.
2. Push your code to GitHub and connect the repository to the App Platform dashboard.

---

### 2. AWS (Amazon Web Services)

#### Option A: AWS Elastic Beanstalk (Multi-Container Docker)
1. Prepare a `dockerrun.aws.json` version 3 file describing your container configurations.
2. Zip your source directory (excluding local dependencies and build outputs).
3. Create a new Elastic Beanstalk environment, select the **Docker** platform branch (with ECS / Multi-Container support), and upload the ZIP.
4. Spin up an **Amazon DocumentDB** or **MongoDB Atlas** database, and set the database connection URI as an environment variable in the Elastic Beanstalk Configuration panel.

#### Option B: AWS ECS (Elastic Container Service) with Fargate
1. Push your client and server Docker images to **AWS ECR (Elastic Container Registry)**.
2. Create an **ECS Cluster** (using AWS Fargate for serverless scaling).
3. Define two **ECS Task Definitions** (one for client, one for server).
4. Run the tasks inside a VPC, configuring a **Network Load Balancer (NLB)** or **Application Load Balancer (ALB)** to route port 80 traffic to the client and port 5000/api traffic to the backend server.

---

### 3. Heroku (Container Registry)

Heroku supports building and releasing Docker containers directly.

1. **Install Heroku CLI** and log in:
   ```bash
   heroku login
   heroku container:login
   ```
2. **Create a Heroku App**:
   ```bash
   heroku create taskflow-workspace
   ```
3. **Provision a MongoDB Database**:
   Add a MongoDB add-on (e.g., ObjectRocket or MongoAtlas) or configure a connection string from MongoDB Atlas:
   ```bash
   heroku config:set MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/tasks"
   ```
4. **Deploy Containers**:
   Push both components using their Dockerfiles:
   ```bash
   # Push server
   heroku container:push web --app taskflow-workspace --context ./server
   # Push client
   heroku container:push web --app taskflow-workspace-client --context ./client
   ```
5. **Release and open**:
   ```bash
   heroku container:release web --app taskflow-workspace
   heroku open --app taskflow-workspace
   ```
