import Constants from "expo-constants";

/**
 * API taban adresi. app.json -> expo.extra.apiUrl üzerinden gelir.
 * Fiziksel cihazda test ederken bilgisayarınızın LAN IP'sini kullanın
 * (örn. http://192.168.1.7:3000). localhost cihazdan erişilemez.
 */
export const API_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string) || "http://localhost:3000";
