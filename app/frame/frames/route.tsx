/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next";
import { error } from "frames.js/core";
import { frames } from "./frames";
import { prisma } from "@/lib/prisma";
import { APP_LOCAL, APP_URL } from "../constants";
import { getToken } from "@/lib/auth";
import hasPaid from "./apiCalls";

const handleRequest = frames(async (ctx) => {
    const imageId = ctx.searchParams.id;

    if (ctx.searchParams.create === "true") {
        const requester = ctx.message?.requesterFid!

        const token = await getToken(requester.toString())
        return {
            image: (
                <span>
                    Click on the button below to create a new blurry image.
                </span>
            ),
            buttons: [
                <Button action="link" target={APP_URL + '/edit-page?fid=' + requester + '&token=' + token}>
                    Create
                </Button>,
            ],
            imageOptions: {
                aspectRatio: "1:1",
                width: 1080,
            }
        };
    }



    if (!imageId) {
        return {
            image: (
                <span>
                    Image Not Found!
                </span>
            ),
            buttons: [
                <Button action="post" target={{ query: { create: "true", id: imageId } }}>
                    Create
                </Button>,
            ],
            imageOptions: {
                aspectRatio: "1:1",
                width: 1080,
            }
        };
    }

    const image = (await prisma.imageEdit.findUnique({
        where: { id: imageId },
    }));


    if (!image) {
        return {
            image: (
                <span>
                    Image Not Found!
                </span>
            )
        };
    }
    if (ctx.searchParams.settings === "true") {
        const requester = ctx.message?.requesterFid!
        if (requester.toString() !== image.creatorFid) {
            error("You are not the creator of this image!");
        }
        return {
            image: (
                <span>
                    Click on the button bellow to finish the contest.
                </span>
            ),
            buttons: [
                <Button action="post" target={{ query: { finish: "true", id: imageId } }}>
                    Finish Contest
                </Button>,
                <Button action="post" target={{ query: { back: "true", id: imageId } }}>
                    Back
                </Button>
            ],
            imageOptions: {
                aspectRatio: "1:1",
                width: 1080,
            }
        };
    }
    if (ctx.searchParams.finish === "true") {
        const requester = ctx.message?.requesterFid!
        await prisma.imageEdit.update({
            where: { id: imageId },
            data: { isSolved: true },
        });
        error("Contest finished!");
    }

    if (ctx.searchParams.view === "true") {
        if (image.isContest && !image.isSolved) {
            return error("Contest not over yet!");
        }
        if (image.isPaywalled) {
            const requester = ctx.message?.requesterFid!
            const frameCast = ctx.message?.castId;
            if (!hasPaid(requester, image.unlockFee, frameCast!.hash)) {
                return error("Tip the creator to view!");
            }
        }
        return {
            image: (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        padding: "50px",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        backgroundColor: "black",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "white",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                position: "relative",
                                overflow: "hidden",
                                display: "flex",
                            }}
                        >
                            <img
                                src={`${APP_LOCAL + image.ogImage}`}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />

                            {/* Text Overlays */}
                            {
                                image.note && <div
                                    style={{
                                        position: "absolute",
                                        maxWidth: "800px",
                                        top: "20px",
                                        left: "20px",
                                        padding: "8px 12px",
                                        backgroundColor: "black",
                                        color: "white",
                                        fontSize: "32px",
                                        fontWeight: 500,
                                        borderRadius: "4px",
                                        textWrap: "wrap",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {image.note}
                                </div>
                            }
                        </div>
                    </div>
                </div>
            ),
            buttons: [
                <Button action="post" target={{ query: { back: "true", id: imageId } }}>
                    Back
                </Button>,
            ],
            imageOptions: {
                aspectRatio: "1:1",
                width: 1080,
            }
        };
    }

    return {
        image: (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    padding: "50px",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    backgroundColor: "black",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "white",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            position: "relative",
                            overflow: "hidden",
                            display: "flex",
                        }}
                    >
                        <img
                            src={`${APP_LOCAL + image.editedImage}`}
                            alt="Aerial coastline view"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />

                        {/* Text Overlays */}
                        <div
                            style={{
                                position: "absolute",
                                top: "20px",
                                left: "20px",
                                padding: "8px 12px",
                                backgroundColor: "black",
                                color: "white",
                                fontSize: "32px",
                                fontWeight: 500,
                                borderRadius: "4px",
                            }}
                        >
                            {"Shared By: " + (image.creatorUsername ? `@${image.creatorUsername}` : `FID:${image.creatorFid}`)}
                        </div>

                        {(image.isContest || image.isPaywalled) &&
                            <div
                                style={{
                                    position: "absolute",
                                    top: "87px",
                                    left: "20px",
                                    padding: "8px 12px",
                                    backgroundColor: "black",
                                    color: "white",
                                    fontSize: "32px",
                                    fontWeight: 500,
                                    borderRadius: "4px",
                                }}
                            >
                                {image.isContest && `Contest Reward: ${image.prizeAmount} $DEGEN`}
                                {image.isPaywalled && `Reveal Fee: ${image.unlockFee} $DEGEN (via tip)`}
                            </div>
                        }
                    </div>
                </div>
            </div>
        ),
        buttons: [
            <Button action="post" target={{ query: { view: "true", id: imageId } }}>
                View
            </Button>,
            <Button action="post" target={{ query: { create: "true", id: imageId } }}>
                Create
            </Button>,
            (image.isContest && <Button action="post" target={{ query: { settings: "true", id: imageId } }}>
                ⚙️ Settings
            </Button>)
        ],
        imageOptions: {
            aspectRatio: "1:1",
            width: 1080,
        }
    };
});

export const GET = handleRequest;
export const POST = handleRequest;