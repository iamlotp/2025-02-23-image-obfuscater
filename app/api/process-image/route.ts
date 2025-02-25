// app/api/process-image/route.ts
import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

const getUsername = async (fid: string | number) => {
  interface UserDataBody {
      type: string;
      value: string;
  }

  interface Data {
      type: string;
      fid: number;
      timestamp: number;
      network: string;
      userDataBody: UserDataBody;
  }

  interface Response {
      data: Data;
      hash: string;
      hashScheme: string;
      signature: string;
      signatureScheme: string;
      signer: string;
  }
  const server = "https://hubs.airstack.xyz";
  try {
      const response = await fetch(`${server}/v1/userDataByFid?fid=${fid}&user_data_type=6`, {
          headers: {
              "Content-Type": "application/json",
              // Provide API key here
              "x-airstack-hubs": process.env.AIRSTACK_API_KEY as string,
          },
      });

      const respObj = await response.json() as Response;
      return respObj.data.userDataBody.value;

  } catch (e) {
      console.error(e);
  }
}

export async function POST(request: Request) {
  const formData = await request.formData()

  const original = formData.get('original') as string
  const edited = formData.get('edited') as string
  const note = formData.get('note') as string
  const fid = formData.get('fid') as string
  const frameType = formData.get('frameType') as string
  const unlockFee = formData.get('unlockFee') as string
  const prizeAmount = formData.get('prizeAmount') as string

  const username = await getUsername(fid)


  // Generate unique filenames
  const ogFilename = `${uuidv4()}.jpg`
  const editedFilename = `${uuidv4()}.jpg`

  // Save images to public directory
  const saveImage = async (base64Data: string, filename: string) => {
    const data = base64Data.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(data, 'base64')
    const path = join(process.cwd(), 'public/uploads', filename)
    await writeFile(path, buffer)
  }

  await saveImage(original, ogFilename)
  await saveImage(edited, editedFilename)

  // Save to database
  const record = await prisma.imageEdit.create({
    data: {
      ogImage: `/uploads/${ogFilename}`,
      editedImage: `/uploads/${editedFilename}`,
      note,
      creatorFid: fid,
      creatorUsername: username,
      isPaywalled: frameType === 'paywall',
      unlockFee: frameType === 'paywall' ? Number(unlockFee) : undefined,
      isContest: frameType === 'contest',
      prizeAmount: frameType === 'contest' ? Number(prizeAmount) : undefined,
    }
  })

  return NextResponse.json({ success: true, id: record.id })
}