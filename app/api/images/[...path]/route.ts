// app/api/images/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Correct type definition for the route handler with catch-all params
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const filePath = join(process.cwd(), 'public', 'uploads', path)
    
    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 })
    }
    
    const fileBuffer = await readFile(filePath)
    const contentType = path.endsWith('.jpg') || path.endsWith('.jpeg') 
      ? 'image/jpeg' 
      : path.endsWith('.png')
      ? 'image/png'
      : 'application/octet-stream'
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving image:', error)
    return new NextResponse('Error serving image', { status: 500 })
  }
}