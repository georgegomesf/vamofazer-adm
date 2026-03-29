"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getArticle } from "@/actions/library";
import ArticleEditor from "@/components/admin/library/ArticleEditor";
import { Loader2 } from "lucide-react";

export default function EditArticlePage() {
  const params = useParams();
  const id = params.id as string;
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      const data = await getArticle(id);
      setArticle(data);
      setLoading(false);
    }
    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold">Artigo não encontrado.</h2>
      </div>
    );
  }

  return <ArticleEditor article={article} />;
}
