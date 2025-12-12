import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// Fallback fixo
const fallbackConfig: FirebaseOptions = {
  apiKey: "AIzaSyDI3BRH44JpubuDzFZzJ23OfFccZ2-0efo",
  authDomain: "biobox-1ad4a.firebaseapp.com",
  projectId: "biobox-1ad4a",
  storageBucket: "biobox-1ad4a.appspot.com", // ✅ Corrigido aqui!
  messagingSenderId: "782207164797",
  appId: "1:782207164797:web:a5d2d12d09733327456c14",
  measurementId: "G-JDQ4DYC5EH",
};

// Pega das variáveis de ambiente se existirem
const configFromEnv = (() => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

  if (
    apiKey &&
    authDomain &&
    projectId &&
    storageBucket &&
    messagingSenderId &&
    appId
  ) {
    const baseConfig: FirebaseOptions = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    };

    return measurementId ? { ...baseConfig, measurementId } : baseConfig;
  }

  return null;
})();

// Usa config válida (env > fallback)
const config: FirebaseOptions = configFromEnv ?? fallbackConfig;

// Confirmação real de configuração
export const isFirebaseConfigured = !!config.apiKey && !!config.projectId;

// Inicializa
export const app = getApps().length ? getApps()[0]! : initializeApp(config);

// Serviços
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});
