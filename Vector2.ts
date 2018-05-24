/**
 * 2d vector. There are series of methods return Vector2 for chaining, some accept a Vector2 param named result in order to redirect result to another vector.
 * 二维向量。有一系列返回Vector2的方法用来链式调用，有些接受一个名为result的Vector2参数用于重定向结果到另一个向量。
 */
class Vector2 {
	private static RAD = Math.PI / 180; // 角度转弧度系数
	private static DEG = 180 / Math.PI; // 弧度转角度系数
	private static DIRTYANGLE = 0xDA;

	private _x: number = 0;
	private _y: number = 0;
	private _length: number = 0;
	private _angle: number = 0;

	public constructor(x: number = 0, y: number = 0) {
		this.set(x, y);
	}

	/**
	 * x component of this vector.
	 * x分量。
	 */
	public get x(): number {
		return this._x;
	}

	public set x(x: number) {
		if (x != this._x) {
			this._length = -1;
			this._angle = Vector2.DIRTYANGLE;
			this._x = x;
		}
	}

	/**
	 * y component of this vector.
	 * y分量。
	 */
	public get y(): number {
		return this._y;
	}

	public set y(y: number) {
		if (y != this._y) {
			this._length = -1;
			this._angle = Vector2.DIRTYANGLE;
			this._y = y;
		}
	}

	/**
	 * length of vector
	 * 向量的长度(模)。
	 */
	public get length(): number {
		if (this._length < 0) {
			this._length = Math.sqrt(this._x * this._x + this._y * this._y);
		}
		return this._length;
	}

	public set length(length: number) {
		let scale = length / this.length || 0;
		this._x *= scale, this._y *= scale, this._length = length;
	}

	/**
	 * angle in radians.
	 * 向量旋转弧度。
	 */
	public get radians(): number {
		if (this._angle == Vector2.DIRTYANGLE) {
			this._angle = Math.atan2(this._y, this._x);
		}
		return this._angle;
	}

	public set radians(rad: number) {
		let length = this.length;
		this._x = length * Math.cos(rad);
		this._y = length * Math.sin(rad);
		this._angle = rad;
	}

	/**
	 * angle in degrees.
	 * 向量旋转角度。
	 */
	public get degree(): number {
		return this.radians * Vector2.DEG;
	}

	public set degree(deg: number) {
		this.radians = deg * Vector2.RAD;
	}

	/**
	 * set components with values.
	 * 设置向量分量。
	 */
	public set(x: number, y: number): Vector2 {
		if (x != this._x || y != this._y) {
			this._length = -1;
			this._angle = Vector2.DIRTYANGLE;
			this._x = x, this._y = y;
		}
		return this;
	}

	/**
	 * set components with another vector.
	 * 用另一个向量设置向量分量。
	 */
	public setV(v: Vector2): Vector2 {
		this._x = v._x;
		this._y = v._y;
		this._angle = v._angle;
		this._length = v._length;
		return this;
	}

	/**
	 * set length of vector, only affects non-zero vector.
	 * 设置向量长度，只对非零向量有效。
	 */
	public setLength(length: number): Vector2 {
		this.length = length;
		return this;
	}

	/**
	 * set angle in radians, aka, rotate to.
	 * 设置向量旋转弧度，或者说，旋转至指定弧度。
	 */
	public setRadians(rad: number): Vector2 {
		this.radians = rad;
		return this;
	}

	/**
	 * set angle in degrees, aka, rotate to.
	 * 设置向量旋转角度，或者说，旋转至指定角度。
	 */
	public setDegree(deg: number): Vector2 {
		this.degree = deg;
		return this;
	}

	/**
	 * rotate in radians.
	 * 旋转一定弧度。
	 */
	public rotateRadians(rad: number): Vector2 {
		return this.rotate(Math.cos(rad), Math.sin(rad));
	}

	/**
	 * rotate in degrees.
	 * 旋转一定角度。
	 */
	public rotateDegree(deg: number): Vector2 {
		return this.rotateRadians(deg * Vector2.RAD);
	}

	/**
	 * rotate same angle with another vector.
	 * 旋转与另一向量相当的角度。
	 */
	public rotate(x: number, y: number): Vector2 {
		let t = this._x;
		this._x = t * x - this._y * y;
		this._y = t * y + this._y * x;
		this._angle = Vector2.DIRTYANGLE;
		return this;
	}

	/**
	 * rotate same angle with another vector.
	 * 旋转与另一向量相当的角度。
	 */
	public rotateV(v: Vector2): Vector2 {
		return this.rotate(v._x, v._y);
	}

	/**
	 * reversely rotate same angle with another vector.
	 * 反向旋转与另一向量相当的角度。
	 */
	public unrotate(x: number, y: number): Vector2 {
		let t = this._x;
		this._x = t * x + this._y * y;
		this._y = this._y * x - t * y;
		this._angle = Vector2.DIRTYANGLE;
		return this;
	}

