"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Legacy link: /list/<token> saves the token on this device and
// redirects to the clean /list URL.
export default function TokenBootstrapPage({ params }: { params: { token: string } }) {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem("scribe_list_token", params.token);
    router.replace("/list");
  }, [params.token, router]);

  return <main className="p-10 text-neutral-200">Saving token...</main>;
}
