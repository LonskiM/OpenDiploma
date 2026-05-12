import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface User {
    id: number;
    name?: string;
    email: string;
    avatarUrl?: string;
    roleId?: number;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuth: boolean;
}

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem("token"),
    isAuth: !!localStorage.getItem("token"),
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuth(
            state,
            action: PayloadAction<{
                user: User;
                token: string;
            }>
        ) {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuth = true;

            localStorage.setItem("token", action.payload.token);
        },
        setUser(state, action: PayloadAction<User>) {
            state.user = action.payload;
            state.isAuth = Boolean(state.token);
        },
        setToken(state, action: PayloadAction<string>) {
            state.token = action.payload;
            state.isAuth = true;
            localStorage.setItem("token", action.payload);
        },

        logout(state) {
            state.user = null;
            state.token = null;
            state.isAuth = false;

            localStorage.removeItem("token");
        },
    },
});

export const { setAuth, setUser, setToken, logout } = authSlice.actions;

export default authSlice.reducer;