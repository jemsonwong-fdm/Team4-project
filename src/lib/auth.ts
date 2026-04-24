/**
 * Authentication utilities for MVP
 * Requirements: 7.1
 * 
 * Simple session-based authentication for MVP.
 * In production, this would use proper JWT tokens, OAuth, or similar.
 */

import { cookies } from 'next/headers';
import type { RM } from './models';
import rmsData from '@/data/mock/rms.json';

const SESSION_COOKIE_NAME = 'rm_session';

/**
 * Get the current authenticated RM from the request
 * For MVP, we use a simple cookie-based session
 */
export async function getCurrentRM(): Promise<RM | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie) {
        return null;
    }

    // In MVP, the cookie value is just the RM ID
    // In production, this would be a signed JWT or session token
    const rmId = sessionCookie.value;

    // Look up the RM
    const rm = rmsData.find(r => r.id === rmId);

    return rm || null;
}

/**
 * Set the current RM session
 * For MVP, this just sets a cookie with the RM ID
 */
export async function setRMSession(rmId: string): Promise<void> {
    const cookieStore = await cookies();

    // Verify the RM exists
    const rm = rmsData.find(r => r.id === rmId);
    if (!rm) {
        throw new Error('Invalid RM ID');
    }

    // Set the session cookie
    cookieStore.set(SESSION_COOKIE_NAME, rmId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
}

/**
 * Clear the current RM session
 */
export async function clearRMSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Require authentication - throws if not authenticated
 * Use this in API routes to ensure the user is authenticated
 */
export async function requireAuth(): Promise<RM> {
    const rm = await getCurrentRM();

    if (!rm) {
        throw new Error('Authentication required');
    }

    return rm;
}

/**
 * Get all available RMs (for login/testing purposes)
 */
export function getAllRMs(): RM[] {
    return rmsData as RM[];
}

/**
 * Authenticate an RM by ID (for MVP login)
 * In production, this would verify credentials
 */
export async function authenticateRM(rmId: string): Promise<RM | null> {
    const rm = rmsData.find(r => r.id === rmId);

    if (!rm) {
        return null;
    }

    await setRMSession(rmId);
    return rm;
}
