import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCm6A3ecdnRuM2BtqcU8hbViNVmtSYowNE",
  authDomain: "crm-notification-system-b1fbf.firebaseapp.com",
  projectId: "crm-notification-system-b1fbf",
  storageBucket: "crm-notification-system-b1fbf.firebasestorage.app",
  messagingSenderId: "822813005343",
  appId: "1:822813005343:web:9b60be7829ac4a5615e72a"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestFCMToken = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const token = await getToken(messaging, {
      vapidKey: "BOrsq40DwgRJYZ6MUfTq6evI-iBEF2rknTh-sgONupO8DJNDFiZF-nRY49GAOE8fwUwqa_I2R0nXYTmkUHmC1eU",
      serviceWorkerRegistration: await navigator.serviceWorker.register("/firebase-messaging-sw.js")
    });

    return token;
  } catch (err) {
    console.error("FCM Token error:", err);
    return null;
  }
};

export { onMessage };