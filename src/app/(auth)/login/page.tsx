import LoginForm from "@/src/components/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login",
    description: "Masuk ke SIMADEP untuk mengelola pekerjaan departemen.",
};

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background-light">
            <LoginForm />
        </div>
    );
}
