import { Notification, ipcMain } from "electron";

export function initNotifications() {
  ipcMain.on("notify", (_, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body, silent: true }).show();
    }
  });
}