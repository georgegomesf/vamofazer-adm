"use server";

import axios from "axios";

export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const callbackUrl = formData.get("callbackUrl") as string || "/";
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

    try {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/mobile/register`, {
            name,
            email,
            password,
            projectId,
            callbackUrl,
            environment: 'web'
        });

        return res.data;
    } catch (error) {
        return { error: (error as any).response?.data?.error || "Erro ao registrar usuário" };
    }
}
