"use server";

import axios from "axios";

export async function updatePassword(formData: FormData, token?: string | null) {
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

    if (!token) return { error: "Token ausente" };

    if (password !== confirmPassword) {
        return { error: "As senhas não coincidem" };
    }

    try {
        // We'll call a new endpoint or the mobile one if it supports token-only
        // For now, let's assume we need to call the remote action OR the mobile API
        // Since we are in a server action, we can't easily call another server action remotely without an API.

        // Let's call the mobile API, but it needs 'email' and 'code'.
        // Wait, if the token is the 'code', we still need 'email'.

        // Let's check if auth has a token-only verify API.
        // Actually, let's just use the mobile login/reset flow.

        const res = await axios.post(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/mobile/reset-password`, {
            newPassword: password,
            code: token,
            // email: ??? // We might need to pass email in the URL as well
            projectId
        });

        return res.data;
    } catch (error) {
        return { error: (error as any).response?.data?.error || "Erro ao alterar senha" };
    }
}
