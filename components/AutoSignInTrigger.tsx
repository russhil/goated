"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

// Reads ?signin=1&next=... from the URL and opens the sign-in modal,
// then strips the query params so refresh doesn't re-trigger.
export default function AutoSignInTrigger() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { openSignIn, user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) return;
    if (params.get("signin") !== "1") return;

    const next = params.get("next") || pathname;
    openSignIn(next);

    // Clean URL
    const newParams = new URLSearchParams(params.toString());
    newParams.delete("signin");
    newParams.delete("next");
    const qs = newParams.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router, openSignIn, user, loading]);

  return null;
}
