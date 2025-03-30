function getStorage<T = any>(key: string): Promise<T> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
}

function setStorage(obj: object): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(obj, () => {
      resolve();
    });
  });
}

function groupBy<T>(
  items: T[],
  keyGetter: (item: T) => any
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const item of items) {
    const rawKey = keyGetter(item);
    const key = String(rawKey ?? "未分類");
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  }
  return grouped;
}

export { getStorage, setStorage, groupBy };
