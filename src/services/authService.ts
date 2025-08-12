import { User, Credentials, AuthSession } from "../types/auth";
/**
 * Bertanggung jawab untuk semua logika yang berhubungan dengan otentikasi.
 * masih pake data dummy
 */
class AuthService {
    // user dummy
    private readonly users: (User & { password_hash: string })[] = [
        {
            id: "user-001",
            name: "Admin",
            email: "admin@smip.com",
            password_hash: "password_admin",
            role: "Admin",
            department: "IT Division",
            position: "System Administrator",
        },
        {
            id: "user-002",
            name: "Project Manager",
            email: "pm@smip.com",
            password_hash: "password_pm",
            role: "Project Manager",
            department: "Product Development Division",
            position: "Project Manager",
        },
        {
            id: "user-003",
            name: "Budi Santoso",
            email: "member@smip.com",
            password_hash: "password_member",
            role: "Team Member",
            department: "Frontend Team",
            position: "Frontend Developer",
        },
    ];

    /**
     * @param credentials - Email dan password pengguna.
     * @returns Promise yang resolve dengan AuthSession (token dan data user) jika berhasil.
     * @throws Error jika kredensial tidak valid.
     */
    public async login(credentials: Credentials): Promise<AuthSession> {
        console.log(`Mencoba login dengan email: ${credentials.email}`);

        // network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const user = this.users.find(u => u.email === credentials.email);

        // Cek apakah user ada dan password cocok
        if (!user || user.password_hash !== credentials.password) {
            console.error("Login gagal: Email atau password salah.");
            throw new Error("Email atau password yang Anda masukkan salah.");
        }

        // Jika berhasil, buat token JWT palsu
        const token = this.generateDummyJWT({ id: user.name, role: user.role });

        console.log(`Login berhasil untuk user: ${user.name}, Role: ${user.role}`);

        // Hapus password hash dari objek user sebelum return
        const { password_hash, ...userWithoutPassword } = user;

        return {
            token,
            user: userWithoutPassword,
        };
    }

    /**
     * Token JWT Palsu
     * @param payload - Data yang akan dimasukkan ke dalam token.
     * @returns String token JWT.
     */
    private generateDummyJWT(payload: object): string {
        const header = { alg: "HS256", typ: "JWT" };

        // Meng-encode header dan payload ke Base64Url
        const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

        // Dummy Signature
        const signature = "dummy-signature-secret";

        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }
}

export const authService = new AuthService();
