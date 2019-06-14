class EventEmitter {
    private events = new Map<string, { fn: Function, context: any, once: boolean }[]>();

    public on(event: string, fn: Function, context?: any): this {
        let listeners = this.events.get(event);
        if (listeners) listeners.push({ once: false, fn, context });
        else this.events.set(event, [{ once: false, fn, context }]);
        return this;
    }

    public once(event: string, fn: Function, context?: any): this {
        let listeners = this.events.get(event);
        if (listeners) listeners.push({ once: true, fn, context });
        else this.events.set(event, [{ once: true, fn, context }]);
        return this;
    }

    public off(event: string, fn?: Function, context?: any, once?: boolean): this {
        let listeners = this.events.get(event);

        if (fn && listeners) {
            for (let i = listeners.length - 1; i >= 0; i--) {
                let l = listeners[i];

                if ((fn === l.fn) && (!once || l.once) && (!context || l.context === context)) {
                    listeners.splice(i, 1);
                }
            }
        }
        else {
            this.events.delete(event);
        }
        return this;
    }

    public offAll(): this {
        this.events.clear();
        return this;
    }

    public emit(event: string, ...args: any[]): this {
        let listeners = this.events.get(event);

        if (listeners) {
            for (let i = 0; i < listeners.length; i++) {
                let listener = listeners[i];

                if (listener.once) listeners.splice(i--, 1);
                listener.fn.apply(listener.context, args);
            }
        }
        return this;
    }
}