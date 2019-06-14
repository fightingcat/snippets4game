const enum GestureEvent {
    TouchTap = 'TouchTap',
    TouchBegin = 'TouchBegin',
    TouchMove = 'TouchMove',
    TouchEnd = 'TouchEnd',
    DragBegin = 'DragBegin',
    DragMove = 'DragMove',
    DragEnd = 'DragEnd',
    PinchBegin = 'PinchBegin',
    PinchMove = 'PinchMove',
    PinchEnd = 'PinchEnd',
}

class TouchData {
    public data: TouchData;
    public touching: boolean;
    public dragging: boolean;
    public id: number = -1;         // 触摸点ID
    public tapped: number = 0;      // 点击次数
    public eventX: number = 0;      // 当前位置
    public eventY: number = 0;      // 当前位置
    public beginX: number = 0;      // 初始位置
    public beginY: number = 0;      // 初始位置
    public deltaX: number = 0;      // 相对移动距离
    public deltaY: number = 0;      // 相对移动距离
    public speedX: number = 0;      // 移动速度
    public speedY: number = 0;      // 移动速度
    public beginTime: number = 0;   // 按下时间
    public touchTime: number = 0;   // 触摸时间
    public deltaTime: number = 0;   // 距上次事件时间

    public constructor() {
        this.data = Object.freeze(Object.create(this));
    }

    public get movedX() {
        return this.eventX - this.beginX;
    }

    public get movedY() {
        return this.eventY - this.beginY;
    }
    
    public stopTouching() {
        this.touching = false;
    }

    public stopDragging() {
        this.dragging = false;
    }

    public resetTap() {
        this.tapped = 0;
    }

    public outOfRange(range: number) {
        let mx = this.movedX, my = this.movedY;
        return mx * mx + my * my > range * range;
    }

    public outOfTime(time: number) {
        return this.touchTime - this.beginTime > time;
    }
}

class PinchData {
    public data: PinchData;
    public point1 = new TouchData();
    public point2 = new TouchData();
    public pinching: boolean;
    public eventX: number = 0;      // 轴心当前位置
    public eventY: number = 0;      // 轴心当前位置
    public beginX: number = 0;      // 轴心初始位置
    public beginY: number = 0;      // 轴心初始位置
    public deltaX: number = 0;      // 轴心相对移动距离
    public deltaY: number = 0;      // 轴心相对移动距离
    public movedX: number = 0;      // 轴心总共移动距离
    public movedY: number = 0;      // 轴心总共移动距离

    public constructor() {
        this.data = Object.create(this);
        this.data.point1 = this.point1.data;
        this.data.point2 = this.point2.data;
        Object.freeze(this.data);
    }

    // 缩放
    public get scale() {
        let p1 = this.point1;
        let p2 = this.point2;
        let dx0 = p2.beginX - p1.beginX;
        let dy0 = p2.beginY - p1.beginY;
        let dx1 = p2.eventX - p1.eventX;
        let dy1 = p2.eventY - p1.eventY;
        return Math.sqrt((dx1 * dx1 + dy1 * dy1) / (dx0 * dx0 + dy0 * dy0));
    }

    // 旋转
    public get rotation() {
        let p1 = this.point1;
        let p2 = this.point2;
        let dx = p2.eventX - p1.eventX;
        let dy = p2.eventY - p1.eventY;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    public stopPinching() {
        this.pinching = false;
        this.point1.stopDragging();
        this.point2.stopDragging();
    }

    public stopTouchings() {
        this.pinching = false;
        this.point1.stopTouching();
        this.point1.stopTouching();
    }
}

class GestureDetector extends EventEmitter {
    public enableDragging: boolean = true;
    public enablePinching: boolean = true;
    public dragThreshold: number = 10;
    public comboTapTime: number = 0.3;
    private pinch = new PinchData();

