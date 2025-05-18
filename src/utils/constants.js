/**
 * Application Constants
 * 
 * This file centralizes all constants used across the application
 * to avoid duplication and ensure consistency.
 */

// Belt progression options
export const BELT_OPTIONS = [
    'White', 
    'Yellow', 
    'Yellow Stripe', 
    'Green', 
    'Green Stripe', 
    'Blue', 
    'Blue Stripe', 
    'Red', 
    'Red Stripe', 
    'Black Stripe', 
    'Black 1', 
    'Black 2', 
    'Black 3'
];

// Belt order for sorting (high to low)
export const BELT_ORDER = [
    'Black 3', 'Black 2', 'Black 1', 'Black Stripe',
    'Red', 'Red Stripe',
    'Blue', 'Blue Stripe',
    'Green', 'Green Stripe',
    'Yellow', 'Yellow Stripe',
    'White'
];

// Branch locations
export const BRANCH_OPTIONS = ['HQ', 'Satwari', 'Gangyal'];

// Training batch options
export const BATCH_OPTIONS = [1, 2];

// User roles
export const USER_ROLES = {
    ADMIN: 'admin',
    INSTRUCTOR: 'instructor',
    STUDENT: 'student'
};

// Form validation patterns
export const VALIDATION_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\+?[\d\s-]{10,}$/,
};

// API request cache times (in milliseconds)
export const CACHE_DURATION = {
    SHORT: 5 * 60 * 1000, // 5 minutes
    MEDIUM: 30 * 60 * 1000, // 30 minutes
    LONG: 60 * 60 * 1000, // 1 hour
};

// Default values
export const DEFAULTS = {
    BRANCH: 'HQ',
    BELT: 'White',
    BATCH: 1
}; 