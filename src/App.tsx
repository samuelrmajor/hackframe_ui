import "./index.css";
import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import SignInPage from "./components/SignInPage";
import SignUpPage from "./components/SignUpPage";
import LoggedInHomePage from "./components/LoggedInHomePage";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

type AuthView = "signin" | "signup";

export default function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [authView, setAuthView] = useState<AuthView>("signin");

    useEffect(() => {
        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });
        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleSignInSuccess = () => {
        // Session will be set by onAuthStateChange listener
    };

    const handleSignUpSuccess = () => {
        setAuthView("signin");
    };

    // If user is logged in, show home page
    if (session) {
        return (
            <LoggedInHomePage
                session={session}
                supabase={supabase}
                onLogout={() => setSession(null)}
            />
        );
    }

    // Show sign in or sign up page
    return (
        <>
            {authView === "signin" ? (
                <SignInPage
                    supabase={supabase}
                    onSwitchToSignUp={() => setAuthView("signup")}
                    onSignInSuccess={handleSignInSuccess}
                />
            ) : (
                <SignUpPage
                    supabase={supabase}
                    onSwitchToSignIn={() => setAuthView("signin")}
                    onSignUpSuccess={handleSignUpSuccess}
                />
            )}
        </>
    );
}