import LandingPage from "@/components/landing/LandingPage";

// Pre-quiz landing (Apple Light system). Client component reads localStorage
// user-state, so render dynamically rather than statically prerendering.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "5 for 5 · Daily Sneaker Quiz",
  description: "Five questions. One shot a day. Speed breaks ties.",
};

export default function HomeLandingPage() {
  return <LandingPage />;
}
