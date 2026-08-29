"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /inkdrop/<token> saves the token on this device and redirects to /inkdrop.
export default function TokenBootstrapPage({ params }: { params: { token: string } }) {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem("inkdrop_token", params.token);
    router.replace("/inkdrop");
  }, [params.token, router]);

  return <main className="p-10 text-neutral-200">Saving token...</main>;
}
