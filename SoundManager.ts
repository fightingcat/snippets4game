namespace utils {
	class NullSoundChannel extends egret.EventDispatcher implements egret.SoundChannel {
		volume: number;
		position: number;
		stop() { }
	}

	export class SoundManager {
		private static mMusicEnabled: boolean = true;	// 是否启用背景音乐
		private static mSoundEnabled: boolean = true;	// 是否启用音效
		private static mMusicVolume: number = 1;		// 背景音乐音量
		private static mSoundVolume: number = 1;		// 音效音量
		private static mMusicDuration: number = 0;		// 背景音乐进度，用于暂停
		private static mMusicRes: egret.Sound = null;				// 背景音乐资源
		private static mMusicChannel: egret.SoundChannel = null;	// 在播的背景音乐
		private static mSoundChannels: egret.SoundChannel[] = [];	// 在播的音效
		private static mNullSoundChannel = new NullSoundChannel();	// 用于容错处理

		/**
		 * 是否在播放背景音乐。
		 */
		public static get isMusicPlaying(): boolean {
			return this.mMusicChannel != null;
		}

		/**
		 * 是否启用音效
		 */
		public static get soundEnabled() {
			return this.mSoundEnabled;
		}

		public static set soundEnabled(enable: boolean) {
			if (!enable) {
				this.stopAllSound();
			}
			this.mSoundEnabled = enable;
		}

		/**
		 * 是否启用音乐
		 */
		public static get musicEnabled() {
			return this.mMusicEnabled;
		}

		public static set musicEnabled(enable: boolean) {
			this.mMusicEnabled = enable;
			if (enable) {
				this.mMusicDuration = 0;
				this.resumeMusic();
			}
			else {
				this.pauseMusic();
			}
		}

		/**
		 * 音效音量(取值范围0-1)
		 */
		public static get soundVolume(): number {
			return this.mSoundVolume;
		}

		public static set soundVolume(volume: number) {
			for (let sound of this.mSoundChannels) {
				sound.volume = volume;
			}
			this.mSoundVolume = volume;
		}

		/**
		 * 背景音乐音量(取值范围0-1)
		 */
		public static get musicVolume(): number {
			return this.mMusicVolume;
		}

		public static set musicVolume(volume: number) {
			if (this.mMusicChannel) {
				this.mMusicChannel.volume = volume;
			}
			this.mMusicVolume = volume;
		}

		/**
		 * 播放音效。
		 * @param 音效资源名
		 * @param 循环次数。默认1次。
		 * @param 起始进度。默认为0。
		 * @return egret.SoundChannel
		 */
		public static playSound(resName: string, loop: number = 1, position: number = 0): egret.SoundChannel {
			let channel: egret.SoundChannel;

			if (this.mSoundEnabled) {
				let sound: egret.Sound = RES.getRes(resName.replace(/\./g, '_'));

				if (channel = sound ? sound.play(position, loop) : null) {
					this.mSoundChannels.push(channel);
					channel.volume = this.mSoundVolume;
					channel.once(egret.Event.SOUND_COMPLETE, this.onSoundComplete, this);
				}
			}
			return channel || this.mNullSoundChannel;
		}

		/**
		 * 播放音效(异步加载)。
		 * @param 音效资源名
		 * @param 循环次数。默认1次。
		 * @param 起始进度。默认为0。
		 * @return egret.SoundChannel
		 */
		public static playSoundAsync(resName: string, loop: number = 1, position: number = 0): Promise<egret.SoundChannel> {
			if (this.mSoundEnabled) {
				resName = resName.replace(/\./g, '_');
				return RES.getResAsync(resName).then(() => this.playSound(resName, loop, position));
			}
			return Promise.resolve(this.mNullSoundChannel);
		}

		/**
		 * 音效播放结束事件回调
		 */
		private static onSoundComplete(event: egret.Event) {
			let idx = this.mSoundChannels.indexOf(event.target);
			if (idx != -1) {
				this.mSoundChannels.splice(idx, 1);
			}
		}

		/**
		 * 播放背景音乐。
		 * @param 音乐资源名
		 */
		public static playMusic(resName: string): egret.SoundChannel {
			let channel: egret.SoundChannel;

			if (this.mMusicEnabled) {
				let music: egret.Sound = RES.getRes(resName.replace(/\./g, '_'));

				if (this.mMusicChannel) {
					this.mMusicChannel.stop();
				}
				if (channel = music ? music.play() : null) {
					channel.volume = this.mMusicVolume;
					this.mMusicChannel = channel;
					this.mMusicRes = music;
				}
			}
			return channel || this.mNullSoundChannel;
		}


		/**
		 * 播放背景音乐。
		 * @param 音乐资源名
		 */
		public static playMusicAsync(resName: string): Promise<egret.SoundChannel> {
			if (this.mMusicEnabled) {
				resName = resName.replace(/\./g, '_');
				return RES.getResAsync(resName).then(() => this.playMusic(resName));
			}
			return Promise.resolve(this.mNullSoundChannel);
		}

		/**
		 * 停止播放背景音乐。
		 */
		public static stopMusic() {
			if (this.mMusicChannel) {
				this.mMusicChannel.stop();
				this.mMusicChannel = null;
				this.mMusicRes = null;
			}
		}

		/**
		 * 暂停播放背景音乐(保存进度)。
		 */
		public static pauseMusic() {
			if (this.mMusicChannel) {
				this.mMusicDuration = this.mMusicChannel.position;
				this.mMusicChannel.stop();
				this.mMusicChannel = null;
			}
		}

		/**
		 * 恢复播放背景音乐。
		 */
		public static resumeMusic() {
			if (this.mMusicEnabled && this.mMusicRes && !this.mMusicChannel) {
				this.mMusicChannel = this.mMusicRes.play(this.mMusicDuration);
				this.mMusicChannel.volume = this.mMusicVolume;
			}
		}

		/**
		 * 停止所有音效
		 */
		public static stopAllSound() {
			for (let sound of this.mSoundChannels) {
				sound.stop();
			}
			this.mSoundChannels.length = 0;
		}
	}
}
