// AudioRecorder.ts
import { Audio, AVPlaybackStatus, AVPlaybackStatusToSet } from 'expo-av';
import { Alert } from 'react-native';

export default class AudioRecorder {
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;

  /**
   * Returns current recording state
   */
  public getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Starts a new audio recording
   */
  public async startRecording(): Promise<void> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Microphone permission is required to record audio');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      if (this.recording) {
        console.warn('A recording is already in progress.');
        return;
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        this.onRecordingStatusUpdate.bind(this)
      );

      this.recording = recording;
      this.isRecording = true;
      console.log('Recording started');
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', `Failed to start recording: ${error.message}`);
    }
  }

  /**
   * Stops the current recording and returns the URI
   */
  public async stopRecording(): Promise<string | null> {
    try {
        console.log('this.recordding, ', this.recording);
        if (!this.recording) return null;
        
        console.log('this.recorg, ', this.recording);
        await this.recording.stopAndUnloadAsync();
        console.log('this.re, ', this.recording);
      const uri = this.recording.getURI();
      console.log('Recording saved at:', uri);
      return uri ?? null;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    } finally {
      this.recording = null;
      this.isRecording = false;
    }
  }

  /**
   * Handles recording status changes
   */
  private onRecordingStatusUpdate(status: Audio.RecordingStatus): void {
    console.log('status.isRecording', status.isRecording);
    console.log('status.isRecording not', !status.isRecording);
    console.log('this.isRecording', this.isRecording);
    if (!status.isRecording && this.isRecording) {
      console.warn("Recording stopped unexpectedly");
     // this.recording = null;
      this.isRecording = false;
    }
  }
}
