import GroupEditorClient from "@/components/admin/content/GroupEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GroupEditPage({ params }: Props) {
  const { id } = await params;
  return <GroupEditorClient id={id} />;
}
