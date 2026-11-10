import { useCallback, useState, useEffect } from 'react';

/**
 * State kept in localStorage / sessionStorage
 * The first render always uses the default (same as the server render, no hydration mismatch),
 * the saved value is loaded right after mount
 */
function useStorage(storageName, key, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const jsonValue = window[storageName].getItem(key);
      if (jsonValue != null) setValue(JSON.parse(jsonValue));
    } catch (e) {
      //storage blocked or bad json, keep the default
    }
    setLoaded(true);
  }, [storageName, key]);

  //only write after loading, else the default would overwrite the saved value
  useEffect(() => {
    if (!loaded) return;
    try {
      if (value === undefined) window[storageName].removeItem(key);
      else window[storageName].setItem(key, JSON.stringify(value));
    } catch (e) {
      //storage blocked, keep it in memory only
    }
  }, [storageName, key, value, loaded]);

  const remove = useCallback(() => {
    setValue(undefined);
  }, []);

  return [value, setValue, remove, loaded];
}

export function useLocalStorage(key, defaultValue) {
  return useStorage('localStorage', key, defaultValue);
}

export function useSessionStorage(key, defaultValue) {
  return useStorage('sessionStorage', key, defaultValue);
}
