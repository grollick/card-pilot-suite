import LandingPageManager from "@/modules/admin/pages/LandingPageManager";

export default function UserPageBuilder() {
  return <LandingPageManager adminOnly={false} />;
}
