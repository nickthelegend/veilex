import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VEILEX Finance",
    short_name: "VEILEX",
    description: "Private consumer credit on Sui — BNPL, lend/borrow, and a confidential TEE credit score.",
    start_url: "/",
    display: "standalone",
    background_color: "#05080f",
    theme_color: "#a6f24a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
