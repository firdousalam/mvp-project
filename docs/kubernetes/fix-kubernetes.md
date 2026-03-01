# Fix Kubernetes in Docker Desktop - Quick Guide

## Your Issue

The error `couldn't get current server API group list: EOF` means **Kubernetes is not running** in Docker Desktop.

## ✅ Quick Fix (2 minutes)

### Step 1: Open Docker Desktop
- Look for the Docker icon in your system tray (bottom-right corner)
- Click on it to open Docker Desktop

### Step 2: Enable Kubernetes
1. Click the **⚙️ Settings** icon (top-right corner)
2. Click **Kubernetes** in the left sidebar
3. **Check the box**: ☑️ Enable Kubernetes
4. Click **Apply & Restart**
5. **Wait 3-5 minutes** for Kubernetes to download and start

### Step 3: Verify It's Working

Open PowerShell and run:
```powershell
kubectl cluster-info
```

**Expected output:**
```
Kubernetes control plane is running at https://kubernetes.docker.internal:6443
CoreDNS is running at https://kubernetes.docker.internal:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
```

**If you still see errors**, wait another 2-3 minutes and try again.

### Step 4: Check Nodes

```powershell
kubectl get nodes
```

**Expected output:**
```
NAME             STATUS   ROLES           AGE   VERSION
docker-desktop   Ready    control-plane   5m    v1.28.2
```

## 🎯 Now You Can Deploy

Once Kubernetes is running:

```powershell
# Deploy the application
npm run k8s:deploy

# Check if pods are running
kubectl get pods

# Wait for all pods to be Ready (2-3 minutes)
kubectl get pods -w
```

## 🚨 If Kubernetes Won't Start

### Option 1: Reset Kubernetes
1. Docker Desktop → Settings → Kubernetes
2. Click **"Reset Kubernetes Cluster"**
3. Wait for reset to complete
4. Enable Kubernetes again

### Option 2: Increase Resources
1. Docker Desktop → Settings → Resources
2. Set:
   - **Memory**: 4 GB or more
   - **CPUs**: 2 or more
3. Click Apply & Restart

### Option 3: Restart Docker Desktop
1. Right-click Docker Desktop icon in system tray
2. Click **"Quit Docker Desktop"**
3. Wait 10 seconds
4. Start Docker Desktop again
5. Enable Kubernetes in Settings

## 📊 Visual Guide

```
Docker Desktop Window
┌─────────────────────────────────────┐
│  🐳 Docker Desktop        ⚙️ Settings│
├─────────────────────────────────────┤
│  General                            │
│  Resources                          │
│  Docker Engine                      │
│  ► Kubernetes  ← Click here         │
│  Software Updates                   │
│  Extensions                         │
└─────────────────────────────────────┘

Kubernetes Settings
┌─────────────────────────────────────┐
│  Kubernetes                         │
├─────────────────────────────────────┤
│  ☑️ Enable Kubernetes  ← Check this │
│                                     │
│  Show system containers (advanced) │
│                                     │
│  [Apply & Restart]  ← Click this   │
└─────────────────────────────────────┘
```

## ⏱️ First-Time Setup Timeline

- **Enabling Kubernetes**: 5-10 minutes (downloads images)
- **Subsequent starts**: 1-2 minutes

## 🔍 Troubleshooting Commands

```powershell
# Check Docker is running
docker ps

# Check Kubernetes context
kubectl config current-context
# Should show: docker-desktop

# Check Kubernetes version
kubectl version --short

# Check system pods
kubectl get pods -n kube-system
# Should show several pods in Running state
```

## ✅ Success Indicators

You'll know Kubernetes is working when:
1. Docker Desktop shows green Kubernetes icon (bottom-left)
2. `kubectl cluster-info` shows cluster running
3. `kubectl get nodes` shows docker-desktop as Ready
4. `kubectl get pods -n kube-system` shows all pods Running

## 🎉 Next Steps

Once Kubernetes is running:

1. Deploy the application:
   ```powershell
   npm run k8s:deploy
   ```

2. Wait for pods to be ready:
   ```powershell
   kubectl get pods -w
   ```

3. Test the application:
   ```powershell
   curl http://localhost/health/user
   ```

4. Open the test dashboard:
   - Update `test-api-gateway.html` to use `http://localhost` (no port)
   - Open in browser

## 📚 More Help

- Full troubleshooting guide: [KUBERNETES-TROUBLESHOOTING.md](./KUBERNETES-TROUBLESHOOTING.md)
- Kubernetes setup guide: [KUBERNETES-LOCAL-SETUP.md](./KUBERNETES-LOCAL-SETUP.md)
- Alternative deployment: Use Docker Compose instead (`npm run docker:up`)

---

**TL;DR:** Open Docker Desktop → Settings → Kubernetes → Enable Kubernetes → Apply & Restart → Wait 5 minutes
