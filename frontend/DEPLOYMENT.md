# Frontend Docker Deployment Guide

Here are the step-by-step commands to build, push, and deploy your frontend to your VM using Docker. I have already created the `Dockerfile` and `nginx.conf` in your `frontend` directory.

> [!NOTE]
> Make sure you have an account on [Docker Hub](https://hub.docker.com/) before executing these steps. Replace `<your_dockerhub_username>` with your actual Docker Hub username.

### Step 1: Login to Docker Hub Locally
On your **local machine**, open a terminal and log in to Docker Hub:
```bash
docker login
```
*It will prompt you for your Docker Hub username and password.*

### Step 2: Build the Frontend Image
Navigate to your `frontend` directory (where the `Dockerfile` is located) and build the image. We'll tag it with your username and the repository name (e.g., `frontend`):
```cmd
cd d:\project\frontend
docker build -t <your_dockerhub_username>/frontend:latest .
```

### Step 3: Push the Image to Docker Hub
Push the freshly built image to your Docker Hub repository so your VM can access it:
```bash
docker push <your_dockerhub_username>/frontend:latest
```

---

### Step 4: Access Your VM
SSH or log into your Target Virtual Machine.
```bash
ssh user@your-vm-ip
```

### Step 5: Login to Docker on the VM
On your VM, log in to Docker so it has permission to pull your image:
```bash
docker login
```

### Step 6: Pull the Image on the VM
Pull the latest frontend image from Docker Hub:
```bash
docker pull <your_dockerhub_username>/frontend:latest
```

### Step 7: Run the Frontend Container
Run the Docker container on your VM. Because Nginx is listening on port 80 inside the container, we'll map the VM's port 80 (or any other port you prefer, e.g., 8080) to the container's port 80.

```bash
docker run -d --name project-frontend -p 80:80 <your_dockerhub_username>/frontend:latest
```

> [!TIP]
> If port 80 is already in use on your VM, you can map it to a different port like `8080:80` by modifying the `-p` flag. The app will then be accessible at `http://your-vm-ip:8080`.

**Verify it's running:**
```bash
docker ps
```
You should now be able to visit `http://<your-vm-ip>` in your browser and see your frontend working correctly, with proper client-side routing thanks to the `nginx.conf` we added!
