import type Storage from "@/types/storage";

import { AppLocalStorage } from "@/storages/local";

export class PersistableStore<T> {
  private readonly storeName: string;
  private readonly storage: Storage<T>;

  constructor(storeName: string, storage?: Storage<T>) {
    this.storeName = storeName;
    this.storage = storage ?? new AppLocalStorage<T>();
  }

  createPersistanceKey(key: string): string {
    return `${this.storeName}:${key}`;
  }

  persist(name: string, value: T): void {
    const persistanceKey = this.createPersistanceKey(name);

    // debug persist
    // eslint-disable-next-line no-console
    console.debug("PersistableStore.persist", persistanceKey, value);
    this.storage.setItem(persistanceKey, value);
  }

  retrieve(name: string): object | null {
    const persistanceKey = this.createPersistanceKey(name);

    // debug retrieve
    // eslint-disable-next-line no-console
    console.debug("PersistableStore.retrieve", persistanceKey);
    return this.storage.getItem(persistanceKey);
  }

  clear(name: string): void {
    const persistanceKey = this.createPersistanceKey(name);

    this.storage.removeItem(persistanceKey);
  }
}
