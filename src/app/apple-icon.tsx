import { ImageResponse } from "next/og"

export const size = {
  width: 180,
  height: 180,
}
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: "#0B0B0B",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 36,
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 8V40"
            stroke="#00E5FF"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M18 24L34 8"
            stroke="#00E5FF"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M18 24L34 40"
            stroke="#00E5FF"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="24" cy="24" r="4" fill="#00E5FF" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
