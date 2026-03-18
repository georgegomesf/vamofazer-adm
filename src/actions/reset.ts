"use server";

import axios from "axios";

export async function resetPassword(formData: FormData) {
    const email = formData.get("email") as string;
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

    try {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/mobile/reset`, {
            email,
            projectId
        });

        return res.data;
    } catch (error) {
        return { error: (error as any).response?.data?.error || "Erro ao solicitar recuperação" };
    }
}
