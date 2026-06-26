import { ImageResponse } from "next/og";

/* OG unfurl for the challenge link (/c) — what iMessage/WhatsApp/X render.
   Dark field + LED dot texture (pure CSS — no WebGL here), the 5 FOR 5
   scoreboard lockup, and the dare in signal green. */

export const alt = "You've been challenged · Complex 5 for 5";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SIGNAL = "#00FF85";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          backgroundImage:
            "radial-gradient(circle at 15px 15px, rgba(0,255,133,0.38) 9%, transparent 10%)",
          backgroundSize: "30px 30px",
          color: "#fff",
          fontWeight: 700,
        }}
      >
        {/* badge lockup */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            border: "5px solid #fff",
            background: "#000",
            padding: "0",
            marginBottom: 48,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: 0,
              padding: "10px 38px",
              borderBottom: "5px solid #fff",
            }}
          >
            COMPLEX
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "12px 38px",
              fontSize: 44,
              fontWeight: 700,
              color: SIGNAL,
            }}
          >
            5<span style={{ color: "#fff", fontSize: 22 }}>FOR</span>5
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 700,
            color: SIGNAL,
            letterSpacing: 0,
            textAlign: "center",
          }}
        >
          {"YOU'VE BEEN CHALLENGED"}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontSize: 32,
            fontWeight: 700,
            color: "rgba(255,255,255,0.72)",
          }}
        >
          {"Today's quiz · five questions · one shot"}
        </div>
      </div>
    ),
    { ...size },
  );
}
