"use client";

import React, { useState } from "react";
import Link from "next/link";

type ImportResult = {
  type: "youtube" | "instagram" | "webpage";
  data: {
    source: string;
    title: string;
    description: string;
    image: string;
    siteName?: string;
    channelTitle?: string;
    publishedAt?: string | null;
    tags?: string[];
    videoId?: string;
    embedUrl?: string;
    url: string;
  };
};

export default function ImportTool() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildNewPostUrl = () => {
    if (!result) return "/adm/posts/new";
    const params = new URLSearchParams();
    if (result.data.title) params.set("title", result.data.title);
    if (result.data.description) params.set("summary", result.data.description);
    if (result.data.image) params.set("imageUrl", result.data.image);
    if (result.data.embedUrl) params.set("embedUrl", result.data.embedUrl);
    if (result.data.tags?.length) params.set("tags", result.data.tags.join(","));
    params.set("sourceUrl", result.data.url);
    return `/adm/posts/new?${params.toString()}`;
  };

  const buildNewAttachmentUrl = () => {
    if (!result) return "/adm/attachments/new";
    const params = new URLSearchParams();
    if (result.data.title) params.set("title", result.data.title);
    if (result.data.description) params.set("description", result.data.description);
    params.set("url", result.data.url);
    return `/adm/attachments/new?${params.toString()}`;
  };

  const typeLabel = {
    youtube: "YouTube",
    instagram: "Instagram",
    webpage: "Página Web",
  };

  const typeBadgeColor = {
    youtube: "bg-red-100 text-red-700",
    instagram: "bg-purple-100 text-purple-700",
    webpage: "bg-blue-100 text-blue-700",
  };

  const typeIcon = {
    youtube: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    instagram: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
    webpage: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Importar Conteúdo</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Cole uma URL de um vídeo do YouTube, postagem do Instagram ou qualquer página para extrair
          automaticamente título, descrição, thumbnail e outros metadados.
        </p>
      </div>

      {/* URL Input */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleImport} className="space-y-4">
          <label htmlFor="import-url" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            URL da fonte
          </label>
          <div className="flex gap-3">
            <input
              id="import-url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... ou https://www.instagram.com/p/..."
              className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Buscando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 16 12 12 8 16" />
                    <line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                  </svg>
                  Importar
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Suporte: YouTube (vídeos e Shorts), Instagram (postagens públicas), qualquer página com Open Graph tags.
          </p>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Erro ao importar</p>
            <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Result Preview */}
      {result && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
          {/* Badge */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${typeBadgeColor[result.type]}`}>
              {typeIcon[result.type]}
              {typeLabel[result.type]}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[300px]">
              {result.data.source === "youtube_api" ? "via YouTube API" : "via extração de metatags"}
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* Thumbnail */}
            {result.data.image && (
              <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-video flex items-center justify-center">
                <img
                  src={result.data.image}
                  alt={result.data.title}
                  className="w-full h-full object-contain object-center"
                />
              </div>
            )}

            {/* YouTube Embed Preview */}
            {result.type === "youtube" && result.data.videoId && (
              <div className="rounded-xl overflow-hidden aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${result.data.videoId}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Fields */}
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Título</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">{result.data.title || "—"}</p>
              </div>

              {(result.data.channelTitle || result.data.siteName) && (
                <div>
                  <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Canal / Site</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{result.data.channelTitle || result.data.siteName}</p>
                </div>
              )}

              {result.data.description && (
                <div>
                  <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Descrição</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">{result.data.description}</p>
                </div>
              )}

              {result.data.publishedAt && (
                <div>
                  <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Data de Publicação</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(result.data.publishedAt).toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              )}

              {result.data.tags && result.data.tags.length > 0 && (
                <div>
                  <p className="text-xs uppercase font-semibold text-gray-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.data.tags.slice(0, 12).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                        {tag}
                      </span>
                    ))}
                    {result.data.tags.length > 12 && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-400">
                        +{result.data.tags.length - 12} mais
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Link
                href={buildNewPostUrl()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 text-sm font-semibold transition-colors bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Criar postagem com estes dados
              </Link>
              <Link
                href={buildNewAttachmentUrl()}
                className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-5 py-2.5 text-sm font-semibold transition-colors"
               >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                Criar Anexo
              </Link>
              <a
                href={result.data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Ver fonte original
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
