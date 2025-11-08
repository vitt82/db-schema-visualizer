import { PersistableStore } from "./PersitableStore";

import type { XYPosition } from "@/types/positions";

export interface ControlPoint extends XYPosition {
  id: string;
}

// Key: "sourceTable-targetTable-relationOwner"
class ConnectionControlPointsStore extends PersistableStore<Array<[string, ControlPoint[]]>> {
  private controlPoints = new Map<string, ControlPoint[]>();
  private readonly currentStoreKey = "connectionControlPoints";

  constructor() {
    super("connectionControlPoints");
  }

  private getKey(sourceTableName: string, targetTableName: string, relationOwner: string): string {
    return `${sourceTableName}-${targetTableName}-${relationOwner}`;
  }

  addControlPoint(
    sourceTableName: string,
    targetTableName: string,
    relationOwner: string,
    point: XYPosition
  ): void {
    const key = this.getKey(sourceTableName, targetTableName, relationOwner);
    const current = this.controlPoints.get(key) ?? [];
    
    const id = `cp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    current.push({ ...point, id });
    this.controlPoints.set(key, current);
    this.saveCurrentStore();
  }

  moveControlPoint(
    sourceTableName: string,
    targetTableName: string,
    relationOwner: string,
    controlPointId: string,
    newPosition: XYPosition
  ): void {
    const key = this.getKey(sourceTableName, targetTableName, relationOwner);
    const points = this.controlPoints.get(key) ?? [];
    
    const index = points.findIndex((p) => p.id === controlPointId);
    if (index !== -1) {
      points[index] = { ...points[index], ...newPosition };
      this.controlPoints.set(key, points);
      this.saveCurrentStore();
    }
  }

  removeControlPoint(
    sourceTableName: string,
    targetTableName: string,
    relationOwner: string,
    controlPointId: string
  ): void {
    const key = this.getKey(sourceTableName, targetTableName, relationOwner);
    const points = this.controlPoints.get(key) ?? [];
    
    const filtered = points.filter((p) => p.id !== controlPointId);
    if (filtered.length === 0) {
      this.controlPoints.delete(key);
    } else {
      this.controlPoints.set(key, filtered);
    }
    this.saveCurrentStore();
  }

  getControlPoints(
    sourceTableName: string,
    targetTableName: string,
    relationOwner: string
  ): ControlPoint[] {
    const key = this.getKey(sourceTableName, targetTableName, relationOwner);
    return this.controlPoints.get(key) ?? [];
  }

  clearControlPoints(
    sourceTableName: string,
    targetTableName: string,
    relationOwner: string
  ): void {
    const key = this.getKey(sourceTableName, targetTableName, relationOwner);
    this.controlPoints.delete(key);
    this.saveCurrentStore();
  }

  getCurrentStoreValue(): Map<string, ControlPoint[]> {
    return this.controlPoints;
  }

  saveCurrentStore(): void {
    const storeValue = Array.from(this.controlPoints);
    this.persist(this.currentStoreKey, storeValue);
  }

  loadStore(): void {
    try {
      const recovered = this.retrieve(this.currentStoreKey) as Array<[string, ControlPoint[]]> | null;
      if (recovered !== null && Array.isArray(recovered)) {
        this.controlPoints = new Map<string, ControlPoint[]>(recovered);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("connectionControlPoints: failed to retrieve persisted data", err);
    }
  }
}

export const connectionControlPointsStore = new ConnectionControlPointsStore();
connectionControlPointsStore.loadStore();

