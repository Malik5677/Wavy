import AsyncStorage from "@react-native-async-storage/async-storage";

export const secureStorage = {
  set: async (key: string, value: string) => AsyncStorage.setItem(key, value),
  get: async (key: string) => AsyncStorage.getItem(key),
  remove: async (key: string) => AsyncStorage.removeItem(key),
};

export const mmkvStorage = {
  setString: async (key: string, value: string) => AsyncStorage.setItem(key, value),
  getString: async (key: string) => AsyncStorage.getItem(key),
  delete: async (key: string) => AsyncStorage.removeItem(key),
};
