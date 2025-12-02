# Starting the Backend Server

## Current Issue
The backend is not running because Node.js is crashing with a compatibility error.

## Quick Fix Instructions

### Step 1: Check Node.js Version
```bash
cd /Users/lebcirakram/Documents/ala-project/nest-backend
node --version
```

If Node.js crashes or shows an error, you need to fix Node.js compatibility first.

### Step 2: Start the Backend

**Option A: Using npm (Development with watch mode)**
```bash
cd /Users/lebcirakram/Documents/ala-project/nest-backend
npm run start:dev
```

**Option B: Build and run production**
```bash
cd /Users/lebcirakram/Documents/ala-project/nest-backend
npm run build
npm run start:prod
```

### Step 3: Verify Backend is Running

You should see output like:
```
Starting NestJS application...
Application is running on: http://localhost:3000
API routes are available at: http://localhost:3000/api
```

Then test:
```bash
curl http://localhost:3000/api
curl http://localhost:3000/api/classes
```

## Troubleshooting

### If Node.js crashes:
The Node.js binary at `/usr/local/bin/node` is incompatible with your macOS version.

**Solutions:**
1. Update Node.js via Homebrew: `brew install node` or `brew upgrade node`
2. Use NVM (Node Version Manager):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.zshrc
   nvm install --lts
   nvm use --lts
   ```
3. Download and install Node.js from https://nodejs.org/ (choose the LTS version)

### If database connection fails:
Make sure PostgreSQL is running:
```bash
docker ps | grep nest-postgres
```

If not running:
```bash
cd /Users/lebcirakram/Documents/ala-project/nest-backend
docker-compose up -d
```

### If port 3000 is already in use:
```bash
lsof -ti:3000 | xargs kill -9
```

Then start the backend again.




