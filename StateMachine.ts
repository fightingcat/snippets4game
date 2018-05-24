/**
 * A particular state machine implementation which relies on the natural reflection in Javascript.
 * 一个特别的状态机实现，依赖于Javascript天然的反射机制。
 */
class StateMachine {
    private record: object;
    private current: string;

    /**
     * Param host is used to provide callbacks of states, statemachine itself will be used if not provided.
     * There are two approach to choose, ordinarily extends StateMachine or keep an instance of StateMachine(adapter pattern).
     * 参数host用于提供状态回调函数，如果没有提供这个参数将使用状态机自己。有两种用法可供选择，直接继承StateMachine或维护一个StateMachine实例(适配器模式)。
     */
    public constructor(private host?: object) {
        if (!host) this.host = this;
    }

    /**
     * Current state name.
     */
    public get currentState() {
        return this.current;
    }

    /**
     * Register a state, duplicate registration is not allowed.
     * Each state corresponds to three event callbacks.
     * Each callback is naming with state name with prefix of: "enterState", "leaveState", "keepState".
     * State callbacks can be optional, and overridden in subclass, even if not exist in super class.
     * 注册一个状态，不允许重复注册。
     * 每个状态对应三个回调函数。
     * 每个回调以状态名加上"enterState"，"leaveState"，"keepState"三种前缀命名。
     * 状态回调可以是可选的，也可以在子类中重载，即使父类中没有。
     */
    public register(state: string, isDefault?: boolean) {
        const records = this.record || (this.record = {});

        if (records[state]) {
            throw Error(`State is already registered: ${state}.`);
        }
        if (isDefault) {
            this.current = state;
        }
        records[state] = {
            enter: this.host[`enterState${state}`],
            leave: this.host[`leaveState${state}`],
            keep: this.host[`keepState${state}`]
        };
    }

    /**
     * Switch to remote state, corresponding callback will be called (if exists).
     * 切换到目标状态，相应的回调函数会被调用(如果存在的话)
     */
    public switchTo(state: string) {
        const { record, current } = this;

        if (state == current) {
            return;
        }
        if (record[state]) {
            const entry = record[current];
            const leave = entry && entry.leave;
            const enter = record[state].enter;

            leave && leave.call(this.host, this);
            this.current = state;
            enter && enter.call(this.host, this);
        }
        throw new Error(`Cannot switch to unregistered state: ${state}.`);
    }

    /**
     * This api should be called in event loop.
     */
    public update(dt: number) {
        const entry = this.record[this.current];
        const keep = entry && entry.keep;

        keep && keep.call(this.host, this, dt);
    }
}
