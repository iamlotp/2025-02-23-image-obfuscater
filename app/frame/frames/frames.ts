import { createFrames } from "frames.js/next";
import { APP_URL } from "../constants";

export const frames = createFrames({
    basePath: "/frame/frames",
    baseUrl: APP_URL,
});