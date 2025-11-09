export type ConnectionType = 'smoothstep' | 'bezier';

class ConnectionTypeStore {
  private connectionType: ConnectionType = 'bezier';
  private subscribers: Array<(type: ConnectionType) => void> = [];

  getConnectionType(): ConnectionType {
    return this.connectionType;
  }

  setConnectionType(type: ConnectionType): void {
    if (this.connectionType !== type) {
      this.connectionType = type;
      this.notifySubscribers();
    }
  }

  subscribe(callback: (type: ConnectionType) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((cb) => { cb(this.connectionType); });
  }
}

export const connectionTypeStore = new ConnectionTypeStore();
