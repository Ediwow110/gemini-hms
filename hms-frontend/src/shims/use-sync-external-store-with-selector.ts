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

  const instMemo = useMemo(() => {
    let hasMemo = false;
    let memoizedSnapshot: unknown;
    let memoizedSelection: unknown;

    function memoizedSelector(nextSnapshot: unknown) {
      if (!hasMemo) {
        hasMemo = true;
        memoizedSnapshot = nextSnapshot;
        nextSnapshot = selector(nextSnapshot);
        if (isEqual !== undefined && inst.hasValue) {
          const currentSelection = inst.value;
          if (isEqual(currentSelection, nextSnapshot)) {
            return (memoizedSelection = currentSelection);
          }
        }
        return (memoizedSelection = nextSnapshot);
      }
      const currentSelection = memoizedSelection;
      if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
      const nextSelection = selector(nextSnapshot);
      if (isEqual !== undefined && isEqual(currentSelection, nextSelection)) {
        memoizedSnapshot = nextSnapshot;
        return currentSelection;
      }
      memoizedSnapshot = nextSnapshot;
      return (memoizedSelection = nextSelection);
    }

    const maybeGetServerSnapshot = getServerSnapshot === undefined ? null : getServerSnapshot;

    return [
      () => memoizedSelector(getSnapshot()),
      maybeGetServerSnapshot === null ? undefined : () => memoizedSelector(maybeGetServerSnapshot()),
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