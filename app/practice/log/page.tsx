import PracticeView from "../PracticeView";
import DevPanel from "../redesign/DevPanel";

// The full practice log (exercises, sessions, charts). The tools-only page
// now fronts /practice; this keeps the logging UI reachable for existing users.
// ?redesign (optionally =a|b|c|d) swaps in the mockup attempts + dev switcher;
// ?classic keeps the pre-redesign layout reachable until sign-off.
export default function PracticeLogPage({
  searchParams,
}: {
  searchParams: { redesign?: string; classic?: string };
}) {
  if (searchParams.redesign !== undefined) return <DevPanel initial={searchParams.redesign} />;
  return <PracticeView classic={searchParams.classic !== undefined} />;
}
