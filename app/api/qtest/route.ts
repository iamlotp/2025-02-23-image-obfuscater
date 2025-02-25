// app/api/process-image/route.ts
import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import hasPaid from '@/app/frame/frames/apiCalls'

export async function GET(request: Request) {

  const hasPaidVar = await hasPaid(417554, 132, '0xcf46ef2cd2a075fd702b532e65155099734f1f2a')  

  return NextResponse.json({ success: true })
}