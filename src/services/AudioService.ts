import { Audio } from "expo-av";
import { Sound } from "expo-av/build/Audio";

class AudioService {
  private sound: Sound | null = null;
  private currentUrl: string | null = null;
  private isPlaying: boolean = false;

  async loadAndPlay(url: string): Promise<void> {
    try {
      // If we're already playing this URL, just resume
      if (this.currentUrl === url && this.sound) {
        await this.play();
        return;
      }

      // Unload previous sound if exists
      await this.unload();

      // Set audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Load and play new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;
      this.currentUrl = url;
      this.isPlaying = true;
    } catch (error) {
      console.error("Error loading audio:", error);
      throw error;
    }
  }

  async play(): Promise<void> {
    if (this.sound) {
      await this.sound.playAsync();
      this.isPlaying = true;
    }
  }

  async pause(): Promise<void> {
    if (this.sound) {
      await this.sound.pauseAsync();
      this.isPlaying = false;
    }
  }

  async togglePlayPause(): Promise<void> {
    if (this.isPlaying) {
      await this.pause();
    } else {
      await this.play();
    }
  }

  async unload(): Promise<void> {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
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

  private onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      this.isPlaying = status.isPlaying;

      // Handle when audio finishes playing
      if (status.didJustFinish) {
        this.isPlaying = false;
      }
    } else if (status.error) {
      console.error("Playback error:", status.error);
    }
  };
}

// Export a singleton instance
export const audioService = new AudioService();
