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

export { getStorage, setStorage };
