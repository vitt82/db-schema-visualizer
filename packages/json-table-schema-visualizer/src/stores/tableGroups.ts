import { PersistableStore } from "./PersitableStore";

import type { JSONTableGroup } from "shared/types/tableGroup";

import eventEmitter from "@/events-emitter";

interface GroupDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

class TableGroupsStore extends PersistableStore<Array<[string, JSONTableGroup & GroupDimensions]>> {
  private groups = new Map<string, JSONTableGroup & GroupDimensions>();
  private currentStoreKey: string | null = null;

  static GROUPS_CHANGED_EVENT = "tableGroups:changed";

  constructor() {
    super("tableGroups");
  }

  // Be tolerant with old persisted formats:
  // - current format: Array<[id, group]>
  // - possible legacy A: Array<group> (with group.id)
  // - possible legacy B: Record<id, group>
  private normalizeToEntries(
    value: unknown,
  ): Array<[string, JSONTableGroup & GroupDimensions]> {
    if (Array.isArray(value)) {
      if (value.length === 0) return [];
      const first = value[0] as unknown;
      // tuple-like [id, obj]
      if (
        Array.isArray(first) &&
        first.length === 2 &&
        typeof first[0] === "string" &&
        typeof first[1] === "object" &&
        first[1] !== null
      ) {
        return (value as Array<[string, JSONTableGroup & GroupDimensions]> )
          .filter((t: [string, JSONTableGroup & GroupDimensions]) => Array.isArray(t) && t.length === 2 && typeof t[0] === "string");
      }
      // array of objects with .id
      const asObjs = value.filter((v) => typeof v === "object" && v !== null) as Array<JSONTableGroup & Partial<GroupDimensions>>;
      if (asObjs.length === value.length) {
        return asObjs
          .filter((g) => typeof (g as any).id === "string")
          .map((g) => [ (g as any).id as string, {
            ...(g as JSONTableGroup),
            x: (g as any).x ?? 0,
            y: (g as any).y ?? 0,
            width: (g as any).width ?? 400,
            height: (g as any).height ?? 300,
          }]);
      }
      return [];
    }

    if (typeof value === "object" && value !== null) {
      // record id -> group
      const entries = Object.entries(value as Record<string, JSONTableGroup & Partial<GroupDimensions>>);
      return entries.map(([id, g]) => [id, {
        ...(g as JSONTableGroup),
        x: (g as any).x ?? 0,
        y: (g as any).y ?? 0,
        width: (g as any).width ?? 400,
        height: (g as any).height ?? 300,
      }]);
    }

    return [];
  }

  protected getDefaultStoreValue(): Array<[string, JSONTableGroup & GroupDimensions]> {
    return [];
  }

