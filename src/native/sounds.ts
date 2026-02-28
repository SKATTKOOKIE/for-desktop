import { toastScript } from "./toasts";

export function injectSounds(webContents: Electron.WebContents) {
  webContents.on("did-finish-load", () => {
    webContents.executeJavaScript(`
      (function() {
        if (window.__soundsInjected) return;
        window.__soundsInjected = true;

        ${toastScript}

        let ctx = null;
        let currentUserId = null;
        let currentChannelId = null;
        const roleNameCache = {};
        const userNameCache = {};

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

        function playUserJoinSound() {
          playTone(880, 0.15, 0.05);
        }

        function playUserLeaveSound() {
          playTone(440, 0.15, 0.05);
        }

        function playMentionSound() {
          playTone(1200, 0.1, 0.08);
          setTimeout(() => playTone(1200, 0.15, 0.08), 120);
        }

        const OriginalWebSocket = window.WebSocket;

        window.WebSocket = class extends OriginalWebSocket {
          constructor(...args) {
            super(...args);

            this.addEventListener("message", (event) => {
              try {
                const data = JSON.parse(event.data);

                if (data.type === "Ready") {
                  if (data.users) {
                    const self = data.users.find(u => u.relationship === "User");
                    if (self) currentUserId = self._id;
                    for (const user of data.users) {
                      if (user._id && user.username) userNameCache[user._id] = user.username;
                    }
                  }
                  if (data.servers) {
                    for (const server of data.servers) {
                      if (server.roles) {
                        for (const role of Object.values(server.roles)) {
                          roleNameCache[role._id] = role.name;
                        }
                      }
                    }
                  }
                }

                if (data.type === "UserUpdate" && data.id && data.data?.username) {
                  userNameCache[data.id] = data.data.username;
                }

                if (data.type === "VoiceChannelJoin" && data.state?.id === currentUserId) {
                  currentChannelId = data.id;
                  playConnectSound();
                }

                if (data.type === "VoiceChannelLeave" && data.user === currentUserId) {
                  currentChannelId = null;
                  playDisconnectSound();
                }

                if (data.type === "VoiceChannelJoin" && data.state?.id !== currentUserId && currentChannelId && data.id === currentChannelId) {
                  playUserJoinSound();
                }

                if (data.type === "VoiceChannelLeave" && data.user !== currentUserId && currentChannelId && data.id === currentChannelId) {
                  playUserLeaveSound();
                }

                if (data.type === "Message" && data.role_mentions?.length > 0 && data.member?.roles?.length > 0) {
                  const matchedRoleId = data.role_mentions.find(roleId => data.member.roles.includes(roleId));
                  if (matchedRoleId) {
                    playMentionSound();
                    const senderName = userNameCache[data.author] || data.author || "Someone";
                    const roleName = roleNameCache[matchedRoleId] || matchedRoleId;
                    const content = data.content?.replace(/<%[^>]+>/g, '@' + roleName).trim() || "New message";
                    __showMentionToast(senderName, roleName, content);
                  }
                }

              } catch {}
            });
          }
        };
      })();
    `);
  });
}