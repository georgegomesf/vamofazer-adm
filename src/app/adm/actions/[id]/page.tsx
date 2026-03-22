import React from "react";
import ActionEditor from "@/components/admin/content/ActionEditor";
import { getActionById } from "@/actions/actions";
import { notFound } from "next/navigation";

interface EditActionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditActionPage({ params }: EditActionPageProps) {
  const { id } = await params;
  const action = await getActionById(id);

  if (!action) {
    notFound();
  }

  return <ActionEditor action={action} />;
}
