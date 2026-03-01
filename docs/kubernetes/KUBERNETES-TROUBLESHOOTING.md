# Kubernetes Troubleshooting Guide

## Error: "couldn't get current server API group list: EOF"

This error means Kubernetes is not running or not accessible. Here's how to fix it.

## Quick Fix Steps

### Step 1: Check Docker Desktop

1. Open Docker Desktop
2. Look at the bottom-left corner
3. Check if Kubernetes shows a green icon (running) or red/orange (not running)

### Step 2: Enable Kubernetes in Docker Desktop

1. **Open Docker Desktop**
2. Click the **Settings** icon (gear icon in top-right)
3. Go to **Kubernetes** section (left sidebar)
4. Check the box: **"Enable Kubernetes"**
5. Click **"Apply & Restart"**
6. Wait 2-5 minutes for Kubernetes to start

**Important:** The first time you enable Kubernetes, it downloads images and can take 5-10 minutes.

### Step 3: Verify Kubernetes is Running

```bash
# Check Docker Desktop status
docker info

# Check Kubernetes status
kubectl cluster-info

# Should show:
# Kubernetes control plane is running at https://kubernetes.docker.internal:6443
# CoreDNS is running at https://kubernetes.docker.internal:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
```

### Step 4: Check Kubernetes Context

```bash
# List available contexts
kubectl config get-contexts

# Should show docker-desktop with a * (active)
# CURRENT   NAME             CLUSTER          AUTHINFO         NAMESPACE
# *         docker-desktop   docker-desktop   docker-desktop

# If not active, switch to it
kubectl config use-context docker-desktop
```

### Step 5: Verify Nodes

```bash
# Check if nodes are ready
kubectl get nodes

# Should show:
# NAME             STATUS   ROLES           AGE   VERSION
# docker-desktop   Ready    control-plane   1d    v1.28.2
```

## Common Issues and Solutions

### Issue 1: Kubernetes Not Starting

**Symptoms:**
- Kubernetes icon stays orange/yellow
- "Starting..." message for more than 10 minutes

**Solutions:**

1. **Reset Kubernetes:**
   - Docker Desktop → Settings → Kubernetes
   - Click "Reset Kubernetes Cluster"
   - Wait for reset to complete
   - Enable Kubernetes again

2. **Restart Docker Desktop:**
   - Right-click Docker Desktop icon in system tray
   - Click "Quit Docker Desktop"
   - Start Docker Desktop again
   - Wait for Kubernetes to start

3. **Check Resources:**
   - Docker Desktop → Settings → Resources
   - Ensure you have:
     - At least 4 GB RAM allocated
     - At least 2 CPUs allocated
   - Increase if needed and restart

### Issue 2: "Connection Refused" Error

**Symptoms:**
```
Unable to connect to the server: dial tcp 127.0.0.1:6443: connect: connection refused
```

**Solutions:**

1. **Restart Kubernetes:**
   ```bash
   # In Docker Desktop Settings → Kubernetes
   # Uncheck "Enable Kubernetes"
   # Click "Apply & Restart"
   # Wait 30 seconds
   # Check "Enable Kubernetes" again
   # Click "Apply & Restart"
   ```

2. **Check if Docker is Running:**
   ```bash
   docker ps
   # Should list running containers without errors
   ```

### Issue 3: kubectl Not Found

**Symptoms:**
```
'kubectl' is not recognized as an internal or external command
```

**Solutions:**

1. **Install kubectl:**
   - kubectl is included with Docker Desktop
   - If missing, download from: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/

2. **Add to PATH (Windows):**
   ```powershell
   # Check if kubectl exists
   where kubectl
   
   # If not found, add Docker Desktop to PATH
   # Usually located at: C:\Program Files\Docker\Docker\resources\bin
   ```

### Issue 4: Context Not Set

**Symptoms:**
```
The connection to the server localhost:8080 was refused
```

