import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "KORE - Complete CRM Marketing Suite"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f1a4a",
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.1) 0%, transparent 50%)",
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "linear-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="#0046E2"
              fillOpacity="0.15"
              stroke="#0046E2"
              strokeWidth="1"
            />
            <path
              d="M18 12L18 36"
              stroke="#0046E2"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M18 24L30 12"
              stroke="#0046E2"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M18 24L30 36"
              stroke="#0046E2"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="24" cy="24" r="3" fill="#0046E2" />
          </svg>
        </div>

        {/* Brand name */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          KORE
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#0046E2",
            marginBottom: 8,
          }}
        >
          The origin of everything.
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#A1A1AA",
          }}
        >
          Complete CRM Marketing Suite
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
