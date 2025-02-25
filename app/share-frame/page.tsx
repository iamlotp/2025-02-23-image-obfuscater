// app/share-frame/page.tsx
import { prisma } from '@/lib/prisma'
import { ImageResult } from '@/components/ImageResult'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Container } from '@/components/ui/container'
import { getCurrentToken, getCurrentUser, validateToken } from '@/lib/auth'

export default async function ShareFrame({
    searchParams,
}: {
    searchParams: { [key: string]: string }
}) {
    const params = await Promise.resolve(searchParams);
    const recordId = params.id


    if (!recordId) {
        return (
            <Container className="p-4">
                <Alert variant="destructive">
                    <AlertDescription>Missing image ID</AlertDescription>
                </Alert>
            </Container>
        )
    }

    const imageData = await prisma.imageEdit.findUnique({
        where: { id: recordId }
    })

    if (!imageData) {
        return (
            <Container className="p-4">
                <Alert variant="destructive">
                    <AlertDescription>Image not found</AlertDescription>
                </Alert>
            </Container>
        )
    }

    // check the cookies and see if the user is allowed to view this image (if they created the image)
    const currentUser = await getCurrentUser();
    const currentToken = await getCurrentToken();

    if (!currentUser || currentUser !== imageData.creatorFid || !currentToken || !validateToken(currentToken, currentUser)) {
        return (
            <Container className="p-4">
                <Alert variant="destructive">
                    <AlertDescription>You are not allowed to view this image</AlertDescription>
                </Alert>
            </Container>
        )
    }

    return (
        <Container className="p-4">
            <h1 className="text-2xl font-bold mb-8 text-center md:text-left">Your Processed Image</h1>
            <Card className="p-4 md:p-6">
                <ImageResult
                    id={imageData.id}
                    original={imageData.ogImage}
                    edited={imageData.editedImage}
                    note={imageData.note}
                />

            </Card>
        </Container>
    )
}
