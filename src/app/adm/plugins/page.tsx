import React from "react";
import PluginList from "@/components/admin/plugins/PluginList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plugins | Admin VamoFazer",
  description: "Gerencie os plugins disponíveis no sistema.",
};

export default function PluginsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PluginList />
    </div>
  );
}
