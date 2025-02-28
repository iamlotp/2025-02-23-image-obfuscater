import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Helper function to fetch data from an API endpoint
async function fetchData(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// Helper function to extract the tip amount from a string
function extractTipAmount(text: string): number | null {
    const match = text.match(/(\d+)\s+\$degen/i);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
}

// Helper function to get the beginning of today in UTC (epoch)
function getStartOfTodayUTC(): number {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    // Calculate seconds since Unix epoch (1970-01-01)
    const secondsSinceUnixEpoch = Math.floor(startOfToday.getTime() / 1000);
    // Calculate the difference between Unix epoch and our new epoch (2021-01-01)
    const customEpochInSeconds = 1609459200; // 2021-01-01 in seconds since Unix epoch
    // Return seconds since our custom epoch
    return secondsSinceUnixEpoch - customEpochInSeconds;
}

export async function POST(
    req: NextRequest,
) {
    const { imageId, requester, minFee, parentCast }
        : { imageId: string; requester: number; minFee: number; parentCast: { fid: string; hash: string } }
        = await req.json();

    if (!imageId || !requester || minFee === undefined || !parentCast || !parentCast.fid || !parentCast.hash) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    try {
        // 1. Fetch replies to the parent cast
        const repliesUrl = `https://hub.pinata.cloud/v1/castsByParent?fid=${parentCast.fid}&hash=${parentCast.hash}&reverse=true&pageSize=700`;
        const repliesData = await fetchData(repliesUrl);

        // Find the first reply from the requester with a tip amount >= minFee
        let targetCastTimestamp: number | null = null;
        if (repliesData.messages && Array.isArray(repliesData.messages)) {
            for (const reply of repliesData.messages) {
                if (reply.data.fid == requester && reply.data.castAddBody) {
                    const tipAmount = extractTipAmount(reply.data.castAddBody.text);
                    if (tipAmount !== null && tipAmount >= minFee) {
                        targetCastTimestamp = reply.data.timestamp;
                        break;
                    }
                }
            }
        }

        if (!targetCastTimestamp) {
            await prisma.viewers.updateMany({
                where: { imageEditId: imageId, viewerFid: requester.toString() },
                data: { status: 'NotFound' },
            });
            return NextResponse.json({ message: "Couldn't find a tip greater than reveal fee." }, { status: 404 });
        }

        // 2. Fetch casts by the requester's FID
        const requesterCastsUrl = `https://hub.pinata.cloud/v1/castsByFid?fid=${requester}&pageSize=300&reverse=true`;
        const requesterCastsData = await fetchData(requesterCastsUrl);

        // Calculate degenTipsGiven
        let degenTipsGiven = 0;
        const startOfToday = getStartOfTodayUTC();

        if (requesterCastsData.messages && Array.isArray(requesterCastsData.messages)) {
            for (const cast of requesterCastsData.messages) {
                if (cast.data.timestamp > targetCastTimestamp) continue;
                if (cast.data.timestamp < startOfToday) break;
                
                if (cast.data.castAddBody?.parentCastId && cast.data.castAddBody?.parentCastId?.hash !== null) {
                    const tipAmount = extractTipAmount(cast.data.castAddBody.text);
                    if (tipAmount !== null) {                        
                        degenTipsGiven += tipAmount;
                    }
                }
            }
        }

        // 3. Fetch Degen Tips allowances
        const degenTipsUrl = `https://api.degen.tips/airdrop2/allowances?fid=${requester}`;
        const degenTipsData = await fetchData(degenTipsUrl);

        // Compare tip_allowance with degenTipsGiven
        let tipIsValid = false;
        if (degenTipsData.length > 0) {
            const firstAllowance = degenTipsData[0];
            tipIsValid = degenTipsGiven <= parseInt(firstAllowance.tip_allowance);
        }

        // 4. Update the viewer's status in the database
        if (tipIsValid) {
            await prisma.viewers.updateMany({
                where: {
                    imageEditId: imageId,
                    viewerFid: requester.toString(),
                },
                data: {
                    status: 'Valid',
                },
            });
        } else {
            await prisma.viewers.updateMany({
                where: {
                    imageEditId: imageId,
                    viewerFid: requester.toString()
                },
                data: { status: 'Invalid' },
            });
        }

        // Return success
        return NextResponse.json({ message: 'Request processed successfully', degenTipsGiven, tipIsValid });
    } catch (error) {
        await prisma.viewers.updateMany({
            where: {
                imageEditId: imageId,
                viewerFid: requester.toString()
            },
            data: { status: 'Error' },
        });
        console.log(error as unknown);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}