import { useEffect, useState } from 'react';
import { currentHour, formatClock } from '../world/clock';

/**
 * The time of day in the corner of the screen.
 *
 * Refreshed once a second rather than every frame: the minute on screen only
 * changes that often, and redrawing it sixty times a second would be wasted.
 */
export function ClockReadout() {
  const [time, setTime] = useState(() => formatClock(currentHour()));

  useEffect(() => {
    const id = window.setInterval(() => setTime(formatClock(currentHour())), 1000);
    return () => window.clearInterval(id);
  }, []);

  return <span className="clock">{time}</span>;
}
