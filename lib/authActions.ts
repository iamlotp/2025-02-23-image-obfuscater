'use server'

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { validateToken } from './auth';

const AUTH_COOKIE_NAME = 'authorized_fid';
const TOKEN_COOKIE_NAME = 'token';

/**
 * Server Action to validate token and set auth cookie
 * This should be called from a form submission
 */
export async function authenticateWithToken(formData: FormData) {
  const token = formData.get('token') as string;
  const fid = formData.get('fid') as string;
  
  if (!token || !fid) {
    return { error: "Missing token or fid" };
  }

  // Validate token
  const isValid = await validateToken(token, fid);
  
  if (!isValid) {
    return { error: "Invalid token" };
  }

  // Set the auth cookie
  (await cookies()).set(AUTH_COOKIE_NAME, fid.trim(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/'
  });
  (await cookies()).set(TOKEN_COOKIE_NAME, token.trim(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/'
  });
  
  revalidatePath('/edit-page');
  redirect(`/edit-page?fid=${fid}`);
}

/**
 * Server Action to log out the current user
 */
export async function logout() {
  (await cookies()).delete(AUTH_COOKIE_NAME);
  revalidatePath('/');
  redirect('/');
}