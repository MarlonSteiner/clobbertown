import { useGLTF } from '@react-three/drei';
import { Building } from './Building';
import { Boundary } from './Boundary';
import { Ground } from './Ground';
import { Tree } from './Tree';
import { BUILDINGS, TREES } from './layout';
import { MODEL_BASE } from './useModel';

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

/* Start fetching every model as soon as this module is imported, rather than
   when each building first renders. The models are what the loading screen is
   waiting for, so fetching them in parallel is the difference between one wait
   and twenty-six sequential ones. Duplicate paths collapse in the cache. */
for (const path of new Set([...BUILDINGS, ...TREES].map((spec) => spec.model))) {
  useGLTF.preload(MODEL_BASE + path);
}
