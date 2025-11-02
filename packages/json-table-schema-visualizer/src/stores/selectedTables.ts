import eventEmitter from "@/events-emitter";

class SelectedTablesStore {
  private selectedTables = new Set<string>();

  static SELECTION_CHANGED_EVENT = "selectedTables:changed";

  public toggleSelection(tableName: string): void {
    if (this.selectedTables.has(tableName)) {
      this.selectedTables.delete(tableName);
    } else {
      this.selectedTables.add(tableName);
    }
    eventEmitter.emit(SelectedTablesStore.SELECTION_CHANGED_EVENT, new Set(this.selectedTables));
  }

  public clearSelection(): void {
    this.selectedTables.clear();
    eventEmitter.emit(SelectedTablesStore.SELECTION_CHANGED_EVENT, new Set(this.selectedTables));
  }

  public selectMultiple(tableNames: string[]): void {
    tableNames.forEach((name) => this.selectedTables.add(name));
    eventEmitter.emit(SelectedTablesStore.SELECTION_CHANGED_EVENT, new Set(this.selectedTables));
  }

  public getSelected(): Set<string> {
    return new Set(this.selectedTables);
  }

  public isSelected(tableName: string): boolean {
    return this.selectedTables.has(tableName);
  }

  public subscribe(callback: (selected: Set<string>) => void): () => void {
    eventEmitter.on(SelectedTablesStore.SELECTION_CHANGED_EVENT, callback);
    return () => {
      eventEmitter.off(SelectedTablesStore.SELECTION_CHANGED_EVENT, callback);
    };
  }
}

export const selectedTablesStore = new SelectedTablesStore();
