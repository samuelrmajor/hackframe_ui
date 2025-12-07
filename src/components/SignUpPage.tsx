import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

interface SignUpPageProps {
    supabase: SupabaseClient;
    onSwitchToSignIn: () => void;
    onSignUpSuccess: () => void;
}

export default function SignUpPage({
    supabase,
    onSwitchToSignIn,
    onSignUpSuccess,
}: SignUpPageProps) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSignUp = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin,
            },
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
            setTimeout(() => {
                onSignUpSuccess();
            }, 2000);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div>
                <h1>Sign Up</h1>
                <div style={{ color: "green" }}>
                    <p>✓ Account created successfully!</p>
                    <p>Redirecting to sign in...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1>Sign Up</h1>
            {error && (
                <div style={{ color: "red", marginBottom: "1rem" }}>
                    <p>✗ {error}</p>
                </div>
            )}
            <form onSubmit={handleSignUp}>
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
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword">Confirm Password:</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                </button>
            </form>
            <p>
                Already have an account?{" "}
                <button
                    type="button"
                    onClick={onSwitchToSignIn}
                    style={{ background: "none", border: "none", color: "blue", cursor: "pointer" }}
                >
                    Sign In
                </button>
            </p>
        </div>
    );
}
