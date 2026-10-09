"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** 서버 렌더링 중에는 false, 브라우저에서 hydrate 된 뒤에는 true */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
