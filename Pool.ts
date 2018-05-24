interface PoolFactory<T> {
    obtain(): T;
    free(object: T): void;
}

class Pool<T> {
    private static pools = new WeakMap();
    private capacity: number = 128;
    private unused: T[];

    public static of<T>(factory: PoolFactory<T>): Pool<T> {
        let pool = this.pools.get(factory);

        if (pool === undefined) {
            this.pools.set(factory, pool = new Pool<T>(factory));
        }
        return pool;
    }

    public static free<T>(factory: PoolFactory<T>): void {
        let pool = this.pools.get(factory);
        // this is as much as what we can do
        if (pool) { pool.clear(); this.pools.delete(factory); }
    }

    public constructor(readonly factory: PoolFactory<T>) { }

    public get size(): number {
        return this.unused.length;
    }

    public setCapacity(capacity: number) {
        if (this.unused.length > capacity) {
            this.unused.length = capacity;
        }
        this.capacity = capacity;
    }

    public obtain(): T {
        if (this.unused.length > 0) {
            return this.unused.pop();
        }
        return this.factory.obtain();
    }

    public free(object: T): void {
        this.factory.free(object);
        this.unused.length < this.capacity
            ? this.unused.push(object)
            : this.unused.length = this.capacity;
    }

    public clear() {
        this.unused.length = 0;
    }
}
