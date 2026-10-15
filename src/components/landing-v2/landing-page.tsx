import { MetaPixel } from "@/components/analytics/meta-pixel";
import { LandingHeader } from "./landing-header";
import { LandingHero } from "./landing-hero";
import { BenefitsSection, PricingSection, StepsSection, SupportSection } from "./landing-sections";
import { TutorialSection } from "./tutorial-section";
import { SocialProof } from "./social-proof";
import { FaqSection } from "./faq-section";
import { ContactSection } from "./contact-section";
import { LandingFooter } from "./landing-footer";
import "./landing.css";

export function LandingPage() {
  return <div className="lp"><MetaPixel trackViewContent={false} />{/* Microsoft Clarity: insertar aquí el componente/script oficial cuando se defina el project ID. */}<LandingHeader /><main><LandingHero /><BenefitsSection /><StepsSection /><SupportSection /><PricingSection /><TutorialSection /><SocialProof /><FaqSection /><ContactSection /></main><LandingFooter /></div>;
}
