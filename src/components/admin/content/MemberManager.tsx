"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
   Users, UserPlus, Mail, Link as LinkIcon,
   Send, Check, X, Loader2, Search,
   MoreVertical, Trash2, Shield, UserCheck,
   Clipboard, ExternalLink, QrCode, Ticket,
   UserCog, AlertCircle, Plus
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import axios from "axios";
import {
   addMemberDirect,
   registerNewMember,
   createInvitation,
   deleteInvitation,
   removeMember
} from "@/actions/groups";
import Badge from "@/components/ui/badge/Badge";

interface MemberManagerProps {
   group: any;
   onRefresh: () => void;
}

export default function MemberManager({ group, onRefresh }: MemberManagerProps) {
   const router = useRouter();
   const searchParams = useSearchParams();
   const pathname = usePathname();
   const activeTab = (searchParams.get("tab") as any) || "members";

   const setActiveTab = (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
   };
   const [search, setSearch] = useState("");
   const [userResults, setUserResults] = useState<any[]>([]);
   const [searching, setSearching] = useState(false);
   const [submitting, setSubmitting] = useState(false);

   // Forms state
   const [newMember, setNewMember] = useState({ name: "", email: "" });
   const [inviteData, setInviteData] = useState({
      type: "INDIVIDUAL",
      confirmationType: "INDIVIDUAL",
      maxUses: 1
   });

   // Invitations state
   const [targetName, setTargetName] = useState("");
   const [targetNames, setTargetNames] = useState<string[]>([]);
   const [newTargetName, setNewTargetName] = useState("");

   const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
   const authServiceUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
   const webServiceUrl = process.env.NEXT_PUBLIC_WEB_SERVICE_URL;

   // Tabs navigation
   const tabs = [
      { id: "members", label: "Participantes", icon: Users },
      { id: "add", label: "Adicionar", icon: UserPlus },
      { id: "invitations", label: "Convites", icon: Ticket },
      { id: "forms", label: "Inscrição", icon: Clipboard },
   ];

   // Search users from project
   useEffect(() => {
      if (activeTab === "add" && search.length > 2) {
         const delayDebounceFn = setTimeout(() => {
            searchUsers();
         }, 500);
         return () => clearTimeout(delayDebounceFn);
      }
   }, [search, activeTab]);

   async function searchUsers() {
      setSearching(true);
      try {
         const res = await axios.get(`${authServiceUrl}/api/projects/${projectId}/users`);
         const filtered = res.data.filter((u: any) =>
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
         );
         // Filter out users already in the group
         const existingIds = group.GroupMembership?.map((m: any) => m.userId) || [];
         setUserResults(filtered.filter((u: any) => !existingIds.includes(u.id)));
      } catch (err) {
         console.error(err);
      } finally {
         setSearching(false);
      }
   }

   async function handleAddDirect(userId: string) {
      setSubmitting(true);
      const res = await addMemberDirect(group.id, userId);
      if (res.success) {
         onRefresh();
         setUserResults(prev => prev.filter(u => u.id !== userId));
      } else {
         alert(res.error);
      }
      setSubmitting(false);
   }

   async function handleRegisterNew() {
      setSubmitting(true);
      const res = await registerNewMember(group.id, newMember);
      if (res.success) {
         onRefresh();
         setNewMember({ name: "", email: "" });
      } else {
         alert(res.error);
      }
      setSubmitting(false);
   }

   async function handleCreateInvite() {
      setSubmitting(true);
      const finalData = {
         ...inviteData,
         targetNames: inviteData.type === 'INDIVIDUAL' ? (targetName ? [targetName] : null) : (targetNames.length > 0 ? targetNames : null),
         maxUses: inviteData.type === 'INDIVIDUAL' ? 1 : parseInt(inviteData.maxUses.toString())
      };
      const res = await createInvitation(group.id, finalData);
      if (res.success) {
         onRefresh();
         setTargetName("");
         setTargetNames([]);
      } else {
         alert(res.error);
      }
      setSubmitting(false);
   }
   async function handleDeleteInvite(id: string) {
      if (!confirm("Excluir este convite?")) return;
      setSubmitting(true);
      const res = await deleteInvitation(id);
      if (res.success) {
         onRefresh();
      } else {
         alert(res.error);
      }
      setSubmitting(false);
   }

   async function handleDeleteMember(id: string) {
      if (!confirm("Remover este membro do grupo?")) return;
      setSubmitting(true);
      const res = await removeMember(id);
      if (res.success) {
         onRefresh();
      } else {
         alert(res.error);
      }
      setSubmitting(false);
   }

   const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
   };

   return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden min-h-[500px]">
         <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
            {tabs.map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all whitespace-nowrap
              ${activeTab === tab.id
                        ? 'text-brand-600 border-b-2 border-brand-500 bg-brand-50/50 dark:bg-brand-500/5'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}`}
               >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
               </button>
            ))}
         </div>

         <div className="p-6">
            {activeTab === "members" && (
               <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                     {group.maxSpots && (
                        <div className="text-xs font-bold text-gray-500 uppercase">
                           {(group.GroupMembership?.length || 0)} / {group.maxSpots} vagas preenchidas
                        </div>
                     )}
                  </div>

                  <div className="overflow-x-auto">
                     <table className="w-full text-sm">
                        <thead>
                           <tr className="text-left text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-gray-100 dark:border-gray-800">
                              <th className="pb-3 px-2">Participante</th>
                              <th className="pb-3 px-2 text-center">Status</th>
                              <th className="pb-3 px-2 text-center">Cód. Confirmação</th>
                              <th className="pb-3 px-2 text-center">Método</th>
                              <th className="pb-3 px-2 text-right">Ação</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                           {(!group.GroupMembership || group.GroupMembership?.length === 0) ? (
                              <tr>
                                 <td colSpan={5} className="py-12 text-center text-gray-400 italic">Nenhum membro cadastrado.</td>
                              </tr>
                           ) : group.GroupMembership.map((m: any) => (
                              <tr key={m.id} className="group">
                                 <td className="py-4 px-2">
                                    <div className="flex items-center gap-3">
                                       <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                                          {m.User?.image ? <img src={m.User.image} className="h-full w-full rounded-full" /> : <Shield className="h-4 w-4" />}
                                       </div>
                                       <div>
                                          <div className="font-bold text-gray-900 dark:text-white">{m.User?.name || m.name || "Sem Nome"}</div>
                                          <div className="text-[10px] text-gray-400 font-medium">{m.User?.email || m.email}</div>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="py-4 px-2 text-center">
                                    <Badge variant="light" color={m.status === 'ACTIVE' ? 'success' : 'warning'}>
                                       {m.status === 'ACTIVE' ? 'ATIVO' : m.status}
                                    </Badge>
                                 </td>
                                 <td className="py-4 px-2 text-center">
                                    {m.confirmationCode ? (
                                       <div className="flex items-center justify-center gap-1">
                                          <span className="font-mono text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded text-xs">{m.confirmationCode}</span>
                                          <button onClick={() => copyToClipboard(m.confirmationCode)} className="p-1 text-gray-400 hover:text-gray-600">
                                             <Clipboard className="h-3 w-3" />
                                          </button>
                                       </div>
                                    ) : <span className="text-gray-300">-</span>}
                                 </td>
                                 <td className="py-4 px-2 text-center">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                       {m.additionMethod}
                                    </div>
                                 </td>
                                 <td className="py-4 px-2 text-right">
                                    <button
                                       onClick={() => handleDeleteMember(m.id)}
                                       className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                    >
                                       <Trash2 className="h-4 w-4" />
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {activeTab === "add" && (
               <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Search Existing */}
                  <div className="space-y-4">
                     <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Vincular Usuário Existente</h4>
                        <p className="text-xs text-gray-500">Pesquise usuários já cadastrados no projeto.</p>
                     </div>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                           type="text"
                           value={search}
                           onChange={(e) => setSearch(e.target.value)}
                           placeholder="Nome ou email..."
                           className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-brand-500" />}
                     </div>

                     {userResults.length > 0 && (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                           {userResults.map(u => (
                              <div key={u.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                 <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-500/10 flex items-center justify-center text-brand-600">
                                       <UserCheck className="h-4 w-4" />
                                    </div>
                                    <div>
                                       <div className="text-sm font-bold text-gray-900 dark:text-white">{u.name}</div>
                                       <div className="text-[10px] text-gray-400">{u.email}</div>
                                    </div>
                                 </div>
                                 <Button onClick={() => handleAddDirect(u.id)} size="sm" variant="outline" className="text-xs" disabled={submitting}>
                                    Adicionar
                                 </Button>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  {/* Register New */}
                  <hr className="dark:border-gray-800" />
                  <div className="space-y-4">
                     <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Cadastrar Novo Membro</h4>
                        <p className="text-xs text-gray-500">O usuário receberá um convite para confirmar o cadastro e ingresso.</p>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome</label>
                           <input
                              type="text"
                              value={newMember.name}
                              onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl outline-none"
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email</label>
                           <input
                              type="email"
                              value={newMember.email}
                              onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl outline-none"
                           />
                        </div>
                     </div>
                     <Button onClick={handleRegisterNew} disabled={submitting || !newMember.email} className="w-full">
                        Registrar e Enviar Convite
                     </Button>
                  </div>
               </div>
            )}

            {activeTab === "invitations" && (
               <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="p-4 bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 rounded-2xl flex gap-4">
                     <Ticket className="h-6 w-6 text-brand-600 mt-1" />
                     <div>
                        <h4 className="text-sm font-bold text-brand-900 dark:text-brand-300">Gerador de Convites</h4>
                        <p className="text-xs text-brand-700 dark:text-brand-400">Crie links e códigos alfanuméricos de 6 caracteres para acesso rápido.</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 border border-gray-100 dark:border-gray-800 rounded-2xl">
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo de Convite</label>
                           <div className="grid grid-cols-2 gap-2">
                              <button
                                 onClick={() => setInviteData(prev => ({ ...prev, type: 'INDIVIDUAL', maxUses: 1 }))}
                                 className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${inviteData.type === 'INDIVIDUAL' ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20' : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-400'}`}>
                                 Individual
                              </button>
                              <button
                                 onClick={() => setInviteData(prev => ({ ...prev, type: 'COLLECTIVE', confirmationType: 'COLLECTIVE' }))}
                                 className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${inviteData.type === 'COLLECTIVE' ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20' : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-400'}`}>
                                 Coletivo
                              </button>
                           </div>
                        </div>

                        {inviteData.type === 'INDIVIDUAL' && (
                           <div className="space-y-1 animate-in slide-in-from-top-2">
                              <label className="text-[10px] text-gray-400 uppercase ml-1">Para (Nome Opcional)</label>
                              <input
                                 type="text"
                                 value={targetName}
                                 onChange={(e) => setTargetName(e.target.value)}
                                 placeholder="Ex: João Silva"
                                 className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl outline-none"
                              />
                           </div>
                        )}

                        {inviteData.type === 'COLLECTIVE' && (
                           <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl space-y-3 animate-in slide-in-from-top-2">
                              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Nome do Convidado</label>
                              <div className="flex gap-2">
                                 <input
                                    type="text"
                                    value={newTargetName}
                                    onChange={(e) => setNewTargetName(e.target.value)}
                                    placeholder="Adicionar nome..."
                                    className="flex-1 px-3 py-1.5 text-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                                 />
                                 <button
                                    onClick={() => {
                                       if (newTargetName) {
                                          setTargetNames(prev => {
                                             const next = [...prev, newTargetName];
                                             setInviteData(d => ({ ...d, maxUses: next.length }));
                                             return next;
                                          });
                                          setNewTargetName("");
                                       }
                                    }}
                                    className="p-2 bg-brand-100 text-brand-600 rounded-lg hover:bg-brand-200"
                                 >
                                    <Plus className="h-4 w-4" />
                                 </button>
                              </div>
                              {targetNames.length > 0 && (
                                 <div className="flex flex-wrap gap-1 mt-2">
                                    {targetNames.map((n, i) => (
                                       <span key={i} className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 px-2 py-0.5 rounded-lg text-md font-bold text-gray-500 flex items-center gap-1">
                                          {n}
                                          <button onClick={() => setTargetNames(prev => {
                                             const next = prev.filter((_, idx) => idx !== i);
                                             setInviteData(d => ({ ...d, maxUses: next.length }));
                                             return next;
                                          })}>
                                             <X className="h-2 w-2 text-red-400" />
                                          </button>
                                       </span>
                                    ))}
                                 </div>
                              )}
                           </div>
                        )}

                        <Button onClick={handleCreateInvite} className="w-full mt-4" disabled={submitting}>
                           Gerar Convite
                        </Button>
                     </div>

                     <div className="space-y-4">
                        {(() => {
                           const totalUses = group.Invitation?.reduce((acc: number, inv: any) => acc + (inv.currentUses || 0), 0) || 0;
                           const totalMax = group.Invitation?.reduce((acc: number, inv: any) => acc + (inv.maxUses || 0), 0) || 0;
                           return (
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                 Convites ({totalUses}/{totalMax})
                              </h4>
                           );
                        })()}
                        <div className="space-y-2">
                           {(!group.Invitation || group.Invitation?.length === 0) ? (
                              <div className="text-xs text-gray-400 italic py-8 text-center border-2 border-dashed border-gray-50 dark:border-gray-800 rounded-xl">Sem convites gerados.</div>
                           ) : group.Invitation?.reverse().map((inv: any) => (
                              <div key={inv.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                 <div className="flex items-center gap-2">
                                    {inv.targetNames && (
                                       <div className="text-md text-gray-500 italic truncate max-w-[250px]">
                                          {JSON.parse(inv.targetNames).join(", ")}
                                       </div>
                                    )}
                                 </div>
                                 <div className="flex items-center gap-1">
                                    <button onClick={() => copyToClipboard(inv.code)} className="p-1.5 text-gray-400 hover:text-brand-500" title="Copiar Código">
                                       <Clipboard className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => copyToClipboard(`${webServiceUrl}/invite/${inv.id}`)} className="p-1.5 text-gray-400 hover:text-brand-500" title="Copiar Link">
                                       <LinkIcon className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDeleteInvite(inv.id)} className="p-1.5 text-gray-400 hover:text-red-500 ml-1" title="Excluir Convite">
                                       <Trash2 className="h-4 w-4" />
                                    </button>
                                    <span className="text-md font-bold text-gray-500 ml-2">{inv.currentUses}/{inv.maxUses || '∞'}</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === "forms" && (
               <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Internal */}
                     <div className="p-6 rounded-2xl border border-blue-100 bg-blue-50/30 dark:bg-blue-500/5 dark:border-blue-900/30 space-y-4">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                           <UserCog className="h-5 w-5" />
                           <h4 className="font-bold text-sm">Formulário Interno</h4>
                        </div>
                        <p className="text-xs text-gray-500">Apenas usuários já vinculados ao projeto podem se inscrever neste grupo.</p>
                        <div className="flex gap-2">
                           <div className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/50 rounded-lg text-[10px] text-gray-400 truncate">
                              {webServiceUrl}/grupos/{group.id}/join-internal
                           </div>
                           <button onClick={() => copyToClipboard(`${webServiceUrl}/grupos/${group.id}/join-internal`)} className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors">
                              <Clipboard className="h-4 w-4" />
                           </button>
                        </div>
                     </div>

                     {/* External */}
                     <div className="p-6 rounded-2xl border border-emerald-100 bg-emerald-50/30 dark:bg-emerald-500/5 dark:border-emerald-900/30 space-y-4">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                           <ExternalLink className="h-5 w-5" />
                           <h4 className="font-bold text-sm">Formulário Externo</h4>
                        </div>
                        <p className="text-xs text-gray-500">Qualquer pessoa com o link pode preencher o formulário para ingressar no grupo.</p>
                        <div className="flex gap-2">
                           <div className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-emerald-100 dark:border-emerald-900/50 rounded-lg text-[10px] text-gray-400 truncate">
                              {webServiceUrl}/grupos/{group.id}/join
                           </div>
                           <button onClick={() => copyToClipboard(`${webServiceUrl}/grupos/${group.id}/join`)} className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 transition-colors">
                              <Clipboard className="h-4 w-4" />
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl flex gap-3">
                     <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                     <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                        <strong>Atenção:</strong> As inscrições via formulário respeitam o limite de vagas definido nas configurações do grupo. Quando as vagas acabarem, novos inscritos entrarão automaticamente na <strong>Lista Reserva</strong>, caso habilitada.
                     </p>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
