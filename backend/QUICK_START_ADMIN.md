# Quick Start: Super Admin Account

## 🚀 Quick Setup (5 minutes)

### 1. Configure Credentials

Edit `backend/.env.local`:

```bash
# Super Admin Account (Service Provider)
SUPER_ADMIN_EMAIL=admin@clubqore.com
SUPER_ADMIN_PASSWORD=SuperAdmin123!
SUPER_ADMIN_NAME=ClubQore Administrator
```

### 2. Create Account

```bash
cd backend
npm run seed:run
```

**Expected Output:**
```
✅ Super admin account created successfully
   Email: admin@clubqore.com
   Password: SuperAdmin123!
   Role: super_admin
⚠️  IMPORTANT: Change the password after first login!
```

### 3. Login

**Default Credentials:**
- Email: `admin@clubqore.com`
- Password: `SuperAdmin123!`

```bash
# Test login via API
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clubqore.com",
    "password": "SuperAdmin123!"
  }'
```

## 📋 What You Get

- **Role:** `super_admin`
- **Access:** All clubs, all features
- **Permissions:** Full platform administration
- **Club ID:** `null` (platform-wide access)

## 🔐 Security Notes

⚠️ **For Production:**
1. Change default credentials in `.env`
2. Use strong password (12+ characters)
3. Never commit passwords to git
4. Change password after first login

## 📖 Full Documentation

See [SUPER_ADMIN_SETUP.md](./SUPER_ADMIN_SETUP.md) for complete documentation.
