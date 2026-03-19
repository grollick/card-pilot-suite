import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * Redirects /ref/:code to /auth?ref=CODE&mode=signup
 */
export default function ReferralRedirect() {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/auth?ref=${code}&mode=signup`, { replace: true });
  }, [code, navigate]);

  return null;
}
