import LoginForm from "@/src/components/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | Sistem Manajemen dan Informasi Proyek",
    description: "Masuk ke sistem untuk mengelola proyek Anda.",
};

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background-light">
            <LoginForm />
        </div>
    );
}