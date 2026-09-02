import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import { isBackendReady } from '../services/attendanceService';

export interface AttendanceDataState<T> {
  /** Real data resolved from the attendance service ([] until backend is live). */
  data: T;
  /** True while the service is loading (either probing the backend or fetching). */
  loading: boolean;
  /** True once the backend API has been detected and is reachable. */
  backendReady: boolean;
  /** Manually re-run the loader (e.g. after a page refresh or data mutation). */
  refresh: () => void;
}

/**
 * Drives every attendance chart:
 *  - Probes the backend through `attendanceService`.
 *  - While the API is unreachable it resolves to the empty initial value, so
 *    charts render their empty state instead of fake data.
 *  - Keeps re-probing every few seconds so the charts go live automatically
 *    (no code change, no reload) the moment the backend starts responding.
 */
export function useAttendanceData<T>(
  loader: () => Promise<T>,
  deps: DependencyList
): AttendanceDataState<T> {
  const emptyRef = useRef<T>([] as unknown as T);
  const empty = emptyRef.current;
  const [data, setData] = useState<T>(empty);
  const [loading, setLoading] = useState<boolean>(true);
  const [backendReady, setBackendReady] = useState<boolean>(false);
  const runIdRef = useRef(0);
  const firstRunRef = useRef(true);

  const run = useCallback(async (forceProbe = false): Promise<void> => {
    const runId = ++runIdRef.current;
    if (firstRunRef.current) setLoading(true);

    const ready = await isBackendReady(forceProbe);
    if (runId !== runIdRef.current) return;
    firstRunRef.current = false;
    setBackendReady(ready);

    if (!ready) {
      setData(empty);
      setLoading(false);
      return;
    }

    const result = await loader();
    if (runId !== runIdRef.current) return;
    setData(result);
    setLoading(false);
  }, [loader, empty]);

  useEffect(() => {
    firstRunRef.current = true;
    run();
    // Re-run whenever the requested scope changes (user id, department, month...).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // While the backend is offline, keep probing so charts switch to live data
  // automatically the moment the API becomes reachable.
  useEffect(() => {
    if (backendReady) return;
    const timer = setInterval(() => {
      run(true);
    }, 20000);
    return () => clearInterval(timer);
  }, [backendReady, run]);

  const refresh = useCallback(() => {
    run(true);
  }, [run]);

  return { data, loading, backendReady, refresh };
}