namespace tween {
    const enum Type { Loop, Wait, Set, To, By, CurveTo, CurveBy }
    type Actions = LoopAction | WaitAction | PropAction;

    interface Action {
        type: Type;
        duration: number;
        ease?: Ease;
    }

    interface LoopAction extends Action {
        type: Type.Loop;
        loop: number;
        jump: number;
    }

    interface WaitAction extends Action {
        type: Type.Wait;
    }

    interface PropAction extends Action {
        type: Type.Set | Type.To | Type.By | Type.CurveTo | Type.CurveBy;
        keys: string[];
        values: number[];
    }

    function curvePoints(keys: string[], points: Prop<any>[]) {
        return [].concat(...keys.map(k => points.map(p => p[k])));
    }

    export type Ease = (t: number) => number;
    export type Prop<T> = { [P in keyof T]?: T[P] };
    export type Points<T> = [Prop<T>, Prop<T>, Prop<T>, Prop<T>];

    export class Tween<T> implements PromiseLike<void> {
        private static tweens: Tween<any>[] = [];
        private actions: Actions[] = [];
        private resolve: Function;
        private index = 0;
        private loopJump = -1;
        private duration = 0;
        private playing: boolean;
        private paused: boolean;
        private stack: string;
        private callback: (target: T) => void;
        public readonly then: Promise<void>['then'];

        private constructor(readonly target: T = {} as T) {
            let promise = new Promise(r => this.resolve = r);
            this.then = promise.then.bind(promise);
            // for debug use
            // this.stack = Error().stack.split(/\n/g).slice(3);
            // this.stack.unshift('Created');
        }

        public static get<T>(target?: T, clear?: boolean): Tween<T> {
            if (clear && target != null) {
                Tween.clear(target);
            }
            return new Tween(target);
        }

        public static clear<T>(target: T): void {
            for (let tween of Tween.tweens) {
                if (tween.target == target) tween.stop();
            }
        }

        public static update(dt: number) {
            let tweens = Tween.tweens;
            let removed = 0;

            for (let i = 0; i < tweens.length; i++) {
                let tween = tweens[i];
                tween.resolve ? tween.update(dt)
                    : tweens[i] = null, removed++;
            }
            if (removed > 0) {
                let t = Tween.tweens = [];
                for (let tween of tweens) {
                    if (tween != null) t.push(tween);
                }
            }
        }

        public get finished() {
            return this.resolve == null;
        }

        public stop() {
            this.resolve = null;
            this.playing = false;
            this.actions.length = 0;
        }

        public pause() {
            this.playing = false;
        }

        public resume() {
            if (this.resolve) this.playing = true;
        }

        public loop(times: number = 0) {
            let jump = this.loopJump;

            // if there are actions to loop.
            if (this.actions.length - jump > 1) {
                let loop = ~~times;
                this.loopJump = this.actions.length;
                this.addAction({ type: Type.Loop, duration: 0, loop, jump });
            }
            return this;
        }

        public wait(duration: number) {
            return this.addAction({ type: Type.Wait, duration });
        }

        public set(prop: Prop<T>) {
            let keys = Object.keys(prop);
            let values = keys.map(k => prop[k]);

            return this.addAction({ type: Type.Set, duration: 0, keys, values });
        }

        public to(prop: Prop<T>, duration: number, ease?: Ease) {
            let keys = Object.keys(prop);
            let values = keys.map(k => prop[k]);

            return this.addAction({ type: Type.To, duration, ease, keys, values });
        }

        public by(prop: Prop<T>, duration: number, ease?: Ease) {
            let keys = Object.keys(prop);
            let values = keys.map(k => prop[k]);

            return this.addAction({ type: Type.By, duration, ease, keys, values });
        }

        public curveTo(points: Points<T>, duration: number, ease?: Ease) {
            let keys = Object.keys(points[0]);
            let values = curvePoints(keys, points);

            return this.addAction({ type: Type.CurveTo, duration, ease, keys, values });
        }

        public curveBy(points: Points<T>, duration: number, ease?: Ease) {
            let keys = Object.keys(points[0]);
            let values = curvePoints(keys, points);

            return this.addAction({ type: Type.CurveBy, duration, ease, keys, values });
        }

        public update(dt: number) {
            while (this.playing && dt > 0) {
                dt = this.doAction(dt);
            }
        }

