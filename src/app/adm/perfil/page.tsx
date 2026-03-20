"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import axios from "axios";
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  Camera, 
  Trash2, 
  Save, 
  Loader2, 
  Check, 
  X,
  ShieldAlert,
  AlertTriangle
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
}

export default function PerfilPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Deletion Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'partial' | 'total' | null>(null);
  const [isSignoutOut, setIsSigningOut] = useState(false);

  const authServiceUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id as string,
        name: session.user.name || "",
        email: session.user.email as string,
        image: session.user.image as string || null,
        role: (session.user as any).role || "USER"
      });
      setFormData({
        name: session.user.name || "",
        email: session.user.email as string || "",
        password: "",
        confirmPassword: ""
      });
      setAvatarPreview(session.user.image as string || null);
      setLoading(false);
    }
  }, [session]);

  async function fetchProfile() {
    // This is now handled by the useEffect on session
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: "error", text: "As senhas não coincidem." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      if (formData.password) data.append("password", formData.password);
      if (avatarFile) data.append("image", avatarFile);

      const authToken = (session as any)?.authToken;
      const res = await axios.patch(`${authServiceUrl}/api/users/me`, data, {
        withCredentials: true,
        headers: { 
          "Content-Type": "multipart/form-data",
          ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
        }
      });

      setUser(res.data);
      setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      setAvatarFile(null);
      setMessage({ type: "success", text: "Perfil atualizado com sucesso!" });
      
      // Update next-auth session
      await update({
        ...session,
        user: {
          ...session?.user,
          name: res.data.name,
          image: res.data.image
        }
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Erro ao atualizar perfil." });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteMode) return;
    setIsSigningOut(true);

    try {
      const authToken = (session as any)?.authToken;
      const url = `${authServiceUrl}/api/users/me?mode=${deleteMode}${deleteMode === 'partial' ? `&projectId=${projectId}` : ''}`;
      await axios.delete(url, { 
        withCredentials: true,
        headers: {
          ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
        }
      });
      
      // Logout after deletion
      await signOut({ 
        callbackUrl: deleteMode === 'total' ? "/" : "/auth/signin" 
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      setMessage({ type: "error", text: "Erro ao realizar exclusão." });
      setIsSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 px-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
        <p className="text-gray-500 dark:text-gray-400">Gerencie suas informações pessoais e segurança.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 border border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" 
            : "bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
        }`}>
          {message.type === "success" ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Summary */}
        <div className="lg:col-span-1 space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 text-center">
            <div className="relative mx-auto w-32 h-32 rounded-full mb-4 group cursor-pointer overflow-hidden bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-lg">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300">
                  <UserIcon className="w-16 h-16" />
                </div>
              )}
              <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white w-6 h-6 mb-1" />
                <span className="text-[10px] text-white font-bold uppercase tracking-wider">Alterar</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user?.name || "Sem Nome"}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{user?.email}</p>
            <div className="flex justify-center">
              <span className="px-3 py-1 bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400 rounded-full text-xs font-bold uppercase tracking-wider">
                {user?.role === "ADMIN" ? "Admin Senior" : "Usuário"}
              </span>
            </div>
          </section>

          {/* Deletion Section */}
          <section className="rounded-2xl border border-red-100 bg-red-50/30 p-6 shadow-sm dark:border-red-500/10 dark:bg-red-500/5">
            <h3 className="text-red-700 dark:text-red-400 font-bold flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5" /> Zona de Perigo
            </h3>
            <p className="text-xs text-red-600/70 dark:text-red-400/60 mb-6">Ações irreversíveis relacionadas à sua conta e vinculação.</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => { setDeleteMode('partial'); setIsDeleteModalOpen(true); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-100 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/10 transition-all"
              >
                Sair deste Projeto
              </button>
              <button 
                onClick={() => { setDeleteMode('total'); setIsDeleteModalOpen(true); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all"
              >
                <Trash2 className="w-4 h-4" /> Excluir Conta Total
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Information Form */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-lg font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-brand-500" /> Informações Básicas
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-lg font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand-500" /> Segurança
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Senha</label>
                  <div className="relative">
                    <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      placeholder="Repita a nova senha"
                    />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Deixe os campos de senha em branco se não desejar alterá-la.</p>
            </section>

            <div className="flex justify-end pt-2">
              <Button 
                type="submit" 
                disabled={saving}
                className="w-full md:w-auto min-w-[200px] flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} className="max-w-md">
        <div className="p-8 text-center pt-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-500 mb-6 border-4 border-red-50 dark:border-red-500/5 animate-pulse">
            <AlertTriangle className="h-8 w-8" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-tight">
            Confirmar Exclusão {deleteMode === 'partial' ? 'Parcial' : 'Total'}?
          </h2>
          
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            {deleteMode === 'partial' 
              ? "Você será removido deste projeto específico. Caso queira retornar, será necessário um novo convite."
              : "Atenção: sua conta será excluída PERMANENTEMENTE de todos os sistemas desta plataforma. Esta ação não pode ser desfeita."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 order-2 sm:order-1"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleDeleteAccount}
              className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 order-1 sm:order-2"
              disabled={isSignoutOut}
            >
              {isSignoutOut ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar e Sair
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
