import { Building } from './Building';
import { Boundary } from './Boundary';
import { Ground } from './Ground';
import { Tree } from './Tree';
import { BUILDINGS, TREES } from './layout';

/**
 * Assembles the town from the layout data.
 *
 * This file stays deliberately dumb: it maps specs to components and nothing
 * else, so rearranging the town means editing `layout.ts` alone.
 */
export function Town() {
  return (
    <>
      <Ground />
      <Boundary />
      {BUILDINGS.map((spec) => (
        <Building key={spec.id} spec={spec} />
      ))}
      {TREES.map((spec) => (
        <Tree key={spec.id} spec={spec} />
      ))}
    </>
  );
}
