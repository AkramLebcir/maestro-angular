# NestJS Backend

NestJS backend application with PostgreSQL database and TypeORM.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose (for running PostgreSQL)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy the environment file:
```bash
cp .env.example .env
```

The default `.env` values are already configured to work with the Docker Compose setup.

## Database Setup

### Using Docker Compose (Recommended)

1. Start PostgreSQL using Docker Compose:
```bash
docker-compose up -d
```

This will start a PostgreSQL container with the following default settings:
- Host: `localhost`
- Port: `15432`
- Username: `postgres`
- Password: `postgres`
- Database: `nest_db`

2. Verify the container is running:
```bash
docker-compose ps
```

3. Stop the database when done:
```bash
docker-compose down
```

To remove the database volume (deletes all data):
```bash
docker-compose down -v
```

### Using Local PostgreSQL

If you prefer to use a local PostgreSQL installation:

1. Make sure PostgreSQL is running on your machine
2. Create a database:
```sql
CREATE DATABASE nest_db;
```

3. Update the `.env` file with your PostgreSQL database credentials:
```
DB_HOST=localhost
DB_PORT=15432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=your_database_name
```

## Running the Application

### Development
```bash
npm run start:dev
```

The application will start on `http://localhost:3000`

**Note:** CORS is enabled to allow requests from the Angular frontend running on `http://localhost:4200`

### Production
```bash
npm run build
npm run start:prod
```

## Project Structure

```
nest-backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── typeorm.config.ts
│   ├── database/        # Database module
│   │   └── database.module.ts
│   ├── app.module.ts    # Root module
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts          # Application entry point
├── .env.example         # Environment variables template
├── docker-compose.yml   # Docker Compose configuration for PostgreSQL
├── package.json
└── tsconfig.json
```

## Available Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build the application
- `npm run start:prod` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests

## TypeORM Configuration

TypeORM is configured to automatically synchronize database schema in development mode. In production, you should use migrations instead.

To create entities, add them to the `src/` directory with the `.entity.ts` extension, and they will be automatically discovered by TypeORM.

