import { createFrames } from "frames.js/next";
import { farcasterHubContext } from "frames.js/middleware";

import { APP_URL } from "../constants";

export const frames = createFrames({
    basePath: "/frame/frames",
    baseUrl: APP_URL,
    middleware: [
        farcasterHubContext({
          ...(process.env.NODE_ENV === "production"
            ? {
              hubHttpUrl: "https://hub.pinata.cloud"
            }
            : {
              hubHttpUrl: "http://localhost:3010/hub",
            }),
        }),
      ]
});