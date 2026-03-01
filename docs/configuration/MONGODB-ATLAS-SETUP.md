# 🌐 MongoDB Atlas Setup Guide

Complete guide for connecting the Product Order System to MongoDB Atlas cloud database.

## Why MongoDB Atlas?

- ✅ **Fully managed** - No database maintenance required
- ✅ **Cloud-based** - Access from anywhere
- ✅ **Free tier** - 512MB storage free forever
- ✅ **Automatic backups** - Built-in data protection
- ✅ **High availability** - Built-in replication
- ✅ **Scalable** - Easy to upgrade as you grow

---

## Step 1: Create MongoDB Atlas Account

1. **Go to MongoDB Atlas**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up for a free account

2. **Verify your email**
   - Check your email and verify your account

3. **Complete the welcome survey** (optional)
   - Select your preferences
   - Click "Finish"

---

## Step 2: Create a Cluster

1. **Create a new cluster**
   - Click "Build a Database"
   - Select "FREE" tier (M0 Sandbox)
   - Choose your cloud provider (AWS, Google Cloud, or Azure)
   - Select a region close to you
   - Click "Create Cluster"

2. **Wait for cluster creation**
   - Takes 3-5 minutes
   - You'll see "Cluster0" when ready

---

## Step 3: Configure Database Access

### Create Database User

1. **Go to Database Access**
   - Click "Database Access" in left sidebar
   - Click "Add New Database User"

2. **Create user credentials**
   - Authentication Method: Password
   - Username: `productorderuser` (or your choice)
   - Password: Click "Autogenerate Secure Password" or create your own
   - **IMPORTANT:** Save these credentials securely!

3. **Set user privileges**
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

---

## Step 4: Configure Network Access

### Whitelist IP Addresses

1. **Go to Network Access**
   - Click "Network Access" in left sidebar
   - Click "Add IP Address"

2. **Add your IP**
   
   **Option A: Allow from anywhere (easiest for development)**
   - Click "Allow Access from Anywhere"
   - IP Address: `0.0.0.0/0`
   - Click "Confirm"
   - ⚠️ **Warning:** Not recommended for production!

   **Option B: Add specific IP (more secure)**
   - Click "Add Current IP Address"
   - Or manually enter your IP address
   - Click "Confirm"

---

## Step 5: Get Connection Strings

1. **Go to Database**
   - Click "Database" in left sidebar
   - Click "Connect" on your cluster

2. **Choose connection method**
   - Select "Connect your application"
   - Driver: Node.js
   - Version: 4.1 or later

3. **Copy connection string**
   - You'll see something like:
     ```
     mongodb+srv://productorderuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - **IMPORTANT:** Replace `<password>` with your actual password!

4. **Create three connection strings** (one for each database)
   ```
   # User Service
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/userdb?retryWrites=true&w=majority

   # Product Service
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/productdb?retryWrites=true&w=majority

   # Order Service
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/orderdb?retryWrites=true&w=majority
   ```

---

## Step 6: Configure Your Application

### Method 1: Using .env File (Recommended)

1. **Create .env file** in project root:
   ```bash
   # Copy the example file
   cp .env.example .env
   ```

2. **Edit .env file** with your connection strings:
   ```env
   # MongoDB Atlas Configuration
   MONGO_URI_USER=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/userdb?retryWrites=true&w=majority
   MONGO_URI_PRODUCT=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/productdb?retryWrites=true&w=majority
   MONGO_URI_ORDER=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/orderdb?retryWrites=true&w=majority

   # API Gateway Configuration
   PORT=8080
   AUTH_ENABLED=false
   JWT_SECRET=your-secret-key-change-in-production
   NODE_ENV=development

   # Service URLs
   USER_SERVICE_URL=http://localhost:3001
   PRODUCT_SERVICE_URL=http://localhost:3002
   ORDER_SERVICE_URL=http://localhost:3003
   ```

3. **Important:** Add .env to .gitignore
   ```bash
   echo ".env" >> .gitignore
   ```

### Method 2: Using Environment Variables

Set environment variables directly:

**Windows (PowerShell):**
```powershell
$env:MONGO_URI_USER="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/userdb?retryWrites=true&w=majority"
$env:MONGO_URI_PRODUCT="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/productdb?retryWrites=true&w=majority"
$env:MONGO_URI_ORDER="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/orderdb?retryWrites=true&w=majority"
```

**Windows (CMD):**
```cmd
set MONGO_URI_USER=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/userdb?retryWrites=true&w=majority
set MONGO_URI_PRODUCT=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/productdb?retryWrites=true&w=majority
set MONGO_URI_ORDER=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/orderdb?retryWrites=true&w=majority
```

**Linux/Mac:**
```bash
export MONGO_URI_USER="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/userdb?retryWrites=true&w=majority"
export MONGO_URI_PRODUCT="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/productdb?retryWrites=true&w=majority"
export MONGO_URI_ORDER="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/orderdb?retryWrites=true&w=majority"
```

---

## Step 7: Run Your Application

### Option A: With Docker Compose (Recommended)

1. **Use the Atlas-specific compose file:**
   ```bash
   docker-compose -f docker-compose.atlas.yml up -d
   ```

2. **Or add to package.json:**
   ```json
   "scripts": {
     "docker:atlas:up": "docker-compose -f docker-compose.atlas.yml up -d",
     "docker:atlas:down": "docker-compose -f docker-compose.atlas.yml down",
     "docker:atlas:logs": "docker-compose -f docker-compose.atlas.yml logs -f"
   }
   ```

3. **Then run:**
   ```bash
   npm run docker:atlas:up
   ```

### Option B: Local Development (Without Docker)

1. **Install dependencies:**
   ```bash
   cd user-service && npm install && cd ..
   cd product-service && npm install && cd ..
   cd order-service && npm install && cd ..
   cd api-gateway && npm install && cd ..
   ```

2. **Start services:**
   ```bash
   # Terminal 1 - User Service
   cd user-service
   npm start

   # Terminal 2 - Product Service
   cd product-service
   npm start

   # Terminal 3 - Order Service
   cd order-service
   npm start

   # Terminal 4 - API Gateway
   cd api-gateway
   npm start
   ```

---

## Step 8: Verify Connection

### Check Service Health

```bash
# Check all services
curl http://localhost:8080/health
curl http://localhost:8080/health/user
curl http://localhost:8080/health/product
curl http://localhost:8080/health/order
```

All should return `{"status":"healthy"}`

### Test Database Connection

```bash
# Create a test user
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Should return user data with ID
```

### View Data in Atlas

1. Go to MongoDB Atlas dashboard
2. Click "Browse Collections"
3. You should see:
   - `userdb` database with `users` collection
   - `productdb` database (will appear after creating products)
   - `orderdb` database (will appear after creating orders)

---

## Troubleshooting

### Connection Timeout

**Problem:** Services can't connect to Atlas

**Solutions:**
1. **Check IP whitelist:**
   - Go to Network Access in Atlas
   - Ensure your IP is whitelisted
   - Or use `0.0.0.0/0` for development

2. **Check credentials:**
   - Verify username and password in connection string
   - Ensure password doesn't contain special characters (or URL encode them)

3. **Check connection string:**
   - Must start with `mongodb+srv://`
   - Must include database name: `/userdb`, `/productdb`, `/orderdb`
   - Must include `?retryWrites=true&w=majority`

