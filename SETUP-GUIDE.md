# 📖 Complete Setup Guide - Product Order System

This guide will walk you through setting up and running the Product Order System on your local Windows machine.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running the System](#running-the-system)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

#### 1. Node.js (Required)
- **Version:** 18 or higher
- **Download:** https://nodejs.org/
- **Installation:**
  1. Download the Windows installer (.msi)
  2. Run the installer
  3. Follow the installation wizard (use default settings)
  4. Verify installation:
     ```cmd
     node --version
     npm --version
     ```

#### 2. MongoDB (Required for Local Development)
- **Version:** 6.0 or higher
- **Download:** https://www.mongodb.com/try/download/community
- **Installation:**
  1. Download the Windows installer (.msi)
  2. Run the installer
  3. Choose "Complete" installation
  4. Install MongoDB as a Windows Service (recommended)
  5. Verify installation:
     ```cmd
     mongod --version
     ```

#### 3. Docker Desktop (Optional - for Docker method)
- **Download:** https://www.docker.com/products/docker-desktop
- **Installation:**
  1. Download Docker Desktop for Windows
  2. Run the installer
  3. Enable WSL 2 if prompted
  4. Restart your computer
  5. Verify installation:
     ```cmd
     docker --version
     docker-compose --version
     ```

---

## Installation

### Step 1: Get the Code

If you have the code in a folder, navigate to it:
```cmd
cd path\to\product-order-system
```

### Step 2: Install Dependencies

**Option A: Use the automated script (Recommended)**
```cmd
npm run install:all
```

**Option B: Install manually**
```cmd
cd user-service
npm install
cd ..

cd product-service
npm install
cd ..

cd order-service
npm install
cd ..
```

This will install all required Node.js packages for each service.

---

## Running the System

You have **3 options** to run the system. Choose the one that works best for you:

### 🚀 Option 1: Automated Scripts (Easiest)

This is the **recommended method** for local development.

**Start everything:**
```cmd
npm run start:local
```
Or double-click `start-local.ps1`

This will:
- ✅ Create data directories
- ✅ Start 3 MongoDB instances
- ✅ Start all 3 microservices
- ✅ Open the test dashboard in your browser

**Stop everything:**
```cmd
npm run stop:local
```
Or double-click `stop-local.ps1`

### 🐳 Option 2: Docker Compose (Recommended if you have Docker)

**Prerequisites:** Docker Desktop must be running

**Start everything:**
```cmd
npm run docker:up
```

**View logs:**
```cmd
npm run docker:logs
```

**Stop everything:**
```cmd
npm run docker:down
```

### 🔧 Option 3: Manual Setup (For Advanced Users)

**Step 1: Start MongoDB Instances**

Open 3 separate Command Prompt windows:

**Window 1 - User Database:**
```cmd
mongod --port 27017 --dbpath data\userdb
```

**Window 2 - Product Database:**
```cmd
mongod --port 27018 --dbpath data\productdb
```

**Window 3 - Order Database:**
```cmd
mongod --port 27019 --dbpath data\orderdb
```

**Step 2: Start Services**

Open 3 more Command Prompt windows:

**Window 4 - User Service:**
```cmd
cd user-service
npm start
```

**Window 5 - Product Service:**
```cmd
cd product-service
npm start
```

**Window 6 - Order Service:**
```cmd
cd order-service
npm start
```

---

## Testing

### Method 1: Web Dashboard (Easiest) 🌐

1. Open `test-api.html` in your web browser
2. Click **"Check All Services"** to verify everything is running
3. Click **"Run Full Demo"** to test the complete workflow
4. Or test individual endpoints manually

### Method 2: Health Check URLs 🔍

Open these URLs in your browser:
- User Service: http://localhost:3001/health
- Product Service: http://localhost:3002/health
- Order Service: http://localhost:3003/health

All should show: `{"status":"healthy"}`

### Method 3: Command Line (curl) 💻

**Check Health:**
```cmd
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

**Create a User:**
```cmd
curl -X POST http://localhost:3001/users -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"Test User\"}"
```

**Create a Product:**
```cmd
curl -X POST http://localhost:3002/products -H "Content-Type: application/json" -d "{\"name\":\"Laptop\",\"price\":999.99,\"stock\":10}"
```

### Method 4: Run Automated Tests 🧪

```cmd
npm test
```

This runs the complete test suite (97 tests) for all services.

---

## Troubleshooting

### Problem: "MongoDB is not installed or not in PATH"

**Solution:**
1. Install MongoDB from https://www.mongodb.com/try/download/community
2. Add MongoDB to your PATH:
   - Default location: `C:\Program Files\MongoDB\Server\6.0\bin`
   - Add this to your System Environment Variables
3. Restart your terminal/command prompt

### Problem: "Port already in use" (EADDRINUSE)

**Solution:**
1. Stop all services:
   ```cmd
   npm run stop:local
   ```
2. Or manually kill processes:
   ```cmd
   taskkill /F /IM node.exe
   taskkill /F /IM mongod.exe
   ```
3. Try starting again

### Problem: Services can't connect to MongoDB

**Solution:**
1. Verify MongoDB is running:
   ```cmd
   tasklist | findstr mongod
   ```
2. Check if ports are available:
   ```cmd
   netstat -ano | findstr "27017"
   netstat -ano | findstr "27018"
   netstat -ano | findstr "27019"
   ```
3. Restart MongoDB instances

### Problem: "Cannot find module" errors

**Solution:**
1. Reinstall dependencies:
   ```cmd
   npm run install:all
   ```
2. Or manually for each service:
   ```cmd
   cd user-service && npm install
   cd product-service && npm install
   cd order-service && npm install
   ```

### Problem: PowerShell script won't run

**Solution:**
1. Run PowerShell as Administrator
2. Enable script execution:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Try running the script again

### Problem: Docker containers won't start

**Solution:**
1. Make sure Docker Desktop is running
2. Check Docker status:
   ```cmd
   docker ps
   ```
3. Restart Docker Desktop
4. Try again:
   ```cmd
   npm run docker:down
   npm run docker:up
   ```

### Problem: Test dashboard shows "Error: Failed to fetch"

**Solution:**
1. Verify services are running (check terminal windows)
2. Wait 10-15 seconds for services to fully start
3. Check health endpoints manually:
   - http://localhost:3001/health
   - http://localhost:3002/health
   - http://localhost:3003/health
4. Check browser console for CORS errors

---

## 📊 Service Information

### Ports
- **User Service:** 3001
- **Product Service:** 3002
- **Order Service:** 3003
- **MongoDB User DB:** 27017
- **MongoDB Product DB:** 27018
- **MongoDB Order DB:** 27019

### Data Storage
- MongoDB data is stored in: `data/userdb`, `data/productdb`, `data/orderdb`
- Data persists between restarts
- To reset data, delete these folders

### Logs
- Service logs appear in the terminal windows
- Docker logs: `npm run docker:logs`
- Look for errors in red text

---

## 🎯 Next Steps

Once everything is running:

1. ✅ **Test the APIs** using the web dashboard
2. ✅ **Read the API documentation:**
   - [User Service API](./user-service/API.md)
   - [Product Service API](./product-service/API.md)
   - [Order Service API](./order-service/API.md)
3. ✅ **Explore the code** in each service folder
4. ✅ **Try Kubernetes deployment** using the k8s/ manifests
5. ✅ **Add new features** and extend the system

---

## 📚 Additional Resources

- [Quick Start Guide](./QUICKSTART.md) - Fast setup instructions
- [Main README](./README.md) - Complete documentation
- [Architecture Design](./.kiro/specs/product-order-system/design.md)
- [Requirements](./.kiro/specs/product-order-system/requirements.md)

---

## 💡 Tips

- **Use the web dashboard** (`test-api.html`) for the easiest testing experience
- **Keep terminal windows open** to see real-time logs
- **Data persists** - your test data will remain between restarts
- **Stop cleanly** - always use `stop-local.ps1` to avoid orphaned processes
- **Check health first** - always verify services are healthy before testing

---

## 🆘 Still Having Issues?

1. Check the terminal windows for error messages
2. Verify all prerequisites are installed correctly
3. Try the Docker method if local setup is problematic
4. Review the troubleshooting section above
5. Check that no other applications are using the required ports

---

**Happy coding! 🚀**
