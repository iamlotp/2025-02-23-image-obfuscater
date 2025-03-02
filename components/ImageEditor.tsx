// components/ImageEditor.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Info } from 'lucide-react'
import Cropper from 'react-easy-crop'
import { useRouter } from 'next/navigation'
import { Area } from 'react-easy-crop'
import { v4 as uuidv4 } from 'uuid'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'


export function ImageEditor({ fid }: { fid: string }) {
    const [image, setImage] = useState<string | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedArea, setCroppedArea] = useState<Area | null>(null)
    const [blur, setBlur] = useState(0)
    const [pixelSize, setPixelSize] = useState(1)
    const [note, setNote] = useState('')
    const [croppedImage, setCroppedImage] = useState<string | null>(null)
    const [showCropModal, setShowCropModal] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [frameType, setFrameType] = useState<'contest' | 'paywall' | 'none'>('contest')
    const [prizeAmount, setPrizeAmount] = useState('')
    const [unlockFee, setUnlockFee] = useState('')
    const [showFrameTypeGuide, setShowFrameTypeGuide] = useState(false)
    const [showNoteGuide, setShowNoteGuide] = useState(false)


    const router = useRouter()

    const [editedPreview, setEditedPreview] = useState<string | null>(null)

    const debounce = (fn: Function, ms = 300) => {
        let timeoutId: ReturnType<typeof setTimeout>
        return function (this: any, ...args: any[]) {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => fn.apply(this, args), ms)
        }
    }
    // Add this useEffect to update preview
    useEffect(() => {
        const debouncedUpdate = debounce(async () => {
            if (croppedImage) {
                const processed = await pixelateImage(croppedImage, pixelSize, blur)
                setEditedPreview(processed)
            }
        }, 200)

        debouncedUpdate()
    }, [croppedImage, pixelSize, blur])

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            const imageData = URL.createObjectURL(file)
            setImage(imageData)
            setShowCropModal(true)
        }
    }

    const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedArea(croppedAreaPixels)
    }, [])

    const getCroppedImg = async () => {
        if (!image || !croppedArea) return

        const imageEl = new Image()
        imageEl.src = image

        // First canvas for cropping
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        canvas.width = croppedArea.width
        canvas.height = croppedArea.height

        ctx?.drawImage(
            imageEl,
            croppedArea.x,
            croppedArea.y,
            croppedArea.width,
            croppedArea.height,
            0,
            0,
            croppedArea.width,
            croppedArea.height
        )

        // Check if dimensions exceed 1080x1080 and resize if needed
        if (croppedArea.width > 1080 || croppedArea.height > 1080) {
            const resizeCanvas = document.createElement('canvas')
            const resizeCtx = resizeCanvas.getContext('2d')
            
            resizeCanvas.width = 1080
            resizeCanvas.height = 1080
            
            resizeCtx?.drawImage(
                canvas,
                0,
                0,
                canvas.width,
                canvas.height,
                0,
                0,
                1080,
                1080
            )
            
            const base64Image = resizeCanvas.toDataURL('image/jpeg')
            setCroppedImage(base64Image)
        } else {
            const base64Image = canvas.toDataURL('image/jpeg')
            setCroppedImage(base64Image)
        }
        
        setShowCropModal(false)
    }

    const pixelateImage = async (imageSrc: string, pixelSize: number, blurAmount: number) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.src = imageSrc

        return new Promise<string>((resolve) => {
            img.onload = () => {
                canvas.width = img.width
                canvas.height = img.height

                // Apply pixelation first
                if (pixelSize > 1) {
                    ctx!.imageSmoothingEnabled = false
                    const scaledWidth = img.width / pixelSize
                    const scaledHeight = img.height / pixelSize

                    ctx?.drawImage(
                        img,
                        0, 0, img.width, img.height,
                        0, 0, scaledWidth, scaledHeight
                    )

                    ctx?.drawImage(
                        canvas,
                        0, 0, scaledWidth, scaledHeight,
                        0, 0, img.width, img.height
                    )
                } else {
                    ctx?.drawImage(img, 0, 0)
                }

                // Apply blur after pixelation
                if (blurAmount > 0) {
                    ctx!.filter = `blur(${blurAmount}px)`
                    ctx?.drawImage(canvas, 0, 0)
                }

                resolve(canvas.toDataURL())
            }
        })

    }

    const handleSubmit = async () => {
        if (!editedPreview || !croppedImage) return

        const formData = new FormData()
        formData.append('original', croppedImage)
        formData.append('edited', editedPreview)
        formData.append('note', note)
        formData.append('fid', fid)

        formData.append('frameType', frameType)

        if (frameType === 'contest') {
            formData.append('prizeAmount', prizeAmount)
        } else if (frameType === 'paywall') {
            formData.append('unlockFee', unlockFee)
        }

        console.log('formData', formData.entries());

        const response = await fetch('/api/process-image', {
            method: 'POST',
            body: formData
        })

        if (response.ok) {
            const { id } = await response.json()
            router.push(`/share-frame?id=${id}`)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Crop Image (1:1)</DialogTitle>
                    </DialogHeader>

                    <div className="relative w-full h-64 sm:h-80 bg-muted rounded-lg">
                        <Cropper
                            image={image || ''}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            classes={{
                                containerClassName: "rounded-lg",
                                mediaClassName: "rounded-lg",
                            }}
                        />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label>Zoom: {Math.round(zoom * 100)}%</Label>
                            <Slider
                                min={1}
                                max={3}
                                step={0.1}
                                value={[zoom]}
                                onValueChange={(value) => setZoom(value[0])}
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowCropModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={getCroppedImg}>
                                Confirm Crop
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showFrameTypeGuide} onOpenChange={setShowFrameTypeGuide}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Frame Type Guide</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium">Contest Mode</h4>
                            <p className="text-sm text-muted-foreground">
                                The image will be blurred and users will take guesses in the replies. Image will be available to be revealed by everyone after you finish the contest using the "End Contest" button available in the "Settings" from the frame.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium">Paywalled Mode</h4>
                            <p className="text-sm text-muted-foreground">
                                The image will be blurred and the users who pay the required amount (in $DEGEN tips) in the replies to the frame will be able to see the image by clicking on the "View" button in the frame right after.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium">No limit</h4>
                            <p className="text-sm text-muted-foreground">
                                Anyone who may try to view the original image will be able to see the image without any restrictions or payments.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showNoteGuide} onOpenChange={setShowNoteGuide}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Frame Type Guide</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium">Note</h4>
                            <p className="text-sm text-muted-foreground">
                                This will be shown to any user who may try to view the original image.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="cursor-pointer"
                />
            </div>

            {croppedImage && (
                <div className="space-y-4">
                    <Card className="p-4 space-y-4">

                        <div>
                            <Label>Pixel Size: {pixelSize}</Label>
                            <Slider
                                min={1}
                                max={100}
                                value={[pixelSize]}
                                onValueChange={(value) => setPixelSize(value[0])}
                            />
                        </div>

                        <div>
                            <Label>Blur: {blur}px</Label>
                            <Slider
                                min={0}
                                max={20}
                                value={[blur]}
                                onValueChange={(value) => setBlur(value[0])}
                            />
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Label>Note</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-1"
                                    onClick={() => setShowNoteGuide(true)}>
                                    <Info className="h-3 w-3" />
                                    <span className="sr-only">Shown when a user views the original image.</span>
                                </Button>
                            </div>
                            <Textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Add a note..."
                            />
                        </div>
                    </Card>

                    <Card className="p-4">
                        <Label>Preview</Label>
                        <div className="aspect-square w-full max-w-xs mx-auto mt-2">
                            {editedPreview && (
                                <img
                                    src={editedPreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            )}
                        </div>
                    </Card>

                    <Card className="p-4 space-y-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Label>Frame Type</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-1"
                                    onClick={() => setShowFrameTypeGuide(true)}>
                                    <Info className="h-3 w-3" />
                                    <span className="sr-only">Learn more about frame types</span>
                                </Button>
                            </div>
                            <Select
                                value={frameType}
                                onValueChange={(value) => setFrameType(value as 'contest' | 'paywall' | 'none')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select frame type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="contest">Contest Mode</SelectItem>
                                    <SelectItem value="paywall">Paywalled Mode</SelectItem>
                                    <SelectItem value="none">No limit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {frameType === 'contest' && (
                            <div>
                                <Label>Prize Amount ($DEGEN)</Label>
                                <Input
                                    type="number"
                                    value={prizeAmount}
                                    onChange={(e) => setPrizeAmount(e.target.value)}
                                    min="0"
                                />
                            </div>
                        )}

                        {frameType === 'paywall' && (
                            <div>
                                <Label>Unlock fee ($DEGEN)</Label>
                                <Input
                                    type="number"
                                    value={unlockFee}
                                    onChange={(e) => setUnlockFee(e.target.value)}
                                    min="0"
                                />
                            </div>
                        )}
                    </Card>

                    <Button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="w-full"
                    >
                        {processing ? (
                            <div className="flex items-center">
                                <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </div>
                        ) : (
                            'Submit'
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
