import { SiteFooter } from "@/components/landing/SiteFooter";

/* QA preview — the SMPLX dark footer in isolation (joins /preview/badge-rays
   and /preview/pixel-test). */

export default function FooterPreview() {
  return (
    <main style={{ minHeight: "40vh", background: "#000" }}>
      <SiteFooter />
    </main>
  );
}
