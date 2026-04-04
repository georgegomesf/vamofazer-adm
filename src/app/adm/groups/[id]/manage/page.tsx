"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getGroupById } from "@/actions/groups";
import MemberManager from "@/components/admin/content/MemberManager";
import { Loader2, ChevronLeft, Settings } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";

export default function GroupManagePage() {
  const { id } = useParams();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchGroup();
    }
  }, [id]);

  async function fetchGroup() {
    const data = await getGroupById(id as string);
    setGroup(data);
    setLoading(false);
  }

  if (loading && !group) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 last:border-0 font-medium">Grupo não encontrado</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/adm/groups/${id}`}>
            <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
              <ChevronLeft className="h-6 w-6" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              {group.name}
            </h1>
            {/* <p className="text-xs text-gray-500">Membros, convites e inscrições.</p> */}
          </div>
        </div>

        <Link href={`/adm/groups/${id}`}>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Configurações
          </Button>
        </Link>
      </div>

      <MemberManager group={group} onRefresh={fetchGroup} />
    </div>
  );
}
