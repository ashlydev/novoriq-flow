import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
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
          borderRadius: 44,
          position: "relative",
          color: "#f8f3e9"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 20,
            borderRadius: 36,
            border: "3px solid rgba(248, 243, 233, 0.16)"
          }}
        />
        <div
          style={{
            fontSize: 92,
            fontWeight: 800,
            letterSpacing: -6,
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