        private addAction(action: Actions): Tween<T> {
            if (this.resolve) {
                this.actions.push(action);
                if (this.actions.length == 1) {
                    this.playing = true;
                    this.onActionStart();
                    Tween.tweens.push(this);
                }
                return this;
            }
            return new Tween(this.target).addAction(action);
        }

        private doAction(dt: number) {
            let action = this.actions[this.index];
            let duration = action.duration;
            let used = Math.min(dt, duration - this.duration);
            let progress = duration ? (this.duration += used) / duration : 1;

            switch (action.type) {
                case Type.Loop: this.doActionLoop(action); break;
                case Type.Set: this.doActionSet(action); break;
                case Type.To: this.doActionTo(action, progress); break;
                case Type.By: this.doActionBy(action, progress); break;
                case Type.CurveTo: this.doActionCurveTo(action, progress); break;
                case Type.CurveBy: this.doActionCurveBy(action, progress); break;
            }
            if (this.duration >= duration) {
                this.duration = 0;
                this.onActionDone();
            }
            return dt - used;
        }

        private onActionStart() {
            let target = this.target;
            let action = this.actions[this.index] as PropAction;
            let { type, keys, values } = action;

            let l = 0; switch (action.type) {
                case Type.To: if (values.length != keys.length) return;
                case Type.By: l = values.length; break;
                case Type.CurveTo: if (values.length != keys.length * 4) return;
                case Type.CurveBy: l = values.length; break;
                default: return;
            }
            for (let i = 0; i < keys.length; i++) {
                values[l + i] = target[keys[i]];
            }
        }

        private onActionDone() {
            if (++this.index < this.actions.length) {
                return this.onActionStart();
            }
            this.resolve();
            this.resolve = null;
            this.playing = false;
            this.actions.length = 0;
        }

        // jump to the start of a loop section.
        private doActionLoop(action: LoopAction) {
            if (--action.loop != 0) {
                this.index = action.jump;
            }
        }

        // set to exact values.
        private doActionSet(action: PropAction) {
            let { ease, keys, values } = action;

            for (let i = 0; i < keys.length; i++) {
                let k = keys[i];
                this.target[k] = values[i];
            }
        }

        // tween to exact values.
        private doActionTo(action: PropAction, progress: number) {
            let { ease, keys, values } = action;
            let t = ease ? ease(progress) : progress;

            for (let i = 0, l = keys.length; i < l; i++) {
                let k = keys[i];
                let v = values[i];
                let s = values[l + i];
                this.target[k] = s + (v - s) * t;
            }
        }

        // tween by offset values.
        private doActionBy(action: PropAction, progress: number) {
            let { ease, keys, values } = action;
            let t = ease ? ease(progress) : progress;

            for (let i = 0, l = keys.length; i < l; i++) {
                let k = keys[i];
                let v = values[i];
                let s = values[l + i];
                this.target[k] = s + v * t;
            }
        }

        private doActionCurveTo(action: PropAction, progress: number) {
            let { ease, keys, values } = action;
            let t = ease ? ease(progress) : progress;
            let a = (1 - t) ** 3;
            let b = (1 - t) ** 2 * t * 3;
            let c = (1 - t) * t * t * 3;
            let d = t * t * t;

            for (let i = 0; i < keys.length; i++) {
                let k = keys[i];
                let p0 = values[i * 4];
                let p1 = values[i * 4 + 1];
                let p2 = values[i * 4 + 2];
                let p3 = values[i * 4 + 3];
                this.target[k] = a * p0 + b * p1 + c * p2 + d * p3;
            }
        }

        private doActionCurveBy(action: PropAction, progress: number) {
            let { ease, keys, values } = action;
            let t = ease ? ease(progress) : progress;
            let a = (1 - t) ** 3;
            let b = (1 - t) ** 2 * t * 3;
            let c = (1 - t) * t * t * 3;
            let d = t * t * t;

            for (let i = 0, l = keys.length; i < l; i++) {
                let k = keys[i];
                let s = values[l * 4 + i]
                let p0 = values[i * 4];
                let p1 = values[i * 4 + 1];
                let p2 = values[i * 4 + 2];
                let p3 = values[i * 4 + 3];
                this.target[k] = s + a * p0 + b * p1 + c * p2 + d * p3;
            }
        }
    }
    export const get = Tween.get;
    export const clear = Tween.clear;
    export const update = Tween.update;
}
