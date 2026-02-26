# 👋 Welcome to Product Order System!

## 🎯 What is this?

This is a complete microservices-based e-commerce system with:
- **User Service** - Manage users and authentication
- **Product Service** - Manage product catalog
- **Order Service** - Process orders

Built with Node.js, MongoDB, Docker, and Kubernetes.

---

## 🚀 Get Started in 3 Steps

### Step 1: Check Prerequisites ✅

Double-click: **`check-prerequisites.bat`**

This will verify you have everything installed. If not, it will tell you what's missing.

### Step 2: Install Dependencies 📦

Open Command Prompt in this folder and run:
```cmd
npm run install:all
```

This installs all required packages for all services.

### Step 3: Start Everything 🎬

Double-click: **`start-local.ps1`** or **`start-local.bat`**

Or run:
```cmd
npm run start:local
```

This will:
- Start 3 MongoDB databases
- Start 3 microservices
- Open a test dashboard in your browser

---

## 🎮 Test the System

Once everything is running, a web page will open automatically.

Or manually open: **`test-api.html`**

Click **"Run Full Demo"** to see the system in action!

---

## 🛑 Stop Everything

Double-click: **`stop-local.ps1`** or **`stop-local.bat`**

Or run:
```cmd
npm run stop:local
```

---

## 📚 Need More Help?

- **Quick Setup:** Read [QUICKSTART.md](./QUICKSTART.md)
- **Detailed Guide:** Read [SETUP-GUIDE.md](./SETUP-GUIDE.md)
- **Full Documentation:** Read [README.md](./README.md)

---

## 🐳 Alternative: Use Docker

If you have Docker installed:

```cmd
npm run docker:up
```

Then open `test-api.html` in your browser.

To stop:
```cmd
npm run docker:down
```

---

## ❓ Common Issues

### "MongoDB is not installed"
- Download from: https://www.mongodb.com/try/download/community
- Install it and restart your terminal

### "Port already in use"
- Run: `npm run stop:local`
- Then try starting again

### "Cannot find module"
- Run: `npm run install:all`
- Then try starting again

---

## 🎯 What's Next?

1. ✅ Test the APIs using the web dashboard
2. ✅ Read the API documentation in each service folder
3. ✅ Explore the code and make changes
4. ✅ Deploy to Kubernetes using the k8s/ folder

---

## 📊 Service URLs

Once running, access services at:
- **User Service:** http://localhost:3001
- **Product Service:** http://localhost:3002
- **Order Service:** http://localhost:3003

Health checks:
- http://localhost:3001/health
- http://localhost:3002/health
- http://localhost:3003/health

---

**Ready? Let's go! 🚀**

1. Run `check-prerequisites.bat`
2. Run `npm run install:all`
3. Run `start-local.ps1`
4. Open `test-api.html`

That's it! You're running a complete microservices system!
