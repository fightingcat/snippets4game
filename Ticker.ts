class Ticker {
	private _tick: number;
	private _duration: number;
	private _reversed: boolean;
	private _justDone: boolean;
	private _done: boolean;

	public constructor(duration: number = 0, reversed: boolean = false) {
		this._tick = reversed ? duration : 0;
		this._duration = duration;
		this._reversed = reversed;
		this._justDone = this._done = false;
	}

	public get done(): boolean {
		return this._done;
	}

	public get justDone(): boolean {
		return this._justDone;
	}

	public get tick(): number {
		return this._tick;
	}

	public get duration(): number {
		return this._duration;
	}

	public reset(duration = this._duration) {
		this._duration = duration;
		this._done = this._justDone = false;
		this._tick = this._reversed ? this._duration : 0;
	}

	public skip() {
		this._tick = this._reversed ? 0 : this._duration;
	}

	public reverse() {
		this._done = this._justDone = false;
		this._reversed = !this._reversed;
	}

	public update(dt: number): boolean {
		if (this._done) {
			return this._justDone = false;
		}
		return this._justDone = this._done = !this._reversed
			? (this._tick += dt) >= this._duration
			: (this._tick -= dt) <= 0;
	}
}