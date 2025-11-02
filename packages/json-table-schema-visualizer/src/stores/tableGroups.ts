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
  private currentStoreKey = "none";

  static GROUPS_CHANGED_EVENT = "tableGroups:changed";

  constructor() {
    super("tableGroups");
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
    const storeValue = Array.from(this.groups);
    this.persist(this.currentStoreKey, storeValue);
  }

  public switchTo(newStoreKey: string, initialGroups: JSONTableGroup[] = []): void {
    this.saveCurrentStore();

    this.currentStoreKey = newStoreKey;
    const recoveredStore = this.retrieve(this.currentStoreKey) as Array<
      [string, JSONTableGroup & GroupDimensions]
    >;
    
    if (recoveredStore === null || !Array.isArray(recoveredStore)) {
      this.initGroups(initialGroups);
      return;
    }

    this.groups = new Map<string, JSONTableGroup & GroupDimensions>(recoveredStore);
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
    if (group != null && group.enumNames != null) {
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
