import { useParams } from "react-router-dom";
import SeoLandingPage from "@/modules/public/pages/SeoLandingPage";
import PublicCard from "@/modules/public/pages/PublicCard";

/**
 * Smart router: if the slug matches "profession-in-city" pattern,
 * render the SEO landing page. Otherwise, render the public card.
 */
export default function HandleOrSeoRoute() {
  const { handle } = useParams<{ handle: string }>();

  if (handle && /^.+-in-.+$/.test(handle)) {
    return <SeoLandingPage />;
  }

  return <PublicCard />;
}
