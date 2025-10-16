// Main onboarding module exports
export * from './services/index.js';
export * from './controllers/index.js';
export * from './routes/index.js';
export * from './schemas/index.js';

// Re-export main components for easy access
export { OnboardingService } from './services/OnboardingService.js';
export { registerOnboardingRoutes } from './routes/index.js';