  protected deserialize(value: string): Array<[string, JSONTableGroup & GroupDimensions]> {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  protected serialize(value: Array<[string, JSONTableGroup & GroupDimensions]>): string {
    return JSON.stringify(value);
  }

  public initGroups(groups: JSONTableGroup[]): void {
    this.groups.clear();
    groups.forEach((group) => {
      this.groups.set(group.id, {
        ...group,
        enumNames: group.enumNames ?? [],
        x: group.x ?? 0,
        y: group.y ?? 0,
        width: group.width ?? 400,
        height: group.height ?? 300,
      });
    });
  }

  public getGroup(id: string): (JSONTableGroup & GroupDimensions) | undefined {
    return this.groups.get(id);
  }

  public getAllGroups(): Map<string, JSONTableGroup & GroupDimensions> {
    return this.groups;
  }

  public saveCurrentStore(): void {
    if (this.currentStoreKey == null) {
      console.log("[TableGroupsStore] saveCurrentStore - skipped because currentStoreKey is null");
      return;
    }

    const storeValue = Array.from(this.groups);
    console.log("[TableGroupsStore] saveCurrentStore - key:", this.currentStoreKey, "groups count:", storeValue.length);
    this.persist(this.currentStoreKey, storeValue);
  }

  public switchTo(newStoreKey: string, initialGroups: JSONTableGroup[] = []): void {
    console.log("[TableGroupsStore] switchTo START - newStoreKey:", newStoreKey, "initialGroups count:", initialGroups.length);

    const previousKey = this.currentStoreKey;
    if (previousKey !== null && previousKey !== newStoreKey) {
      console.log("[TableGroupsStore] switchTo - persisting previous key:", previousKey);
      this.saveCurrentStore();
    }

    this.currentStoreKey = newStoreKey;
    const persistenceKey = this.createPersistanceKey(this.currentStoreKey);
    console.log("[TableGroupsStore] switchTo - persistence key:", persistenceKey);

    const rawRecovered = this.retrieve(this.currentStoreKey);
    const recoveredStore = this.normalizeToEntries(rawRecovered);
    const hasRecovered = Array.isArray(recoveredStore) && recoveredStore.length > 0;
    console.log(
      "[TableGroupsStore] switchTo - recoveredStore entries:",
      hasRecovered ? recoveredStore.length : 0,
      "from type:", rawRecovered === null ? "null" : typeof rawRecovered,
    );

    if (!hasRecovered) {
      console.log("[TableGroupsStore] switchTo - No persisted data for key, checking legacy 'none'");
      const rawLegacy = this.retrieve("none");
      const legacyStore = this.normalizeToEntries(rawLegacy);

      if (Array.isArray(legacyStore) && legacyStore.length > 0) {
        console.log(
          "[TableGroupsStore] switchTo - Migrating",
          legacyStore.length,
          "groups from legacy 'none' key to",
          this.currentStoreKey,
        );
        this.groups = new Map<string, JSONTableGroup & GroupDimensions>(legacyStore);
        this.saveCurrentStore();
        this.clear("none");
        console.log("[TableGroupsStore] switchTo - Legacy 'none' key cleared after migration");
        eventEmitter.emit(TableGroupsStore.GROUPS_CHANGED_EVENT);
        return;
      }

      console.log(
        "[TableGroupsStore] switchTo - Initializing store with schema groups count:",
        initialGroups.length,
      );
      this.initGroups(initialGroups);
      eventEmitter.emit(TableGroupsStore.GROUPS_CHANGED_EVENT);
      return;
    }

    this.groups = new Map<string, JSONTableGroup & GroupDimensions>(recoveredStore);
    console.log(
      "[TableGroupsStore] switchTo COMPLETE - Loaded groups from storage:",
      Array.from(this.groups.keys()),
    );
    eventEmitter.emit(TableGroupsStore.GROUPS_CHANGED_EVENT);
  }

  public setGroupDimensions(id: string, dimensions: Partial<GroupDimensions>): void {
    const group = this.groups.get(id);
    if (group != null) {
      this.groups.set(id, { ...group, ...dimensions });
      this.saveCurrentStore();
    }
  }

  public addTableToGroup(groupId: string, tableName: string): void {
    const group = this.groups.get(groupId);
    if (group != null && !group.tableNames.includes(tableName)) {
      group.tableNames.push(tableName);
      this.saveCurrentStore();
    }
  }

  public removeTableFromGroup(groupId: string, tableName: string): void {
    const group = this.groups.get(groupId);
    if (group != null) {
      group.tableNames = group.tableNames.filter((name) => name !== tableName);
      this.saveCurrentStore();
    }
  }

  public setGroup(group: JSONTableGroup & Partial<GroupDimensions>): void {
    this.groups.set(group.id, {
      ...group,
      x: group.x ?? 0,
      y: group.y ?? 0,
      width: group.width ?? 400,
      height: group.height ?? 300,
    });
    this.saveCurrentStore();
    eventEmitter.emit(TableGroupsStore.GROUPS_CHANGED_EVENT);
  }

  public createGroup(group: JSONTableGroup): void {
    this.groups.set(group.id, {
      ...group,
      x: group.x ?? 0,
      y: group.y ?? 0,
      width: group.width ?? 400,
      height: group.height ?? 300,
    });
    this.saveCurrentStore();
    eventEmitter.emit(TableGroupsStore.GROUPS_CHANGED_EVENT);
  }

  public deleteGroup(id: string): void {
    this.groups.delete(id);
    this.saveCurrentStore();
    eventEmitter.emit(TableGroupsStore.GROUPS_CHANGED_EVENT);
  }

  public subscribe(callback: () => void): () => void {
    eventEmitter.on(TableGroupsStore.GROUPS_CHANGED_EVENT, callback);
    return () => {
      eventEmitter.off(TableGroupsStore.GROUPS_CHANGED_EVENT, callback);
    };
  }

  public getTablesInGroup(groupId: string): string[] {
    const group = this.groups.get(groupId);
    return group?.tableNames ?? [];
  }

  public getEnumsInGroup(groupId: string): string[] {
    const group = this.groups.get(groupId);
    return group?.enumNames ?? [];
  }

  public addEnumToGroup(groupId: string, enumName: string): void {
    const group = this.groups.get(groupId);
    if (group != null) {
      if (group.enumNames == null) {
        group.enumNames = [];
      }
      if (!group.enumNames.includes(enumName)) {
        group.enumNames.push(enumName);
        this.saveCurrentStore();
      }
    }
  }

  public removeEnumFromGroup(groupId: string, enumName: string): void {
    const group = this.groups.get(groupId);
    if (group?.enumNames != null) {
      group.enumNames = group.enumNames.filter((name) => name !== enumName);
      this.saveCurrentStore();
    }
  }

  public getGroups(): Array<JSONTableGroup & GroupDimensions> {
    return Array.from(this.groups.values());
  }

  protected transformStoreBeforeSave(): Array<[string, JSONTableGroup & GroupDimensions]> {
    return Array.from(this.groups.entries());
  }

  protected hydrateStore(data: Array<[string, JSONTableGroup & GroupDimensions]>): void {
    this.groups = new Map(data);
  }
}

export const tableGroupsStore = new TableGroupsStore();
