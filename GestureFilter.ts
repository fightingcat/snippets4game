/**
 * GestureFilter.ts
 * 
 * Created by Atlas on 2017-06-28
 */
namespace utils {
    export class GestureEvent extends egret.TouchEvent {
        public static DragBegin = 'GestureFilter_DragBegin';
        public static DragMove = 'GestureFilter_DragMove';
        public static DragEnd = 'GestureFilter_DragEnd';
        public static Tap = 'GestureFilter_Tap';
        public static DoubleTap = 'GestureFilter_DoubleTap';
        public static TripleTap = 'GestureFilter_TripleTap';
        public static ComboTap = 'GestureFilter_ComboTap';
        public static LongPressed = 'GestureFilter_LongPressed';

        public tapped: number = 0;          // 连续点击次数
        public origin = new Vector2();      // 按下时的位置
        public delta = new Vector2();       // 相对上次事件的距离
        public distance = new Vector2();    // 相对按下位置的距离
        public velocity = new Vector2();    // 当前滑动的速度
    }

    export class GestureFilter {
        public enableDoubleTap: boolean = true;
        public enableTripleTap: boolean = false;
        public enableComboTap: boolean = false;
        public enableLongPress: boolean = false;

        public tapRange: number = 25;
        public tapValidTime: number = 0.6;
        public longPressTime: number = 1;

        private capturedTarget: egret.EventDispatcher;
        private touching: boolean = false;
        private dragging: boolean = false;
        private touchTime: number = 0;
        private tapTime: number = 0;
        private tapped: number = 0;
        private touchX: number = 0;
        private touchY: number = 0;
        private originX: number = 0;
        private originY: number = 0;
        private velocityX: number = 0;
        private velocityY: number = 0;

        public constructor(private target: egret.DisplayObject) {
            this.enable();
        }

        /**
         * 启用
         */
        public enable() {
            this.target.touchEnabled = true;
            this.target.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
            this.target.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.onTouchMove, this);
            this.target.addEventListener(egret.TouchEvent.TOUCH_END, this.onTouchEnd, this);
            this.target.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, this.onTouchEnd, this);
        }

        /**
         * 禁用
         */
        public disable() {
            this.target.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
            this.target.removeEventListener(egret.TouchEvent.TOUCH_MOVE, this.onTouchMove, this);
            this.target.removeEventListener(egret.TouchEvent.TOUCH_END, this.onTouchEnd, this);
            this.target.removeEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, this.onTouchEnd, this);
        }

        /**
         * 当触摸区域在对象区域外时，需要捕获外面区域的对象的触摸事件
         * @param target 要捕获输入的对象，通常是父容器或整个Stage。
         */
        public captureTouch(target: egret.EventDispatcher) {
            if (this.capturedTarget) {
                this.releaseCapture();
            }
            target.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.onTouchMove, this);
            this.capturedTarget = target;
        }

        /**
         * 释放捕获触摸事件的对象
         */
        public releaseCapture() {
            if (this.capturedTarget) {
                this.capturedTarget.removeEventListener(egret.TouchEvent.TOUCH_MOVE, this.onTouchMove, this);
                this.capturedTarget = null;
            }
        }

        private emitEvent(type: string, rawEvent: egret.TouchEvent): boolean {
            // fix: eui scroller dispatch a propagation event when touch end,
            // which its target is null, simply ignore it right now until I figure out their intention.
            let target = rawEvent.currentTarget == this.capturedTarget ? this.target : rawEvent.target;
            if (target) {
                let event = new GestureEvent(type, true, true, rawEvent.stageX, rawEvent.stageY, rawEvent.touchPointID);
                event.tapped = this.tapped;
                event.origin.set(this.originX, this.originY);
                event.velocity.set(this.velocityX, this.velocityY);
                event.delta.set(rawEvent.stageX - this.touchX, rawEvent.stageY - this.touchY);
                event.distance.set(rawEvent.stageX - this.originX, rawEvent.stageY - this.originY);
                return target.dispatchEvent(event);
            }
        }

        private updateVelocity(dx: number, dy: number, dt: number) {
            if (dt > 1 / 30) {
                let scale = Math.pow(0.833, dt * 60 - 1);

                this.velocityX *= scale;
                this.velocityY *= scale;
            }
            this.velocityX += (dx / dt - this.velocityX) * dt * 10;
            this.velocityY += (dy / dt - this.velocityY) * dt * 10;
        }

        private onTouchBegin(event: egret.TouchEvent) {
            let time = egret.getTimer() * 0.001;

            if (this.tapped > 0) {
                let dx = event.stageX - this.originX;
                let dy = event.stageY - this.originY;

                if (time - this.tapTime > this.tapValidTime || dx * dx + dy * dy > this.tapRange * this.tapRange) {
                    this.tapped = 0;
                }
            }
            this.touchX = this.originX = event.stageX;
            this.touchY = this.originY = event.stageY;
            this.velocityX = this.velocityY = 0;
            this.touching = true;
            this.touchTime = time;
        }

        private onTouchMove(event: egret.TouchEvent) {
            if (!this.touching) {
                return;
            }

            if (this.dragging) {
                let dx = event.stageX - this.touchX;
                let dy = event.stageY - this.touchY;
                let time = egret.getTimer() * 0.001;

                this.updateVelocity(dx, dy, time - this.touchTime);
                if (!this.emitEvent(GestureEvent.DragMove, event)) {
                    this.touching = this.dragging = false;
                }
                this.touchX = event.stageX;
                this.touchY = event.stageY;
                this.touchTime = time;

            } else {
                let dx = event.stageX - this.originX;
                let dy = event.stageY - this.originY;

                if (dx * dx + dy * dy > this.tapRange * this.tapRange) {
                    if (this.emitEvent(GestureEvent.DragBegin, event)) {
                        this.touching = this.dragging = true;
                        this.tapped = 0;
                    }
                }
            }
        }

        private onTouchEnd(event: egret.TouchEvent) {
            if (!this.touching) {
                return;
            }
            this.touching = false;

            if (this.dragging) {
                this.dragging = false;
                this.emitEvent(GestureEvent.DragEnd, event);
                return;
            }
            let time = egret.getTimer();

            if (this.enableLongPress && this.longPressTime > 0 && time - this.touchTime > this.longPressTime) {
                this.tapped = 0;
                this.emitEvent(GestureEvent.LongPressed, event);
                return;
            }

            this.tapped++;
            this.tapTime = time;

            if (this.tapped == 1) {
                if (!this.emitEvent(GestureEvent.Tap, event)) this.tapped = 0;
                if (!this.enableDoubleTap && !this.enableTripleTap && !this.enableComboTap) this.tapped = 0;
                return;
            }

            if (this.enableDoubleTap && this.tapped == 2) {
                if (!this.emitEvent(GestureEvent.DoubleTap, event)) this.tapped = 0;
                if (!this.enableTripleTap && !this.enableComboTap) this.tapped = 0;
                return;
            }

            if (this.enableTripleTap && this.tapped == 3) {
                if (!this.emitEvent(GestureEvent.TripleTap, event)) this.tapped = 0;
                if (!this.enableComboTap) this.tapped = 0;
                return;
            }

            if (this.enableComboTap && this.tapped > 3) {
                if (!this.emitEvent(GestureEvent.ComboTap, event)) this.tapped = 0;
                if (!this.enableComboTap) this.tapped = 0;
                return;
            }
        }

        private onReleaseOutside(event: egret.TouchEvent) {
            if (event.target == this.target) {
                this.onTouchEnd(event);
            }
        }
    }
}