**Solutions:**

```bash
# Set context to docker-desktop
kubectl config use-context docker-desktop

# Verify
kubectl config current-context
# Should output: docker-desktop
```

### Issue 5: Kubernetes Version Mismatch

**Symptoms:**
- Deployments fail
- Incompatibility errors

**Solutions:**

1. **Check Kubernetes version:**
   ```bash
   kubectl version --short
   ```

2. **Update Docker Desktop:**
   - Download latest version from: https://www.docker.com/products/docker-desktop/
   - Install and restart

## Windows-Specific Issues

### WSL 2 Backend Issues

If using WSL 2 backend:

1. **Enable WSL 2:**
   ```powershell
   # Run as Administrator
   wsl --set-default-version 2
   ```

2. **Update WSL:**
   ```powershell
   wsl --update
   ```

3. **Docker Desktop Settings:**
   - Settings → General
   - Ensure "Use the WSL 2 based engine" is checked

### Hyper-V Issues

If using Hyper-V backend:

1. **Enable Hyper-V:**
   - Control Panel → Programs → Turn Windows features on or off
   - Check "Hyper-V"
   - Restart computer

2. **Check Virtualization:**
   - Open Task Manager
   - Performance tab
   - Check if "Virtualization: Enabled"

## Verification Checklist

After fixing, verify everything works:

```bash
# 1. Check Docker
docker --version
docker ps

# 2. Check Kubernetes
kubectl version --short
kubectl cluster-info

# 3. Check nodes
kubectl get nodes

# 4. Check system pods
kubectl get pods -n kube-system

# 5. Test deployment
kubectl run test-nginx --image=nginx --port=80
kubectl get pods
kubectl delete pod test-nginx
```

All commands should work without errors.

## Still Having Issues?

### Collect Diagnostic Information

```bash
# Docker info
docker info > docker-info.txt

# Kubernetes info
kubectl cluster-info dump > k8s-info.txt

# Docker Desktop logs
# Windows: %APPDATA%\Docker\log.txt
```

### Reset Everything (Last Resort)

1. **Backup your data** (if any)

2. **Reset Docker Desktop:**
   - Settings → Troubleshoot
   - Click "Clean / Purge data"
   - Click "Reset to factory defaults"

3. **Restart computer**

4. **Start Docker Desktop**

5. **Enable Kubernetes:**
   - Settings → Kubernetes
   - Enable Kubernetes
   - Wait for startup

## Alternative: Use Minikube

If Docker Desktop Kubernetes continues to have issues:

```bash
# Install Minikube
choco install minikube

# Start Minikube
minikube start

# Use Minikube context
kubectl config use-context minikube

# Verify
kubectl get nodes
```

## Quick Reference Commands

```bash
# Check status
kubectl cluster-info
kubectl get nodes
kubectl get pods --all-namespaces

# Switch context
kubectl config use-context docker-desktop

# Reset Kubernetes (Docker Desktop)
# Settings → Kubernetes → Reset Kubernetes Cluster

# View logs
kubectl logs <pod-name>
kubectl describe pod <pod-name>

# Delete stuck resources
kubectl delete pod <pod-name> --force --grace-period=0
```

## Next Steps

Once Kubernetes is running:

1. ✅ Run: `kubectl cluster-info` (should work)
2. ✅ Run: `kubectl get nodes` (should show docker-desktop)
3. ✅ Deploy the application: `npm run k8s:deploy`
4. ✅ Check pods: `kubectl get pods`
5. ✅ Test the application: `curl http://localhost/health/user`

## Need More Help?

- [Docker Desktop Documentation](https://docs.docker.com/desktop/)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Docker Desktop Kubernetes Guide](https://docs.docker.com/desktop/kubernetes/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

---

**Most Common Solution:** Enable Kubernetes in Docker Desktop Settings → Kubernetes → Enable Kubernetes → Apply & Restart
