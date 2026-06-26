import type { Metadata } from "next";
import { EditorialLayout } from "@/components/layouts/EditorialLayout";

/* Challenge deep link. The whole point of this route is the unfurl: when the
   copied link lands in iMessage/WhatsApp, the preview reads as a dare —
   "You've been challenged" + the OG image — before anyone taps it. In-app it
   is the normal home cabinet with a challenge banner. */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "You've been challenged · Complex 5 for 5",
  description: "Five sneaker questions. One shot. They think they can beat you.",
  openGraph: {
    title: "You've been challenged 👀",
    description: "Today's Complex 5 for 5. Five sneaker questions, one shot.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "You've been challenged 👀",
    description: "Today's Complex 5 for 5. Five sneaker questions, one shot.",
  },
};

export default function ChallengePage() {
  return <EditorialLayout challenged />;
}
