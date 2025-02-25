import { fetchMetadata } from "frames.js/next";
import { APP_URL } from "./constants";

export async function generateMetadata() {  
  return {
    title: "Degen Obfuscator",
    // provide a full URL to your /frames endpoint
    other: await fetchMetadata(
      new URL(
        "/frame/frames",
        APP_URL
      )
    ),
  };
}

export default function Page() {
  return <span>Image Obfuscator Frame. Use the "Create" button on the frame to create a new obfuscated image.</span>;
}