import { create } from "zustand";

import { authApi } from "../api/authApi";



const TOKEN_KEY = "mindtrack_token";

const USER_KEY = "mindtrack_user";

const PROFILE_KEY = "mindtrack_profile";



export const useAuthStore = create((set, get) => ({

  token: localStorage.getItem(TOKEN_KEY) || "",

  user: JSON.parse(localStorage.getItem(USER_KEY) || "null"),

  profile: JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"),

  loading: false,

  error: "",



  setSession: ({ token, user, profile }) =>

    set(() => {

      if (token) localStorage.setItem(TOKEN_KEY, token);

      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));

      if (profile !== undefined) {

        if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

        else localStorage.removeItem(PROFILE_KEY);

      }

      return {

        token: token || "",

        user: user || null,

        profile: profile !== undefined ? profile : get().profile,

        error: "",

      };

    }),



  clearSession: () => {

    import("./appStore").then((mod) => {

      mod.useAppStore.getState().disconnectChat();

    });

    set(() => {

      localStorage.removeItem(TOKEN_KEY);

      localStorage.removeItem(USER_KEY);

      localStorage.removeItem(PROFILE_KEY);

      return { token: "", user: null, profile: null, error: "" };

    });

  },



  login: async (payload) => {

    set({ loading: true, error: "" });

    try {

      const data = await authApi.login(payload);

      if (data?.token && data?.user) {

        get().setSession(data);

      }

      return data;

    } catch (error) {

      set({ error: error.message });

      throw error;

    } finally {

      set({ loading: false });

    }

  },



  verifyLogin2FA: async ({ tempToken, code }) => {

    set({ loading: true, error: "" });

    try {

      const data = await authApi.completeLogin2FA({ tempToken, code });

      if (data?.token && data?.user) {

        get().setSession(data);

      }

      return data;

    } catch (error) {

      set({ error: error.message });

      throw error;

    } finally {

      set({ loading: false });

    }

  },



  signup: async (payload) => {

    set({ loading: true, error: "" });

    try {

      const data = await authApi.signup(payload);

      get().setSession(data);

      return data;

    } catch (error) {

      set({ error: error.message });

      throw error;

    } finally {

      set({ loading: false });

    }

  },



  bootstrap: async () => {

    const token = get().token;

    if (!token) return;

    set({ loading: true, error: "" });

    try {

      const data = await authApi.getMe(token);

      get().setSession({ token, user: data?.user || null, profile: data?.profile || null });

    } catch (error) {

      get().clearSession();

      set({ error: error.message });

    } finally {

      set({ loading: false });

    }

  },



  start2FASetup: async () => {

    const token = get().token;

    return authApi.start2FASetup(token);

  },



  verify2FASetup: async (code) => {

    const token = get().token;

    const user = await authApi.verify2FASetup(code, token);

    get().setSession({ token, user });

    return user;

  },



  disable2FA: async ({ password, code }) => {

    const token = get().token;

    const user = await authApi.disable2FA({ password, code }, token);

    get().setSession({ token, user });

    return user;

  },



  acceptTerms: async () => {

    const token = get().token;

    const data = await authApi.acceptTerms(token);

    get().setSession({ token, user: data });

    return data;

  },



  saveOnboardingProfile: async (profile) => {

    const token = get().token;

    if (!token) throw new Error("Not authenticated");

    await authApi.updateMyProfile(profile, token);

    const me = await authApi.getMe(token);

    get().setSession({ token, user: me?.user || get().user, profile: me?.profile || null });

    return me?.profile || null;

  },

}));


