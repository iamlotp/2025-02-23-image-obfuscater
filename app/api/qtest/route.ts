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

function coLog(message: string, color: string) {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  }
  console.log(`${colors[color as keyof typeof colors]}${message}${colors.reset}`)
}