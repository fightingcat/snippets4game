namespace utils {

    interface Trigger extends Promise<dragonBones.EventObject> {
        resolve(value: dragonBones.EventObject);
    }

    function getAnimName(event: dragonBones.EventObject): string {
        return event && event.animationState && event.animationState.name;
    }

    function getEventName(event: dragonBones.EventObject): string {
        return event && event.name;
    }

    export function createArmature(url: string, armatureName = 'armatureName'): dragonBones.Armature {
        let factory: dragonBones.EgretFactory = new dragonBones.EgretFactory();
        let bone = RES.getRes(url + '_ske_json');
        let atlas = RES.getRes(url + '_tex_json');
        let texture = RES.getRes(url + '_tex_png');

        factory.addDragonBonesData(dragonBones.DataParser.parseDragonBonesData(bone));
        factory.addTextureAtlas(new dragonBones.EgretTextureAtlas(texture, atlas));
        return factory.buildArmature(armatureName);
    }

    export async function createArmatureAsync(url: string, armatureName = 'armatureName') {
        let factory: dragonBones.EgretFactory = new dragonBones.EgretFactory();
        let bone = await RES.getResAsync(url + '_ske_json');
        let atlas = await RES.getResAsync(url + '_tex_json');
        let texture = await RES.getResAsync(url + '_tex_png');

        factory.addDragonBonesData(dragonBones.DataParser.parseDragonBonesData(bone));
        factory.addTextureAtlas(new dragonBones.EgretTextureAtlas(texture, atlas));
        return factory.buildArmature(armatureName);
    }

    export class SkeletonAnimation extends egret.DisplayObjectContainer {
        private static mResolvedNull = Promise.resolve(null);
        private mEventMap: { [key: string]: Trigger } = {};
        private mMixingMap: { [key: string]: { [key: string]: number } } = {};
        private mScheduleTimes: number = 0;
        private mLoop: number;
        private mLastTime: number;
        private mAutoRun: boolean;
        private mAnimStat: dragonBones.AnimationState;

        public constructor(private mArmature: dragonBones.Armature) {
            super();
            this.addChild(mArmature.display);
            this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddedToStage, this);
            this.addEventListener(egret.Event.REMOVED_FROM_STAGE, this.onRemovedFromStage, this);
            this.touchEnabled = true;
            (mArmature.display as egret.DisplayObject).touchEnabled = true;
        }

        public get armature(): dragonBones.Armature {
            return this.mArmature;
        }

        public get width(): number {
            return this.mArmature.display.width;
        }

        public get height(): number {
            return this.mArmature.display.height;
        }

        /**
         * 对应spine的setMix方法
         * @param anim1 要混合的动画
         * @param anim2 要混合的动画
         * @param duration 混合过渡时间
         */
        public setMix(anim1: string, anim2: string, duration: number) {
            let map1 = this.mMixingMap[anim1] || (this.mMixingMap[anim1] = {});
            let map2 = this.mMixingMap[anim2] || (this.mMixingMap[anim2] = {});
            map1[anim2] = map2[anim1] = duration;
        }

        /**
         * 从头开始播放一个动画
         * @param animName 动画名称
         * @param times 播放次数(默认无限)。[-1: 使用动画数据默认值, 0: 无限循环播放, [1~N]: 循环播放 N 次]
         * @param autoRun 是否自动播放(默认true)。为true时将自动调用autoSchedule()。
         * @return 返回对象自身以供链式调用。
         */
        public play(animName: string, times = 0, autoRun = true) {
            const animation = this.mArmature.animation;

            this.mLoop = times;
            if (!autoRun != !this.mAutoRun) {
                this.mAutoRun = autoRun;
                autoRun ? this.autoSchedule() : this.stopSchedule();
            }
            if (animation.isPlaying) {
                const mixing = this.mMixingMap[animation.lastAnimationName];
                this.interruptEvents();
                if (mixing && mixing[animName]) {
                    this.mAnimStat = animation.fadeIn(animName, mixing[animName], times);
                    this.observeEvent(dragonBones.EventObject.COMPLETE);
                    return this;
                }
            }
            this.mAnimStat = animation.gotoAndPlayByFrame(animName, 0, times);
            this.observeEvent(dragonBones.EventObject.COMPLETE);
            return this;
        }

        /**
         * 暂停当前播放的动画
         * @return 返回对象自身以供链式调用。
         */
        public pause() {
            const animation = this.mArmature.animation;
            animation.stop(animation.lastAnimationName);
            return this;
        }

        /**
         * 恢复当前播放的动画
         * @return 返回对象自身以供链式调用。
         */
        public resume() {
            const animation = this.mArmature.animation;
            animation.play(animation.lastAnimationName, this.mLoop);
            return this;
        }

        /**
         * 停止当前播放的动画(重置动画状态)
         * @return 返回对象自身以供链式调用。
         */
        public stop(reset?: boolean) {
            if (reset) this.mArmature.animation.reset();
            this.stopSchedule();
            return this;
        }

        /**
         * 返回等待播放结束的Promise
         * resolve值: string 动画名称 | null 动画不存在或被中断
         */
        public whenComplete(): Promise<string> {
            return this.observeEvent(dragonBones.EventObject.COMPLETE).then(getAnimName);
        }

        /**
         * 返回等待播放循环一次结束的Promise
         * resolve值: string 动画名称 | null 动画不存在或被中断
         */
        public whenLoopEnd(): Promise<string> {
            return this.observeEvent(dragonBones.EventObject.LOOP_COMPLETE).then(getAnimName);
        }

        /**
         * 返回等待关键帧事件的Promise
         * resolve值: string 帧标签 | null 动画完成或被中断
         */
        public whenFrameEvent(): Promise<string> {
            return this.observeEvent(dragonBones.EventObject.FRAME_EVENT).then(getEventName);
        }

        /**
         * 返回等待声音事件的Promise
         * resolve值: string 声音标签 | null 动画完成或被中断
         */
        public whenSoundEvent(): Promise<string> {
            return this.observeEvent(dragonBones.EventObject.SOUND_EVENT).then(getEventName);
        }

        /**
         * 返回等待一个事件的Promise
         * @param eventType 事件类型
         * @return resolve值: dragonBones.EventObject 事件对象 | null 动画完成或被中断
         */
        public observeEvent(eventType: dragonBones.EventStringType): Promise<dragonBones.EventObject> {
            if (!this.mAnimStat || this.mAnimStat.isCompleted) {
                // animation didn't start or has been stopped, resolve to null.
                return SkeletonAnimation.mResolvedNull;
            }
            if (this.mEventMap[eventType]) {
                // reuse existing promise.
                return this.mEventMap[eventType];
            }
            if (!this.mEventMap.hasOwnProperty(eventType)) {
                // event type doesn't exist in event map, therefore not listened yet.
                this.mArmature.addEventListener(eventType, this.onEventCallback, this);
            }
            let resolve, promise = new Promise(cb => resolve = cb) as Trigger;
            promise.resolve = resolve;
            return this.mEventMap[eventType] = promise;
        }

        /**
         * 更新动画(需要每帧调用)
         * @param dt 帧间时间
         */
        public update(dt: number) {
            this.mArmature.advanceTime(dt);
        }

        /**
         * 自动调用更新动画(基于计数管理)
         */
        public autoSchedule() {
            if (0 == this.mScheduleTimes++) {
                this.mLastTime = egret.getTimer() * 0.001;
                this.addEventListener(egret.Event.ENTER_FRAME, this.onSchedule, this);
            }
        }

        /**
         * 停止自动调用更新动画
         */
        public stopSchedule() {
            if (--this.mScheduleTimes <= 0) {
                this.mScheduleTimes = 0;
                this.removeEventListener(egret.Event.ENTER_FRAME, this.onSchedule, this);
            }
        }

        private interruptEvents() {
            for (let event of Object.keys(this.mEventMap)) {
                const promise = this.mEventMap[event];

                if (promise) {
                    promise.resolve(null);
                    this.mEventMap[event] = null;
                }
            }
        }

        private onAddedToStage() {
            if (this.mScheduleTimes > 0) {
                this.addEventListener(egret.Event.ENTER_FRAME, this.onSchedule, this);
            }
        }

        private onRemovedFromStage() {
            if (this.mScheduleTimes > 0) {
                this.removeEventListener(egret.Event.ENTER_FRAME, this.onSchedule, this);
            }
        }

        private onEventCallback(event: dragonBones.Event) {
            const type = event.type;
            const promise = this.mEventMap[type];

            if (promise) {
                promise.resolve({ ...event.eventObject } as any);
                this.mEventMap[type] = null;
            }
            if (type == dragonBones.EventObject.COMPLETE) {
                if (this.mAutoRun) {
                    this.mAutoRun = false;
                    this.stopSchedule();
                }
                this.interruptEvents();
            }
        }

        private onSchedule() {
            let time = egret.getTimer() * 0.001;
            this.mArmature.advanceTime(time - this.mLastTime);
            this.mLastTime = time;
        }
    }
}
