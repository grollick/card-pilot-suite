import { useCallback, useEffect, useState } from "react";

const KEY = "guzzl_show_all_tools";
const EVENT = "guzzl:show-all-tools";

function read(): boolean {
  try { return localStorage.getItem(KEY) === "true"; } catch { return false; }
}

/** Sidebar "More tools" preference, stored in localStorage and synced across components. */
export function useShowAllTools(): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState(read);
  useEffect(() => {
    const sync = () => setValue(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const update = useCallback((v: boolean) => {
    try { localStorage.setItem(KEY, String(v)); } catch { /* ignore */ }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [value, update];
}
