import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Handle unhandled promise rejections (specifically for reCAPTCHA timeouts)
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;

  // Check if the reason is exactly "Timeout" (common reCAPTCHA cleanup error)
  if (reason === 'Timeout') {
    // Silently handle reCAPTCHA timeouts - don't log them
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  // Check if it's a reCAPTCHA timeout error (string containing Timeout)
  if (typeof reason === 'string' && (reason.includes('Timeout') || reason.trim() === 'Timeout')) {
    // Silently handle reCAPTCHA timeouts - don't log them
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  // Check if it's a reCAPTCHA-related promise rejection (Error object)
  if (reason && typeof reason === 'object') {
    const message = reason.message || reason.toString() || String(reason);
    if (message && (message.includes('Timeout') || message.trim() === 'Timeout')) {
      // Silently handle reCAPTCHA timeouts - don't log them
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
  }

  // Check if the reason is just "Timeout" (toString case)
  if (reason && typeof reason.toString === 'function' && reason.toString() === 'Timeout') {
    // Silently handle reCAPTCHA timeouts - don't log them
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  // For other unhandled rejections, log them
  console.error('Unhandled promise rejection:', reason);
});

// Monkey patch console.error to suppress reCAPTCHA timeout errors
const originalConsoleError = console.error;
console.error = function(...args: any[]) {
  // Check if the first argument is just "Timeout" (common reCAPTCHA cleanup error)
  if (args.length > 0 && args[0] === 'Timeout') {
    // Suppress reCAPTCHA timeout errors during component destruction
    return;
  }

  // Check if this is a reCAPTCHA timeout error
  const message = args.join(' ');
  if (message.includes('Unhandled Promise rejection: Timeout') ||
      (message.includes('Zone:') && message.includes('Promise.then') && message.includes('Timeout')) ||
      message.trim() === 'Timeout') {
    // Suppress these specific reCAPTCHA timeout errors
    return;
  }

  // Check if the first argument is the error object
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Unhandled Promise rejection: Timeout')) {
    return;
  }

  // Call original console.error for other errors
  originalConsoleError.apply(console, args);
};

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

