import { useSyncExternalStore, useRef, useEffect, useMemo, useDebugValue } from 'react';

function objectIs(x: unknown, y: unknown): boolean {
  return (x === y && (0 !== x || 1 / (x as number) === 1 / (y as number))) || (x !== x && y !== y);
}

export function useSyncExternalStoreWithSelector(
  subscribe: (callback: () => void) => () => void,
  getSnapshot: () => unknown,
  getServerSnapshot: (() => unknown) | undefined,
  selector: (nextSnapshot: unknown) => unknown,
  isEqual?: (a: unknown, b: unknown) => boolean
) {
  const instRef = useRef<{ hasValue: boolean; value: unknown } | null>(null);
  
  if (instRef.current === null) {
    instRef.current = { hasValue: false, value: null };
  }
  
  const inst = instRef.current;

  const hasMemoRef = useRef(false);
  const memoizedSnapshotRef = useRef<unknown>(null);
  const memoizedSelectionRef = useRef<unknown>(null);

  const instMemo = useMemo(() => {
    function memoizedSelector(nextSnapshot: unknown) {
      if (!hasMemoRef.current) {
        hasMemoRef.current = true;
        memoizedSnapshotRef.current = nextSnapshot;
        nextSnapshot = selector(nextSnapshot);
        if (isEqual !== undefined && inst.hasValue) {
          const currentSelection = inst.value;
          if (isEqual(currentSelection, nextSnapshot)) {
            return (memoizedSelectionRef.current = currentSelection);
          }
        }
        return (memoizedSelectionRef.current = nextSnapshot);
      }
      const currentSelection = memoizedSelectionRef.current;
      if (objectIs(memoizedSnapshotRef.current, nextSnapshot)) return currentSelection;
      const nextSelection = selector(nextSnapshot);
      if (isEqual !== undefined && isEqual(currentSelection, nextSelection)) {
        memoizedSnapshotRef.current = nextSnapshot;
        return currentSelection;
      }
      memoizedSnapshotRef.current = nextSnapshot;
      return (memoizedSelectionRef.current = nextSelection);
    }

    const maybeGetServerSnapshot = getServerSnapshot === undefined ? null : getServerSnapshot;

    return [
      () => memoizedSelector(getSnapshot()),
      maybeGetServerSnapshot === null ? (() => undefined) : () => memoizedSelector(maybeGetServerSnapshot()),
    ];
  }, [getSnapshot, getServerSnapshot, selector, isEqual]);

  const value = useSyncExternalStore(subscribe, instMemo[0], instMemo[1]);

  useEffect(() => {
    inst.hasValue = true;
    inst.value = value;
  }, [value]);

  useDebugValue(value);

  return value;
}