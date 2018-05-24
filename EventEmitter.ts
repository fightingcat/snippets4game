namespace utils {

    interface Record<T> {
        fn: EventListener<T>;
        context?: any;
        once?: boolean;
    }

    export type EventListener<T> = (event: T, ...args: any[]) => any;

    export class EventEmitter<T = string | number> {
        private _events = new Map<T, Record<T>[]>();

        public once(event: T): Promise<any>;

        public once(event: T, fn: EventListener<T>, context?: any): void;

        public once(event: T, fn?: EventListener<T>, context?: any): Promise<any> | void {
            if (fn) return this.on(event, fn, context, true);
            return new Promise((resolve, reject) => this.on(event, (event, data) => resolve(data)));
        }

        public on(event: T, fn: EventListener<T>, context?: any, once?: boolean): void {
            if (this._events.has(event)) {
                this._events.get(event).push({ fn, context, once });
            }
            else {
                this._events.set(event, [{ fn, context, once }]);
            }
        }

        public off(event: T, fn?: EventListener<T>, context?: any, once?: boolean): void {
            if (this._events.has(event)) {
                if (fn) {
                    const listeners = this._events.get(event).filter(it => {
                        return fn !== it.fn || context != it.context || (!!once && !it.once);
                    });
                    if (listeners.length > 0) {
                        this._events.set(event, listeners);
                        return;
                    }
                }
                this._events.delete(event);
            }
        }

        public emit(event: T, ...args: any[]): boolean {
            const listeners = this._events.get(event);

            if (!listeners) return false;

            const remain = listeners.filter((listener, index) => {
                if (listener.fn) listener.fn.call(listener.context, event, ...args);
                return !listener.once;
            });
            if (remain.length == 0) {
                this._events.delete(event);
            }
            else if (remain.length != listeners.length) {
                this._events.set(event, remain);
            }
            return true;
        }
    }
}