	/**
	 * reversely rotate same angle with another vector.
	 * 反向旋转与另一向量相当的角度。
	 */
	public unrotateV(v: Vector2): Vector2 {
		return this.unrotate(v._x, v._y);
	}

	/**
	 * multiply by a factor.
	 * 乘以一个系数。
	 */
	public mul(factor: number, result: Vector2 = this): Vector2 {
		return result.set(this._x * factor, this._y * factor);
	}

	/**
	 * devide by a factor.
	 * 除以一个系数。
	 */
	public div(factor: number, result: Vector2 = this): Vector2 {
		return result.set(this._x / factor, this._y / factor);
	}

	/**
	 * add another vector to this one.
	 * 与另一个向量相加。
	 */
	public add(x: number, y: number, result: Vector2 = this): Vector2 {
		return result.set(this._x + x, this._y + y);
	}

	/**
	 * add another vector to this one.
	 * 与另一个向量相加。
	 */
	public addV(v: Vector2, result: Vector2 = this): Vector2 {
		return result.set(this._x + v._x, this._y + v._y);
	}

	/**
	 * substract another vector from this one.
	 * 减去另一个向量。
	 */
	public sub(x: number, y: number, result: Vector2 = this): Vector2 {
		return result.set(this._x - x, this._y - y);
	}

	/**
	 * substract another vector from this one.
	 * 减去另一个向量。
	 */
	public subV(v: Vector2, result: Vector2 = this): Vector2 {
		return result.set(this._x - v._x, this._y - v._y);
	}

	/**
	 * get cross production of this vector and another one.
	 * 计算当前向量和另一个向量的叉积。
	 */
	public cross(x: number, y: number): number {
		return this._x * y - this._y * x;
	}

	/**
	 * get cross production of this vector and another one.
	 * 计算当前向量和另一个向量的叉积。
	 */
	public crossV(v: Vector2): number {
		return this._x * v._y - this._y * v._y;
	}

	/**
	 * get dot production of this vector and another one.
	 * 计算当前向量和另一个向量的点积。
	 */
	public dot(x: number, y: number): number {
		return this._x * x + this._y * y;
	}

	/**
	 * get dot production of this vector and another one.
	 * 计算当前向量和另一个向量的点积。
	 */
	public dotV(v: Vector2): number {
		return this.dot(v._x, v._y);
	}

	/**
	 * normalize this vector.
	 * 标准化当前向量。
	 */
	public norm(result: Vector2 = this): Vector2 {
		let scale = 1 / this.length || 0;
		return result.set(this._x * scale, this._y * scale);
	}

	/**
	 * project this vector to another one.
	 * 将当前向量投影到另一个向量。
	 */
	public project(x: number, y: number, result: Vector2 = this): Vector2 {
		let factor = this.dot(x, y) / (x * x + y * y);
		return result.set(x * factor, y * factor);
	}

	/**
	 * project this vector to another one.
	 * 将当前向量投影到另一个向量。
	 */
	public projectV(v: Vector2, result: Vector2 = this): Vector2 {
		let factor = this.dotV(v) / v.dotV(v);
		return result.set(v._x * factor, v._y * factor);
	}

	/**
	 * get anticlockwise perpendicular vector, aka rotate 90 degrees.
	 * 取得逆时针方向的垂直向量，或者说旋转90度。
	 */
	public perp(result: Vector2 = this): Vector2 {
		return result.set(-this._y, this._x);
	}

	/**
	 * get clockwise perpendicular vector, aka rotate -90 degrees.
	 * 取得顺时针方向的垂直向量，或者说旋转-90度。
	 */
	public rperp(result: Vector2 = this): Vector2 {
		return result.set(this._y, -this._x);
	}

	/**
	* compare with another vector.
	* 与另一个向量比较是否相等。
	*/
	public equals(x: number, y: number) {
		return this._x == x && this._y == y;
	}

	/**
	 * compare with another vector.
	 * 与另一个向量比较是否相等。
	 */
	public equalsV(v: Vector2): boolean {
		return this._x == v._x && this._y == v._y;
	}

	/**
	 * roughly compare with another vecotr.
	 * 与另一个向量比较是否近似相等
	 */
	public epsilonEquals(x: number, y: number, epsilon = .000001): boolean {
		if (Math.abs(this._x - x) > epsilon) return false;
		if (Math.abs(this._y - y) > epsilon) return false;
		return true;
	}

	/**
	 * roughly compare with another vecotr.
	 * 与另一个向量比较是否近似相等
	 */
	public epsilonEqualsV(v: Vector2, epsilon = .000001): boolean {
		if (Math.abs(this._x - v._x) > epsilon) return false;
		if (Math.abs(this._y - v._y) > epsilon) return false;
		return true;
	}
}
