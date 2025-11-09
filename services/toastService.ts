export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

// A simple event emitter
class EventEmitter<T> {
  private listeners: ((data: T) => void)[] = [];

  subscribe(listener: (data: T) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(data: T) {
    this.listeners.forEach(listener => listener(data));
  }
}

const emitter = new EventEmitter<ToastMessage>();
let toastId = 0;

export const toastService = {
  show: (type: ToastType, title: string, message: string) => {
    toastId += 1;
    emitter.emit({ id: toastId, type, title, message });
  },
  subscribe: (listener: (toast: ToastMessage) => void) => emitter.subscribe(listener),
};
