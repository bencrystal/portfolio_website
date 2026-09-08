import PracticeView from "./PracticeView";
import DevPanel from "./redesign/DevPanel";

// ?redesign (optionally =a|b|c|d) swaps in the mockup attempts + dev switcher;
// ?classic keeps the pre-redesign layout reachable until sign-off.
export default function PracticePage({
  searchParams,
}: {
  searchParams: { redesign?: string; classic?: string };
}) {
  if (searchParams.redesign !== undefined) return <DevPanel initial={searchParams.redesign} />;
  return <PracticeView classic={searchParams.classic !== undefined} />;
}
