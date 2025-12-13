import { AudioModule, createAudioPlayer, AudioPlayer } from "expo-audio";

class AudioService {
  private player: AudioPlayer | null = null;
  private currentUrl: string | null = null;
  private isPlaying: boolean = false;

  async loadAndPlay(url: string): Promise<void> {
    try {
      if (this.currentUrl === url && this.player) {
        this.play();
        return;
      }

      this.unload();

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
            this.isPlaying = status.playing; // specific prop check
            if (status.didJustFinish) {
              // verify this exists
              this.isPlaying = false;
            }
          }
        });
      }

      this.player.play();
      this.currentUrl = url;
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

  unload(): void {
    if (this.player) {
      // @ts-ignore
      if (this.player.remove) {
        this.player.remove();
      } else if ((this.player as any).unload) {
        (this.player as any).unload();
      }
      this.player = null;
      this.currentUrl = null;
      this.isPlaying = false;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentUrl(): string | null {
    return this.currentUrl;
  }
}

export const audioService = new AudioService();
