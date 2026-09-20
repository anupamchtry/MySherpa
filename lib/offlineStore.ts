import type { OfflineRoutePackage, Warning } from "@/lib/models";

const DB_NAME = "my-sherpa-offline";
const DB_VERSION = 1;

let databasePromise: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  databasePromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("reports")) db.createObjectStore("reports", { keyPath: "id" });
      if (!db.objectStoreNames.contains("routes")) db.createObjectStore("routes", { keyPath: "trekId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Offline storage could not be opened."));
    request.onblocked = () => reject(new Error("Offline storage is blocked by another app tab."));
  });
  return databasePromise;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Offline storage request failed."));
  });
}

export async function getStoredWarnings(): Promise<Warning[]> {
  const db = await openDatabase();
  return await requestResult(db.transaction("reports", "readonly").objectStore("reports").getAll()) as Warning[];
}

export async function saveWarning(warning: Warning): Promise<void> {
  const db = await openDatabase();
  await requestResult(db.transaction("reports", "readwrite").objectStore("reports").put(warning));
}

export async function saveRoutePackage(routePackage: OfflineRoutePackage): Promise<void> {
  const db = await openDatabase();
  await requestResult(db.transaction("routes", "readwrite").objectStore("routes").put(routePackage));
}

export async function getRoutePackage(trekId: string): Promise<OfflineRoutePackage | undefined> {
  const db = await openDatabase();
  return await requestResult(db.transaction("routes", "readonly").objectStore("routes").get(trekId)) as OfflineRoutePackage | undefined;
}

export function cacheOfflineAssets(): void {
  navigator.serviceWorker?.controller?.postMessage({ type: "CACHE_ABC_PACKAGE" });
}
