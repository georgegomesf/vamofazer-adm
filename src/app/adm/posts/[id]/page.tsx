"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPostById } from "@/actions/posts";
import PostEditor from "@/components/admin/content/PostEditor";
import { Loader2 } from "lucide-react";

export default function EditPostPage() {
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      const data = await getPostById(id);
      setPost(data);
      setLoading(false);
    }
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold">Postagem não encontrada.</h2>
      </div>
    );
  }

  return <PostEditor post={post} />;
}
