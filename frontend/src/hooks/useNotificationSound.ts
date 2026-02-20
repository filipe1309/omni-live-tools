import { useCallback, useRef } from 'react';

/**
 * Hook that provides a notification sound using Web Audio API.
 * Creates a pleasant ascending two-tone chime.
 */
export function useNotificationSound () {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = getAudioContext();
      const currentTime = audioContext.currentTime;

      // Create a pleasant two-tone ascending chime
      const frequencies = [523.25, 659.25]; // C5 and E5 notes
      const duration = 0.15;
      const gap = 0.1;

      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, currentTime);

        const startTime = currentTime + index * (duration + gap);
        const endTime = startTime + duration;

        // Envelope: quick attack, smooth decay
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);

        oscillator.start(startTime);
        oscillator.stop(endTime);
      });
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }, [getAudioContext]);

  return { playNotificationSound };
}
