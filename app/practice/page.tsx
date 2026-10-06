import ToolsView from "./ToolsView";
import ToolsDevPanel from "./tools/DevPanel";

// /practice is the tools-only landing (metronome, key, tuner, backing tracks);
// the full log moved to /practice/log. ?redesign (optionally =a|b|c) shows the
// design variants with a floating switcher.
export default function PracticePage({ searchParams }: { searchParams: { redesign?: string } }) {
  if (searchParams.redesign !== undefined) return <ToolsDevPanel initial={searchParams.redesign} />;
  return <ToolsView />;
}
