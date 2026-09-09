import type { Metadata } from "next";
import PlanView from "./PlanView";

export const metadata: Metadata = { title: "Practice Plan · Guitar" };

export default function PlanPage() {
  return <PlanView />;
}
