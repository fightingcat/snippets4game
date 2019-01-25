interface PoolFactory<T> {
    obtain(): T;
    return?(object: T): void;
}

class Pool<T> {
    private static pools = new WeakMap();
    private capacity: number = 128;
    private unused: T[] = [];

    public static of<T>(factory: (() => T) | PoolFactory<T>): Pool<T> {
        let pool = this.pools.get(factory);

        if (pool === undefined) {
            if (typeof factory == 'function') {
                factory = { obtain: factory };
            }
            this.pools.set(factory, pool = new Pool<T>(factory));
        }
        return pool;
    }

    public static free<T>(factory: (() => T) | PoolFactory<T>): void {
        let pool = this.pools.get(factory);
        // this is as much as what we can do
        if (pool) { pool.clear(); this.pools.delete(factory); }
    }

    public constructor(readonly factory: PoolFactory<T>) { }

    public get size(): number {
        return this.unused.length;
    }

    public setCapacity(capacity: number): Pool<T> {
        if (this.unused.length > capacity) {
            this.unused.length = capacity;
        }
        this.capacity = capacity;
        return this;
    }

    public obtain(): T {
        if (this.unused.length > 0) {
            return this.unused.pop();
        }
        return this.factory.obtain();
    }

    public return(object: T): void {
        if (this.factory.return) {
            this.factory.return(object);
        }
        this.unused.length < this.capacity
            ? this.unused.push(object)
            : this.unused.length = this.capacity;
    }

    public clear() {
        this.unused.length = 0;
    }
}
