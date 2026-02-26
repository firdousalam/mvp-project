# 🚀 MongoDB Atlas Quick Start

## 5-Minute Setup

### 1. Create MongoDB Atlas Account
- Go to: https://www.mongodb.com/cloud/atlas/register
- Sign up (free tier available)
- Create a cluster (M0 Free tier)

### 2. Configure Access
- **Database Access:** Create user with password
- **Network Access:** Add IP `0.0.0.0/0` (allow from anywhere)

### 3. Get Connection String
- Click "Connect" on your cluster
- Choose "Connect your application"
- Copy connection string
- Replace `<password>` with your actual password

### 4. Configure Application
```bash
# Run setup helper
./setup-atlas.ps1

# Or manually create .env file
cp .env.example .env
```

Edit `.env` with your connection strings:
```env
MONGO_URI_USER=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/userdb?retryWrites=true&w=majority
MONGO_URI_PRODUCT=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/productdb?retryWrites=true&w=majority
MONGO_URI_ORDER=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/orderdb?retryWrites=true&w=majority
```

### 5. Start Services
```bash
npm run docker:atlas:up
```

### 6. Test
Open `test-api-gateway.html` or visit http://localhost:8080

---

**Need detailed instructions?** See [MONGODB-ATLAS-SETUP.md](./MONGODB-ATLAS-SETUP.md)