### Authentication Failed

**Problem:** `MongoServerError: Authentication failed`

**Solutions:**
1. **Verify user credentials:**
   - Go to Database Access in Atlas
   - Check username is correct
   - Reset password if needed

2. **Check user privileges:**
   - User must have "Read and write to any database" permission

### Network Error

**Problem:** `MongoNetworkError: connection timed out`

**Solutions:**
1. **Check internet connection**
2. **Check firewall settings**
3. **Verify cluster is running** (check Atlas dashboard)

### Special Characters in Password

**Problem:** Connection fails with special characters in password

**Solution:** URL encode special characters:
```
@ → %40
: → %3A
/ → %2F
? → %3F
# → %23
[ → %5B
] → %5D
```

Example:
```
Password: P@ssw0rd!
Encoded: P%40ssw0rd!
```

---

## Security Best Practices

### For Development

✅ Use `.env` file for credentials
✅ Add `.env` to `.gitignore`
✅ Use `0.0.0.0/0` IP whitelist (convenient)
✅ Use autogenerated passwords

### For Production

✅ Use environment variables (not .env files)
✅ Use specific IP whitelisting
✅ Use strong, unique passwords
✅ Enable MongoDB Atlas encryption
✅ Enable audit logs
✅ Set up monitoring and alerts
✅ Use VPC peering (for cloud deployments)
✅ Enable two-factor authentication on Atlas account

---

## Cost Considerations

### Free Tier (M0)
- ✅ 512MB storage
- ✅ Shared RAM
- ✅ Shared vCPU
- ✅ Perfect for development and small projects
- ✅ No credit card required

### Paid Tiers
- Start at $9/month (M2)
- More storage and dedicated resources
- Better performance
- Advanced features

---

## Monitoring

### Atlas Dashboard

1. **View metrics:**
   - Go to "Metrics" tab
   - See connections, operations, network usage

2. **Set up alerts:**
   - Go to "Alerts" tab
   - Configure alerts for:
     - High connection count
     - Low storage space
     - High CPU usage

3. **View logs:**
   - Go to "Logs" tab
   - See connection logs
   - Debug issues

---

## Migration from Local MongoDB

If you have existing data in local MongoDB:

### Export from Local

```bash
# Export user database
mongodump --db userdb --out ./backup

# Export product database
mongodump --db productdb --out ./backup

# Export order database
mongodump --db orderdb --out ./backup
```

### Import to Atlas

```bash
# Import user database
mongorestore --uri "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/userdb" ./backup/userdb

# Import product database
mongorestore --uri "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/productdb" ./backup/productdb

# Import order database
mongorestore --uri "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/orderdb" ./backup/orderdb
```

---

## Quick Reference

### Connection String Format

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### Required Components

- `username`: Your database user
- `password`: User's password (URL encoded if special chars)
- `cluster`: Your cluster address (e.g., cluster0.xxxxx)
- `database`: Database name (userdb, productdb, or orderdb)

### Example .env File

```env
MONGO_URI_USER=mongodb+srv://myuser:mypass123@cluster0.abc123.mongodb.net/userdb?retryWrites=true&w=majority
MONGO_URI_PRODUCT=mongodb+srv://myuser:mypass123@cluster0.abc123.mongodb.net/productdb?retryWrites=true&w=majority
MONGO_URI_ORDER=mongodb+srv://myuser:mypass123@cluster0.abc123.mongodb.net/orderdb?retryWrites=true&w=majority
```

---

## Next Steps

1. ✅ Create Atlas account
2. ✅ Create cluster
3. ✅ Configure database user
4. ✅ Whitelist IP addresses
5. ✅ Get connection strings
6. ✅ Create .env file
7. ✅ Start services
8. ✅ Test connection
9. 🔜 Deploy to production
10. 🔜 Set up monitoring

---

**Your Product Order System is now connected to MongoDB Atlas!** 🌐☁️
