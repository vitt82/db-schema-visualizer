import { PersistableStore } from "./PersitableStore";

import type { JSONTableRef, JSONTableTable } from "shared/types/tableSchema";
import type { XYPosition } from "@/types/positions";

import computeTablesPositions from "@/utils/tablePositioning/computeTablesPositions";
import eventEmitter from "@/events-emitter";
import { defaultTableCoord } from "@/constants/tableCoords";

// to track tables position. react context do the job but it will
// require to have a lot of components memoization for better performance

class TableCoordsStore extends PersistableStore<Array<[string, XYPosition]>> {
  private tableCoords = new Map<string, XYPosition>();
  private currentStoreKey = "none";

  static RESET_POS_EVENT_NAME = "tableCoords:resetTablesPositions";

  constructor() {
    super("tableCoords");
  }

  public getCurrentStore(): Map<string, XYPosition> {
    return this.tableCoords;
  }

  public subscribeToReset(
    callback: (pos: Map<string, XYPosition>) => void,
  ): () => void {
    eventEmitter.on(TableCoordsStore.RESET_POS_EVENT_NAME, callback);

    return () => {
      eventEmitter.off(TableCoordsStore.RESET_POS_EVENT_NAME, callback);
    };
  }

  public resetPositions(tables: JSONTableTable[], refs: JSONTableRef[]): void {
    const computed = computeTablesPositions(tables, refs);

    // Start from in-memory positions
    const merged = new Map<string, XYPosition>(this.tableCoords);

    // Try to recover persisted positions for the current store key and merge them (persisted take precedence)
    try {
      const recovered = this.retrieve(this.currentStoreKey) as Array<
        [string, XYPosition]
      > | null;
      if (recovered !== null && Array.isArray(recovered)) {
        const recoveredMap = new Map<string, XYPosition>(recovered);
        recoveredMap.forEach((pos, key) => {
          merged.set(key, pos);
        });
        // eslint-disable-next-line no-console
        console.debug(
          "tableCoords: merged persisted positions",
          this.currentStoreKey,
          Array.from(recoveredMap.entries()),
        );
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("tableCoords: failed to retrieve persisted positions", err);
    }

    // Fill missing positions (new tables) from computed layout
    tables.forEach((t) => {
      if (!merged.has(t.name)) {
        const pos = computed.get(t.name);
        if (pos !== undefined) merged.set(t.name, pos);
      }
    });

    this.tableCoords = merged;
    eventEmitter.emit(TableCoordsStore.RESET_POS_EVENT_NAME, merged);
  }

  public getCurrentStoreValue(): Map<string, XYPosition> {
    return this.tableCoords;
  }

  public saveCurrentStore(): void {
    // convert the map object to array before store it
    const storeValue = Array.from(this.tableCoords);

    this.persist(this.currentStoreKey, storeValue);
  }

  public switchTo(
    newStoreKey: string,
    newTables: JSONTableTable[],
    refs: JSONTableRef[],
  ): void {
    this.saveCurrentStore();

    this.currentStoreKey = newStoreKey;
    const recoveredStore = this.retrieve(this.currentStoreKey) as Array<
      [string, XYPosition]
    >;
    if (recoveredStore === null || !Array.isArray(recoveredStore)) {
      this.resetPositions(newTables, refs);
      return;
    }

    this.tableCoords = new Map<string, XYPosition>(recoveredStore);
  }

  public getCoords(table: string): XYPosition {
    return this.tableCoords.get(table) ?? defaultTableCoord;
  }

  public setCoords(table: string, coords: XYPosition): void {
    this.tableCoords.set(table, coords);
    // Auto-save when coordinates change
    this.saveCurrentStore();
  }

  public remove(table: string): void {
    this.tableCoords.delete(table);
  }
}

export const tableCoordsStore = new TableCoordsStore();
