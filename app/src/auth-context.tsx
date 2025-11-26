import { createContext } from 'react';

export type AuthContextValue = {
  loggedIn: boolean;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue>({
  loggedIn: true,
  logout: () => {},
});
