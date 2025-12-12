import { ReactNode, useEffect } from "react";
import {
  useAuthProvider,
  AuthContext as SharedAuthContext,
} from "@/hooks/useAuth";

interface AuthProviderProps {
  children: ReactNode;
}

// provider em volta da aplicação usando o contexto compartilhado
export default function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthProvider();

  // loga sempre que o estado do contexto mudar
  useEffect(() => {
    console.log("🔐 AuthProvider state atualizado:", {
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
    });
  }, [auth.user, auth.isAuthenticated, auth.isLoading]);

  return (
    <SharedAuthContext.Provider value={auth}>
      {children}
    </SharedAuthContext.Provider>
  );
}
