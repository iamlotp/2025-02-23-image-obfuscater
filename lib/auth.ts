// lib/auth.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

const AUTH_COOKIE_EXPIRY = 30 * 24 * 60 * 60 * 1000;
const AUTH_COOKIE_NAME = 'authorized_fid';
const TOKEN_COOKIE_NAME = 'token';

/**
 * Validates a token and fid pair against the database
 * Returns boolean without setting cookie
 */
export async function validateToken(token: string, fid: string): Promise<boolean> {
  try {    
    // Look for token with matching fid
    const validToken = await prisma.tokens.findFirst({
      where: {
        token: token.trim(),
        usedByFid: fid.trim()
      }
    });

    if (!validToken) return false;

    return true;
  } catch (error) {
    console.error('Error in token validation:', error);
    return false;
  }
}

/**
 * Generates a new token for a user and stores it in the database
 */
export async function getToken(fid: string): Promise<string> {
  try {
    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store in database
    await prisma.tokens.create({
      data: {
        token,
        usedByFid: fid.trim(),
      }
    });
    
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Check if user is currently logged in from cookies
 */
export async function getCurrentUser(): Promise<string | null> {
  const cookieStore = await cookies();
  const userFid = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return userFid || null;
}

export async function getCurrentToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const userFid = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  return userFid || null;
}

/**
 * Middleware to ensure a user is authenticated
 * Redirects to homepage if not authenticated
 */
export async function requireAuth(): Promise<string | null> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/');
  }
  
  return user;
}