    public touchBegin(id: number, x: number, y: number) {
        let time = Date.now() / 1000;
        let point = this.getTouchPoint(id);

        if (point) {
            if (point.tapped > 0) {
                // TODO: 处理连续点击范围
                if (time - point.touchTime > this.comboTapTime) {
                    point.tapped = 0;
                }
            }
            point.touching = true;
            point.id = id;
            point.beginX = x;
            point.beginY = y;
            point.speedX = 0;
            point.speedY = 0;
            point.beginTime = time;
            this.updatePoint(point, x, y, time);
            this.emit(GestureEvent.TouchBegin, point);
        }
    }

    public touchMove(id: number, x: number, y: number): void {
        let time = Date.now() / 1000;
        let point = this.getTouchPoint(id);

        if (point && point.touching) {
            this.updatePoint(point, x, y, time);
            this.emit(GestureEvent.TouchMove, point);

            if (this.pinch.pinching) {
                this.updatePinch(point);
                this.emit(GestureEvent.PinchMove, this.pinch.data);
                return;
            }
            if (this.enableDragging && point.dragging) {
                this.emit(GestureEvent.DragMove, point.data);
                return;
            }
            if (!point.outOfRange(this.dragThreshold)) {
                this.emit(GestureEvent.TouchMove, point.data);
                return;
            }
            if (this.enablePinching && this.isPinching()) {
                let point1 = this.pinch.point1;
                let point2 = this.pinch.point2;
                this.pinch.pinching = true;
                this.pinch.point1.tapped = 0;
                this.pinch.point2.tapped = 0;
                point1.beginX = point1.eventX;
                point1.beginY = point1.eventY;
                point2.beginX = point2.eventX;
                point2.beginY = point2.eventY;
                this.updatePinch(point);
                this.emit(GestureEvent.PinchBegin, this.pinch.data);
                return;
            }
            point.dragging = true;
            point.tapped = 0;
            this.emit(GestureEvent.DragBegin, point.data);
        }
    }

    public touchEnd(id: number, x: number, y: number) {
        let time = Date.now() / 1000;
        let point = this.getTouchPoint(id);

        if (point && point.touching) {
            this.updatePoint(point, x, y, time);
            this.emit(GestureEvent.TouchEnd, point.data);
            point.touching = false;
            point.id = -1;

            if (this.pinch.pinching) {
                this.pinch.pinching = false;
                point.dragging = false;
                this.updatePinch(point);
                this.emit(GestureEvent.PinchEnd, this.pinch.data);
            }
            else if (point.dragging) {
                point.dragging = false;
                this.emit(GestureEvent.DragEnd, point.data);
            }
            else {
                point.tapped++;
                this.emit(GestureEvent.TouchTap, point.data);
            }
        }
    }

    private isPinching() {
        let point1 = this.pinch.point1;
        let point2 = this.pinch.point2;
        return point1.touching && point2.touching;
    }

    private getTouchPoint(id: number) {
        let id1 = this.pinch.point1.id;
        let id2 = this.pinch.point2.id;

        if (id1 == id) return this.pinch.point1;
        if (id2 == id) return this.pinch.point2;
        if (id1 == -1) return this.pinch.point1;
        if (id2 == -1) return this.pinch.point2;
    }

    private updatePoint(point: TouchData, x: number, y: number, time: number) {
        let dx = x - point.eventX;
        let dy = y - point.eventY;
        let dt = time - point.touchTime;

        point.deltaX = dx;
        point.deltaY = dy;
        point.eventX = x;
        point.eventY = y;
        point.touchTime = time;
        point.deltaTime = dt;

        if (dt > 1 / 30) {
            // TODO: parameterizing
            let scale = Math.pow(0.833, dt * 60 - 1);
            point.speedX *= scale;
            point.speedY *= scale;
        }
        point.speedX += (dx / dt - point.speedX) * dt * 10;
        point.speedY += (dy / dt - point.speedY) * dt * 10;
    }

    private updatePinch(point: TouchData) {
        let pinch = this.pinch;
        let point1 = pinch.point1;
        let point2 = pinch.point2;

        if (point == point1) {
            point2.deltaX = 0;
            point2.deltaY = 0;
        }
        else if (point == point2) {
            point1.deltaX = 0;
            point1.deltaY = 0;
        }
        pinch.deltaX = point.deltaX / 2;
        pinch.deltaY = point.deltaY / 2;
    }
}