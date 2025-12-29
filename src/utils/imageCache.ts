// [IN]: @/types (WorkflowNode, WorkflowNodeData)
// [OUT]: saveNodeImageData, loadNodeImageData, loadAllNodeImageData, deleteNodeImageData, clearAllNodeImageData
// [POS]: IndexedDB persistence layer for node images / 节点图像的 IndexedDB 持久化层
// Protocol: When updated, sync this header + parent .folder.md
// 协议：更新本文件时，同步本头注释与上级 .folder.md

"use client";

import { WorkflowNode, WorkflowNodeData } from "@/types";

const DB_NAME = "node-banana-image-cache";
const STORE_NAME = "node-images";
const DB_VERSION = 1;

type NodeImagePayload = {
  type: WorkflowNode["type"];
  data: Partial<WorkflowNodeData>;
};

let dbPromise: Promise<IDBDatabase | null> | null = null;

const isBrowser = typeof window !== "undefined" && typeof indexedDB !== "undefined";

function openDatabase(): Promise<IDBDatabase | null> {
  if (!isBrowser) {
    return Promise.resolve(null);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error("[imageCache] Failed to open IndexedDB", request.error);
      resolve(null);
    };

    request.onblocked = () => {
      console.warn("[imageCache] IndexedDB open request blocked");
    };
  });

  return dbPromise;
}

async function withStore<T>(mode: IDBTransactionMode, handler: (store: IDBObjectStore) => void): Promise<T | null> {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    handler(store);

    tx.oncomplete = () => resolve(null);
    tx.onerror = () => {
      console.error("[imageCache] transaction error", tx.error);
      reject(tx.error);
    };
    tx.onabort = () => reject(tx.error);
  });
}

export async function saveNodeImageData(nodeId: string, payload: NodeImagePayload | null) {
  if (!payload) {
    await deleteNodeImageData(nodeId);
    return;
  }

  await withStore("readwrite", (store) => {
    store.put({ id: nodeId, ...payload });
  }).catch((error) => {
    console.error("[imageCache] Failed to save node image data", error);
  });
}

export async function loadNodeImageData(nodeId: string): Promise<NodeImagePayload | null> {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(nodeId);

    request.onsuccess = () => {
      resolve(request.result ?? null);
    };

    request.onerror = () => {
      console.error("[imageCache] Failed to read node image data", request.error);
      resolve(null);
    };
  });
}

export async function loadAllNodeImageData(nodeIds: string[]): Promise<Record<string, NodeImagePayload>> {
  const result: Record<string, NodeImagePayload> = {};
  const db = await openDatabase();
  if (!db) return result;

  await Promise.all(
    nodeIds.map((id) => {
      return new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => {
          if (request.result) {
            result[id] = request.result as NodeImagePayload;
          }
          resolve();
        };
        request.onerror = () => {
          resolve();
        };
      });
    })
  );

  return result;
}

export async function deleteNodeImageData(nodeId: string) {
  await withStore("readwrite", (store) => {
    store.delete(nodeId);
  }).catch((error) => {
    console.error("[imageCache] Failed to delete node image data", error);
  });
}

export async function clearAllNodeImageData() {
  await withStore("readwrite", (store) => {
    store.clear();
  }).catch((error) => {
    console.error("[imageCache] Failed to clear node image data", error);
  });
}

export type { NodeImagePayload };
