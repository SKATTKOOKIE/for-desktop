export function injectSounds(webContents: Electron.WebContents) {
  webContents.on("did-finish-load", () => {
    webContents.executeJavaScript(`
      (function() {
        if (window.__soundsInjected) return;
        window.__soundsInjected = true;

        let ctx = null;
        function getAudioContext() {
          if (!ctx) ctx = new AudioContext();
          return ctx;
        }

        function playTone(frequency, duration, volume = 0.1) {
          try {
            const audio = getAudioContext();
            const oscillator = audio.createOscillator();
            const gain = audio.createGain();
            oscillator.connect(gain);
            gain.connect(audio.destination);
            oscillator.type = "sine";
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(volume, audio.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
            oscillator.start(audio.currentTime);
            oscillator.stop(audio.currentTime + duration);
          } catch(e) {}
        }

        function playConnectSound() {
          playTone(660, 0.15);
          setTimeout(() => playTone(880, 0.2), 150);
        }

        function playDisconnectSound() {
          playTone(880, 0.15);
          setTimeout(() => playTone(440, 0.3), 150);
        }

        const OriginalWebSocket = window.WebSocket;

        window.WebSocket = class extends OriginalWebSocket {
          constructor(...args) {
            super(...args);

            this.addEventListener("message", (event) => {
              try {
                const data = JSON.parse(event.data);

                if (data.type === "VoiceChannelJoin") playConnectSound();
                if (data.type === "VoiceChannelLeave") playDisconnectSound();

              } catch {}
            });
          }
        };
      })();
    `);
  });
}