import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

interface SignInPageProps {
    supabase: SupabaseClient;
    onSwitchToSignUp: () => void;
    onSignInSuccess: () => void;
}

export default function SignInPage({
    supabase,
    onSwitchToSignUp,
    onSignInSuccess,
}: SignInPageProps) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSignIn = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        } else {
            onSignInSuccess();
        }
        setLoading(false);
    };

    return (
        <div>
            <h1>Sign In</h1>
            {error && (
                <div style={{ color: "red", marginBottom: "1rem" }}>
                    <p>✗ {error}</p>
                </div>
            )}
            <form onSubmit={handleSignIn}>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                </button>
            </form>
            <p>
                Don't have an account?{" "}
                <button
                    type="button"
                    onClick={onSwitchToSignUp}
                    style={{ background: "none", border: "none", color: "blue", cursor: "pointer" }}
                >
                    Sign Up
                </button>
            </p>
        </div>
    );
}
