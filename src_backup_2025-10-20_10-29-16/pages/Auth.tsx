
import { useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthGuard();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Login failed");
    }
    
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-slate-700 mb-6 text-center">
          Station-2100 Login
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-600 text-center">
          <p>Default Admin Credentials:</p>
          <p><strong>Email:</strong> gtthande@gmail.com</p>
          <p><strong>Password:</strong> Password100%</p>
        </div>
      </div>
    </main>
  );
}
