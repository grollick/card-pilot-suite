import { useIsAdmin } from "@/hooks/useAdminStats";
import ScreenshotTool from "@/components/ScreenshotTool";

export default function AdminScreenshotTool() {
  const { data: isAdmin } = useIsAdmin();
  if (!isAdmin) return null;
  return <ScreenshotTool />;
}
