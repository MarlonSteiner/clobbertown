// Makes every resident forget everything, for starting a playtest over.
//
// The dev server keeps memories loaded, so while it is running, deleting the
// save would only be undone on its next write. This asks the running server to
// forget instead, and falls back to deleting the save when nothing is running.
import { rmSync } from 'node:fs';

try {
  const response = await fetch('http://localhost:5173/api/npc/forget', { method: 'POST' });
  if (!response.ok) throw new Error(`server answered ${response.status}`);
  console.log('Clobbertown has forgotten everything.');
} catch {
  rmSync('saves', { recursive: true, force: true });
  console.log('Dev server not running; deleted saves/ instead.');
}
