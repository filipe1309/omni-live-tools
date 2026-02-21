import { useEffect, useRef } from 'react';

/**
 * Hook to prevent browser from throttling timers and animations when tab is in background.
 * Uses Web Audio API to play silent audio, keeping the tab "active".
 * This is useful for screen sharing scenarios where the poll results page
 * needs to continue updating even when it's not the focused window.
 */
export function useBackgroundKeepAlive(enabled: boolean = true) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Create audio context and silent oscillator
    const startKeepAlive = () => {
      try {
        // Use webkitAudioContext for older Safari
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        audioContextRef.current = new AudioContextClass();
        const ctx = audioContextRef.current;

        // Create oscillator
        oscillatorRef.current = ctx.createOscillator();
        oscillatorRef.current.frequency.value = 1; // Very low frequency, inaudible

        // Create gain node with zero volume
        gainNodeRef.current = ctx.createGain();
        gainNodeRef.current.gain.value = 0.00001; // Essentially silent

        // Connect: oscillator -> gain -> destination
        oscillatorRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(ctx.destination);

        // Start the oscillator
        oscillatorRef.current.start();

        console.log('[KeepAlive] Background keep-alive started');
      } catch (error) {
        console.warn('[KeepAlive] Failed to start background keep-alive:', error);
      }
    };

    const stopKeepAlive = () => {
      try {
        if (oscillatorRef.current) {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
          oscillatorRef.current = null;
        }
        if (gainNodeRef.current) {
          gainNodeRef.current.disconnect();
          gainNodeRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        console.log('[KeepAlive] Background keep-alive stopped');
      } catch (error) {
        console.warn('[KeepAlive] Error stopping keep-alive:', error);
      }
    };

    // Start on user interaction to satisfy autoplay policies
    const handleUserInteraction = () => {
      if (!audioContextRef.current) {
        startKeepAlive();
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };

    // Listen for any user interaction to start the audio context
    document.addEventListener('click', handleUserInteraction, { once: false });
    document.addEventListener('keydown', handleUserInteraction, { once: false });
    document.addEventListener('touchstart', handleUserInteraction, { once: false });

    // Try to start immediately (may fail due to autoplay policies)
    startKeepAlive();

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      stopKeepAlive();
    };
  }, [enabled]);
}
