import { AudioModule, createAudioPlayer, AudioPlayer } from "expo-audio";

class AudioService {
  private player: AudioPlayer | null = null;
  private currentUrl: string | null = null;
  private isPlaying: boolean = false;
  private switching: boolean = false;
  private volume: number = 1;
  private repeat: boolean = false;

  async loadAndPlay(url: string): Promise<void> {
    try {
      if (this.currentUrl === url && this.player) {
        this.play();
        return;
      }

      await this.unload();

      if (AudioModule && typeof AudioModule.setAudioModeAsync === "function") {
        await AudioModule.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        } as any);
      }

      const source = { uri: url };
      // @ts-ignore - CreateAudioPlayerOptions might differ, relying on simple usage
      this.player = createAudioPlayer(source, { autoPlay: true });

      // Attempt to listen to status updates if supported
      // @ts-ignore
      if (this.player.addListener) {
        // @ts-ignore
        this.player.addListener("playbackStatusUpdate", (status: any) => {
          if (status) {
            this.isPlaying = status.playing;
            if (status.didJustFinish) {
              this.isPlaying = false;
              if (this.repeat && this.currentUrl) {
                this.loadAndPlay(this.currentUrl);
              }
            }
          }
        });
      }

      this.currentUrl = url;
      (this.player as any)?.pause?.();
      (this.player as any)?.stop?.();
      if ((this.player as any)?.setVolume) {
        (this.player as any).setVolume(this.volume);
      }
      this.player.play();
      this.isPlaying = true;
    } catch (error) {
      console.error("Error loading audio:", error);
      throw error;
    }
  }

  play(): void {
    if (this.player) {
      this.player.play();
      this.isPlaying = true;
    }
  }

  pause(): void {
    if (this.player) {
      this.player.pause();
      this.isPlaying = false;
    }
  }

  togglePlayPause(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  async unload(): Promise<void> {
    if (!this.player) return;
    try {
      (this.player as any)?.pause?.();
      (this.player as any)?.stop?.();
      if ((this.player as any)?.unload) {
        await Promise.resolve((this.player as any).unload());
      } else if ((this.player as any)?.remove) {
        (this.player as any).remove();
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Audio unload error", e);
    } finally {
      this.player = null;
      this.currentUrl = null;
      this.isPlaying = false;
      await Promise.resolve();
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentUrl(): string | null {
    return this.currentUrl;
  }

  setVolume(level: number): void {
    const next = Math.min(1, Math.max(0, level));
    this.volume = next;
    if (this.player && (this.player as any)?.setVolume) {
      (this.player as any).setVolume(next);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  setRepeat(enabled: boolean): void {
    this.repeat = enabled;
  }

  getRepeat(): boolean {
    return this.repeat;
  }
}

export const audioService = new AudioService();
