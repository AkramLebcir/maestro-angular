# Angular Frontend

Angular frontend application with Tailwind CSS, configured to communicate with the NestJS backend API.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- NestJS backend running on `http://localhost:3000`

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Server
```bash
npm start
```

The application will start on `http://localhost:4200`

**Note:** Make sure the NestJS backend is running before starting the Angular frontend. The frontend is configured to proxy API requests to `http://localhost:3000` during development.

### Build for Production
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
angular-frontend/
├── src/
│   ├── app/
│   │   ├── services/        # API services
│   │   │   └── api.service.ts
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.css
│   │   ├── app.module.ts
│   │   └── app-routing.module.ts
│   ├── environments/        # Environment configuration
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── assets/          # Static assets
│   ├── styles.css       # Global styles with Tailwind directives
│   ├── index.html
│   └── main.ts          # Application entry point
├── proxy.conf.json      # Proxy configuration for API calls
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
├── angular.json
└── package.json
```

## Tailwind CSS

Tailwind CSS is configured and ready to use. The configuration files are:

- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration with autoprefixer
- `src/styles.css` - Contains Tailwind directives

You can use Tailwind utility classes directly in your components:

```html
<div class="bg-blue-500 text-white p-4 rounded-lg">
  Hello Tailwind!
</div>
```

## API Integration

The Angular frontend is configured to communicate with the NestJS backend:

- **Development:** Uses proxy configuration (`proxy.conf.json`) to forward `/api/*` requests to `http://localhost:3000`
- **Production:** Uses the full backend URL from `environment.prod.ts`

### Using the API Service

The `ApiService` is available throughout the application. Example usage:

```typescript
import { ApiService } from './services/api.service';

constructor(private apiService: ApiService) {}

// GET request
this.apiService.get('/endpoint').subscribe(data => {
  console.log(data);
});

// POST request
this.apiService.post('/endpoint', { data: 'value' }).subscribe(response => {
  console.log(response);
});
```

### Environment Configuration

- `src/environments/environment.ts` - Development environment (uses proxy)
- `src/environments/environment.prod.ts` - Production environment (direct API URL)

## Available Scripts

- `npm start` - Start development server with proxy configuration
- `npm run build` - Build the application for production
- `npm run watch` - Build and watch for changes
- `npm test` - Run unit tests

## Development

The app will automatically reload if you change any of the source files.

**Important:** Ensure the NestJS backend is running on port 3000 for the API to work correctly.

## Further Help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

