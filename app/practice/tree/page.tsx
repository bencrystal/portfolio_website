import type { Metadata } from "next";
import TreeView from "./TreeView";

export const metadata: Metadata = { title: "Skill tree · Guitar Practice" };

export default function TreePage() {
  return <TreeView />;
}
