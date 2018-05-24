/**
 * A particular state machine implementation which relies on the natural reflection in Javascript.
 * 一个特别的状态机实现，依赖于Javascript天然的反射机制。
 */
namespace utils {
    export class AsyncStateMachine {
        private records: object;
        private current: string;
        private lateset: string;
        private version: number = 0;
        private promise = Promise.resolve();

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
            const records = this.records || (this.records = {});

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
        public async switchTo(state: string) {
            const { records, lateset } = this;

            if (state == lateset) {
                return;
            }
            if (records[state]) {
                const version = ++this.version;
                const current = records[this.current];
                const leave = current && current.leave;
                const { enter, keep } = records[state];

                const switched = this.promise
                    .then(() => this.leave())
                    .then(() => this.current = state)
                    .then(() => this.enter());

                this.lateset = state;
                this.promise = switched.then(() => {
                    if (keep) this.keep(this, keep, version);
                });
                return switched;
            }
            throw new Error(`Cannot switch to unregistered state: ${state}.`);
        }

        private leave() {
            const current = this.records[this.current];
            const leave = current ? current.leave : null;

            if (leave) return leave.call(this.host, this);
        }

        private enter() {
            const current = this.records[this.current];
            const enter = current ? current.enter : null;

            if (enter) return enter.call(this.host, this);
        }

        private keep(self: this, keep: Function, version: number) {
            return function loop() {
                if (version == self.version) {
                    return Promise.resolve(keep.call(self.host, self)).then(loop);
                }
            }();
        }
    }
}
