import PracticeView from "./PracticeView";
import DevPanel from "./redesign/DevPanel";

// ?redesign (optionally =a|b|c) swaps in the mockup attempts + dev switcher.
export default function PracticePage({
  searchParams,
}: {
  searchParams: { redesign?: string };
}) {
  if (searchParams.redesign !== undefined) return <DevPanel initial={searchParams.redesign} />;
  return <PracticeView />;
}
