import { ImageResponse } from "next/og"

export const size = {
  width: 32,
  height: 32,
}
export const contentType = "image/png"

export default function Icon() {
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
          borderRadius: 6,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 6V26"
            stroke="#00E5FF"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M10 16L22 6"
            stroke="#00E5FF"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M10 16L22 26"
            stroke="#00E5FF"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="16" cy="16" r="2.5" fill="#00E5FF" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
