import { redirect } from "next/navigation";

// Chat moved to "/" (see src/app/page.tsx) once it became the app's index.
// Kept as a redirect so old links and bookmarks still land somewhere real.
export default function AssistantRedirectPage() {
  redirect("/");
}
