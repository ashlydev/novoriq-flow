import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(160deg, #1d3136 0%, #132226 55%, #101a1d 100%)",
          borderRadius: 120,
          position: "relative",
          color: "#f8f3e9"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 48,
            borderRadius: 104,
            border: "8px solid rgba(248, 243, 233, 0.12)"
          }}
        />
        <div
          style={{
            fontSize: 260,
            fontWeight: 800,
            letterSpacing: -16,
            color: "#d7b66b",
            lineHeight: 1
          }}
        >
          F
        </div>
      </div>
    ),
    size
  );
}
