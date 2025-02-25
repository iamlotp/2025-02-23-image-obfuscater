// components/ImageResult.tsx
'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { APP_URL } from '@/app/frame/constants'

export function ImageResult({
    id,
    original,
    edited,
    note
}: {
    id: string
    original: string
    edited: string
    note?: string | null
}) {
    return (
        <div className="space-y-6">
            {note && (
                <Card className="p-4 bg-muted/50">
                    <h3 className="font-medium mb-2">Note:</h3>
                    <p className="text-sm text-muted-foreground">{note}</p>
                </Card>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Card className="p-4">
                    <h3 className="font-medium mb-2">Original Image</h3>
                    <div className="aspect-square overflow-hidden rounded-lg">
                        <img 
                            src={original} 
                            alt="Original" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <Button variant="link" className="w-full mt-2" asChild>
                        <Link href={original} target="_blank">
                            View Original
                        </Link>
                    </Button>
                </Card>

                <Card className="p-4">
                    <h3 className="font-medium mb-2">Edited Image</h3>
                    <div className="aspect-square overflow-hidden rounded-lg">
                        <img
                            src={edited}
                            alt="Edited"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <Button variant="link" className="w-full mt-2" asChild>
                        <Link href={edited} target="_blank">
                            View Edited
                        </Link>
                    </Button>
                </Card>
            </div>

            <div className="mt-4">
                <Button variant="default" className="w-full" asChild>
                    <Link href={`https://warpcast.com/~/compose?text=Guess%20the%20image&embeds[]=${APP_URL}/frame/frames?id=${id}`}>Share the Frame</Link>
                </Button>
            </div>
        </div>
    )
}