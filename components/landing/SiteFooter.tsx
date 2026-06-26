"use client";

/* Complex site footer — SMPLX Design System "Footer / Platform=Desktop|Mobile,
   Mode=Dark" (Figma 1Op9CRCbOrgAt4yzR2yGWe, node 465-3008), ported to CSS
   Modules. Mounted across the quiz experience so players always have a path
   back to Complex.com. Links point at the real site; the newsletter input is
   a demo (confirms inline, no backend). */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./SiteFooter.module.css";

const DISCOVER = [
  ["Style", "https://www.complex.com/style"],
  ["Music", "https://www.complex.com/music"],
  ["Sneakers", "https://www.complex.com/sneakers"],
  ["Pop Culture", "https://www.complex.com/pop-culture"],
  ["Sport", "https://www.complex.com/sports"],
  ["Life", "https://www.complex.com/life"],
  ["Shows", "https://www.complex.com/shows"],
  ["ComplexCON", "https://complexcon.com"],
  ["Family style", "https://www.complex.com/family-style"],
] as const;

const SHOP = [
  ["Shop", "https://shop.complex.com"],
  ["Drops", "https://shop.complex.com/collections/drops"],
  ["Support", "https://shop.complex.com/pages/support"],
  ["Shipping Policy", "https://shop.complex.com/pages/shipping-policy"],
  ["Refund Policy", "https://shop.complex.com/pages/refund-policy"],
] as const;

const WORK = [
  ["Careers", "https://www.complex.com/careers"],
  ["Advertise", "https://www.complex.com/advertise"],
  ["Contact Us", "https://www.complex.com/contact"],
] as const;

const LEGAL = [
  "Terms & Conditions",
  "Privacy Policy",
  "California Privacy",
  "Public Notice",
  "Accessibility",
  "Sitemap",
  "Cookies",
] as const;

const SOCIALS = [
  ["facebook", "Facebook", "https://www.facebook.com/complex"],
  ["x", "X", "https://x.com/complex"],
  ["whatsapp", "WhatsApp", "https://www.whatsapp.com/channel/complex"],
  ["instagram", "Instagram", "https://www.instagram.com/complex"],
  ["youtube", "YouTube", "https://www.youtube.com/complex"],
  ["snapchat", "Snapchat", "https://www.snapchat.com/add/complex"],
  ["tiktok", "TikTok", "https://www.tiktok.com/@complex"],
] as const;

function LinkColumn({
  heading,
  links,
}: {
  heading: string;
  links: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <div className={styles.col}>
      <span className={styles.colHead}>{heading}</span>
      <ul className={styles.colList}>
        {links.map(([label, href]) => (
          <li key={label}>
            <a href={href} className={styles.colLink}>
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [signedUp, setSignedUp] = useState(false);

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Section 1 — wordmark + socials */}
        <div className={styles.brandRow}>
          <a href="https://www.complex.com" aria-label="Complex.com">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/figma/footer/complex-wordmark-white.svg" alt="COMPLEX" className={styles.wordmark} />
          </a>
          <div className={styles.socials}>
            <span className={styles.followOn}>FOLLOW ON</span>
            <div className={styles.socialIcons}>
              {SOCIALS.map(([key, label, href]) => (
                <a key={key} href={href} aria-label={label} className={styles.socialIcon}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/figma/footer/social-${key}.svg`} alt="" aria-hidden />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Section 2 — link columns + newsletter */}
        <div className={styles.linksRow}>
          <div className={styles.cols}>
            <LinkColumn heading="Discover" links={DISCOVER} />
            <LinkColumn heading="Shop" links={SHOP} />
            <LinkColumn heading="Work With Us" links={WORK} />
          </div>
          <form
            className={styles.newsletter}
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) setSignedUp(true);
            }}
          >
            <span className={styles.newsletterHead}>SIGN UP FOR THE NEWSLETTER</span>
            <div className={styles.emailRow}>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSignedUp(false); }}
                placeholder="ENTER YOUR EMAIL"
                aria-label="Email address"
                className={styles.emailInput}
              />
              <button type="submit" className={styles.emailBtn}>
                {signedUp ? "YOU'RE IN" : "GET NOTIFIED"}
              </button>
            </div>
            <span className={styles.newsletterFine}>
              BY SIGNING UP, YOU AGREE TO OUR TERMS AND PRIVACY POLICY
            </span>
          </form>
        </div>

        <div className={styles.divider} />

        {/* Section 3 — legal links + region */}
        <div className={styles.legalRow}>
          <ul className={styles.legalLinks}>
            {LEGAL.map((label) => (
              <li key={label}>
                <a href="https://www.complex.com" className={styles.legalLink}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <button type="button" className={styles.region} aria-label="Region: United States">
            UNITED STATES
            <ChevronDown size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className={styles.divider} />

        {/* Section 4 — copyright + accessibility */}
        <div className={styles.bottomRow}>
          <p className={styles.copyright}>
            COMPLEX participates in various affiliate marketing programs, which means COMPLEX gets
            paid commissions on purchases made through our links to retailer sites. Our editorial
            content is not influenced by any commissions we receive. © Complex Media, Inc. All
            Rights Reserved.
          </p>
          <a href="https://www.complex.com/accessibility" className={styles.a11y}>
            <span className={styles.a11yBadge} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/figma/footer/accessibility-glyph.svg" alt="" />
            </span>
            ACCESSIBILITY
          </a>
        </div>
      </div>
    </footer>
  );
}
