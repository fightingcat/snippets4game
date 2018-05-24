class Defered<T> implements PromiseLike<T> {
    public readonly reject: (reason?: any) => void;
    public readonly resolve: (value?: T | PromiseLike<T>) => void;
    public readonly catch: typeof Promise.prototype.catch;
    public readonly then: typeof Promise.prototype.then;

    public constructor() {
        let f, p = new Promise((a, b) => f = [a, b]);
        this.reject = f[1];
        this.resolve = f[0];
        this.catch = onrej => p.catch(onrej);
        this.then = (onful, onrej) => p.then(onful, onrej);
    }
}

// todo: more methods mapping to array.
class DeferedQueue<T> {
    private queue: T[] = [];
    private empty = true;
    private defered = new Defered<void>();

    public push(value: T) {
        this.queue.push(value);
        if (this.defered) {
            this.empty = false;
            this.defered.resolve();
        }
    }

    public unshift(value: T) {
        this.queue.unshift(value);
        if (this.defered) {
            this.empty = false;
            this.defered.resolve();
        }
    }

    public sort(compareFn?: (a: T, b: T) => number): this {
        this.queue.sort(compareFn);
        return this;
    }

    public peekFirst(): Promise<T> {
        if (this.queue.length > 0) {
            return Promise.resolve(this.queue[0]);
        }
        return this.onceAdded(() => this.peekFirst());
    }

    public peekLast(): Promise<T> {
        if (this.queue.length > 0) {
            return Promise.resolve(this.queue[this.queue.length - 1]);
        }
        return this.onceAdded(() => this.peekLast());
    }

    public popSync(): T {
        return this.queue.pop();
    }

    public pop(): Promise<T> {
        if (this.queue.length > 0) {
            return Promise.resolve(this.queue.pop());
        }
        return this.onceAdded(() => this.pop());
    }

    public shiftSync(): T {
        return this.queue.shift();
    }

    public shift(): PromiseLike<T> {
        if (this.queue.length > 0) {
            return Promise.resolve(this.queue.shift());
        }
        return this.onceAdded(() => this.shift());
    }

    private onceAdded(fn: () => any) {
        if (!this.empty && this.queue.length == 0) {
            this.empty = true;
            this.defered = new Defered();
        }
        return this.defered.then(fn);
    }
}