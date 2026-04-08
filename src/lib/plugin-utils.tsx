import React from "react";
import { PluginType, PluginCategory } from "@prisma/client";
import { 
  Settings, 
  MessageSquare, 
  Layout, 
  PartyPopper, 
  Puzzle, 
  ShieldCheck, 
  Zap, 
  Unlock 
} from "lucide-react";

export interface PluginTypeInfo {
  label: string;
  color: string;
  icon: React.ReactNode;
  value: PluginType;
}

export interface PluginCategoryInfo {
  label: string;
  color: string;
  icon: React.ReactNode;
  value: PluginCategory;
}

export function getPluginTypeInfo(type: PluginType): PluginTypeInfo {
  const types: Record<PluginType, PluginTypeInfo> = {
    STANDARD: {
      label: "Padrão",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      icon: <ShieldCheck size={14} />,
      value: "STANDARD",
    },
    FREE: {
      label: "Grátis",
      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
      icon: <Unlock size={14} />,
      value: "FREE",
    },
    PREMIUM: {
      label: "Premium",
      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      icon: <Zap size={14} />,
      value: "PREMIUM",
    },
  };
  return types[type];
}

export function getPluginCategoryInfo(category: PluginCategory): PluginCategoryInfo {
  const categories: Record<PluginCategory, PluginCategoryInfo> = {
    ACTIVITY: {
      label: "Atividade",
      color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
      icon: <Puzzle size={14} />,
      value: "ACTIVITY",
    },
    COMMUNICATION: {
      label: "Comunicação",
      color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
      icon: <MessageSquare size={14} />,
      value: "COMMUNICATION",
    },
    ORGANIZATION: {
      label: "Organização",
      color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      icon: <Layout size={14} />,
      value: "ORGANIZATION",
    },
    PARTY: {
      label: "Festa",
      color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800",
      icon: <PartyPopper size={14} />,
      value: "PARTY",
    },
    OTHER: {
      label: "Outros",
      color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
      icon: <Settings size={14} />,
      value: "OTHER",
    },
  };
  return categories[category];
}

export function getAllPluginTypes(): PluginTypeInfo[] {
  return [
    getPluginTypeInfo("STANDARD"),
    getPluginTypeInfo("FREE"),
    getPluginTypeInfo("PREMIUM"),
  ];
}

export function getAllPluginCategories(): PluginCategoryInfo[] {
  return [
    getPluginCategoryInfo("ACTIVITY"),
    getPluginCategoryInfo("COMMUNICATION"),
    getPluginCategoryInfo("ORGANIZATION"),
    getPluginCategoryInfo("PARTY"),
    getPluginCategoryInfo("OTHER"),
  ];
}
