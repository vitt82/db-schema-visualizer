import { PersistableStore } from "./PersitableStore";

import type {
  JSONTableRef,
  JSONTableTable,
  JSONTableEnum,
} from "shared/types/tableSchema";
import type { XYPosition } from "@/types/positions";

import computeElementsPositions from "@/utils/tablePositioning/computeElementsPositions";
import eventEmitter from "@/events-emitter";
import { defaultTableCoord } from "@/constants/tableCoords";

// to track tables position. react context do the job but it will
// require to have a lot of components memoization for better performance

class EnumCoordsStore extends PersistableStore<Array<[string, XYPosition]>> {
  private enumCoords = new Map<string, XYPosition>();
  private currentStoreKey = "none";

  static RESET_POS_EVENT_NAME = "enumCoords:resetEnumsPositions";

  constructor() {
    super("enumCoords");
  }

  public getCurrentStore(): Map<string, XYPosition> {
    return this.enumCoords;
  }

  public subscribeToReset(
    callback: (pos: Map<string, XYPosition>) => void,
  ): () => void {
    eventEmitter.on(EnumCoordsStore.RESET_POS_EVENT_NAME, callback);

    return () => {
      eventEmitter.off(EnumCoordsStore.RESET_POS_EVENT_NAME, callback);
    };
  }

  public resetPositions(
    tables: JSONTableTable[],
    refs: JSONTableRef[],
    enums: JSONTableEnum[] = [],
  ): void {
    const newPositions = computeElementsPositions(tables, refs, enums);
    // extract only enums positions, but preserve any existing user-set positions
    // Start from in-memory positions
    const enumsPositions = new Map<string, XYPosition>(this.enumCoords);

    // Try to recover persisted positions for the current store key and merge them (persisted take precedence)
    try {
      const recovered = this.retrieve(this.currentStoreKey) as Array<
        [string, XYPosition]
      > | null;
      if (recovered !== null && Array.isArray(recovered)) {
        const recoveredMap = new Map<string, XYPosition>(recovered);
        recoveredMap.forEach((pos, key) => {
          enumsPositions.set(key, pos);
        });
        // eslint-disable-next-line no-console
        console.debug(
          "enumCoords: merged persisted positions",
          this.currentStoreKey,
          Array.from(recoveredMap.entries()),
        );
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("enumCoords: failed to retrieve persisted positions", err);
    }

    enums.forEach((e) => {
      const existing = enumsPositions.get(e.name);
      if (existing !== undefined) return; // keep user or persisted position
      const pos = newPositions.get(e.name);
      if (pos !== undefined) enumsPositions.set(e.name, pos);
    });

    this.enumCoords = enumsPositions;
    // debug
    // eslint-disable-next-line no-console
    console.debug(
      "enumCoords: resetPositions computed",
      Array.from(enumsPositions.entries()),
    );
    eventEmitter.emit(EnumCoordsStore.RESET_POS_EVENT_NAME, enumsPositions);
  }

  public getCurrentStoreValue(): Map<string, XYPosition> {
    return this.enumCoords;
  }

  public saveCurrentStore(): void {
    // convert the map object to array before store it
    const storeValue = Array.from(this.enumCoords);

    // debug
    // eslint-disable-next-line no-console
    console.debug(
      "enumCoords: saveCurrentStore",
      this.currentStoreKey,
      storeValue,
    );
    this.persist(this.currentStoreKey, storeValue);
  }

  public switchTo(
    newStoreKey: string,
    newTables: JSONTableTable[],
    refs: JSONTableRef[],
    enums: JSONTableEnum[] = [],
  ): void {
    this.saveCurrentStore();

    this.currentStoreKey = newStoreKey;
    const recoveredStore = this.retrieve(this.currentStoreKey) as Array<
      [string, XYPosition]
    >;
    if (recoveredStore === null || !Array.isArray(recoveredStore)) {
      this.resetPositions(newTables, refs, enums);
      return;
    }

    this.enumCoords = new Map<string, XYPosition>(recoveredStore);
  }

  public getCoords(table: string): XYPosition {
    return this.enumCoords.get(table) ?? defaultTableCoord;
  }

  public setCoords(table: string, coords: XYPosition): void {
    this.enumCoords.set(table, coords);
    // Auto-save when coordinates change
    // debug
    // eslint-disable-next-line no-console
    console.debug("enumCoords: setCoords", table, coords);
    this.saveCurrentStore();
  }

  public remove(table: string): void {
    this.enumCoords.delete(table);
  }
}

export const enumCoordsStore = new EnumCoordsStore();
