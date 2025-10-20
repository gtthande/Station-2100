import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  is_super_admin: boolean;
  profile?: {
    full_name?: string;
    position?: string;
  };
  roles: string[];
}

export function useAuthGuard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch("http://localhost:5055/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.user) {
          setUser(json.user);
        } else {
          localStorage.removeItem("token");
          setUser(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Auth check failed:", err);
        localStorage.removeItem("token");
        setUser(null);
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("http://localhost:5055/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const json = await res.json();
      
      if (res.ok) {
        localStorage.setItem("token", json.token);
        setUser(json.user);
        return { success: true };
      } else {
        return { success: false, error: json.error };
      }
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return { 
    user, 
    isAuthenticated: !!user, 
    loading, 
    login, 
    logout 
  };
}
