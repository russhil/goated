import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// /ai and the ad-tracking endpoints carry anonymous paid traffic and skip the
// Supabase session refresh.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|ai$|api/meta/|api/cal/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)",
  ],
};
