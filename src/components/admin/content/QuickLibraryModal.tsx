"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Loader2, Book, Layers, FileText, Check, Plus } from "lucide-react";
import { getJournals, getIssues, getArticles, getTheses } from "@/actions/library";
import Button from "@/components/ui/button/Button";

interface QuickLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (resourceId: string, type: 'journal' | 'issue' | 'article' | 'thesis', options?: { includeChildContent?: boolean }) => void;
  linkedJournalIds: string[];
  linkedIssueIds: string[];
  linkedArticleIds: string[];
  linkedThesisIds: string[];
}

export default function QuickLibraryModal({
  isOpen,
  onClose,
  onSuccess,
  linkedJournalIds,
  linkedIssueIds,
  linkedArticleIds,
  linkedThesisIds
}: QuickLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'journal' | 'issue' | 'article' | 'thesis'>('article');
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setItems([]);
      fetchItems(1, true);
    }
  }, [isOpen, activeTab, search]);

  async function fetchItems(pageNum: number, isNewSearch: boolean = false) {
    setLoading(true);
    try {
      let result;
      if (activeTab === 'journal') {
        result = await getJournals(); // Journals are not paginated yet, 67 items ok
        const filtered = result.filter((j: any) => 
          j.title.toLowerCase().includes(search.toLowerCase())
        );
        setItems(filtered);
        setHasMore(false);
      } else if (activeTab === 'issue') {
        result = await getIssues({ page: pageNum, pageSize: 20, search });
        const newItems = isNewSearch ? result.issues : [...items, ...result.issues];
        setItems(newItems);
        setHasMore(newItems.length < result.total);
      } else if (activeTab === 'article') {
        result = await getArticles({ page: pageNum, pageSize: 20, search });
        const newItems = isNewSearch ? result.articles : [...items, ...result.articles];
        setItems(newItems);
        setHasMore(newItems.length < result.total);
      } else if (activeTab === 'thesis') {
        result = await getTheses({ page: pageNum, pageSize: 20, search });
        const newItems = isNewSearch ? result.theses : [...items, ...result.theses];
        setItems(newItems);
        setHasMore(newItems.length < result.total);
      }
    } catch (error) {
      console.error("Error fetching library items:", error);
    } finally {
      setLoading(false);
    }
  }

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(nextPage);
  };

  const isSelected = (id: string, type: string) => {
    if (type === 'journal') return linkedJournalIds.includes(id);
    if (type === 'issue') return linkedIssueIds.includes(id);
    if (type === 'article') return linkedArticleIds.includes(id);
    if (type === 'thesis') return linkedThesisIds.includes(id);
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <Book className="h-5 w-5 text-brand-500" />
            Vincular Recurso da Biblioteca
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-1 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={() => setActiveTab('article')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'article' ? 'bg-white dark:bg-gray-700 text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="h-4 w-4" /> Artigos
          </button>
          <button
            onClick={() => setActiveTab('issue')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'issue' ? 'bg-white dark:bg-gray-700 text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Layers className="h-4 w-4" /> Edições
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'journal' ? 'bg-white dark:bg-gray-700 text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Book className="h-4 w-4" /> Revistas
          </button>
          <button
            onClick={() => setActiveTab('thesis')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'thesis' ? 'bg-white dark:bg-gray-700 text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="h-4 w-4" /> Teses
          </button>
        </div>

        {/* Search */}
        <div className="p-4 bg-white dark:bg-gray-900">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
            <input
              type="text"
              placeholder={`Pesquisar ${activeTab === 'journal' ? 'revista' : activeTab === 'issue' ? 'edição' : activeTab === 'article' ? 'artigo' : 'tese'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none dark:text-white text-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
          {items.map((item) => {
            const selected = isSelected(item.id, activeTab);
            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border mb-1 flex items-center justify-between transition-all group ${
                  selected 
                    ? 'border-brand-500/50 bg-brand-50 dark:bg-brand-500/5 cursor-default opacity-60' 
                    : 'border-transparent hover:border-brand-500/30 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 flex items-center justify-center">
                    {activeTab === 'journal' && <Book className="h-5 w-5 text-gray-400" />}
                    {activeTab === 'issue' && <Layers className="h-5 w-5 text-gray-400" />}
                    {activeTab === 'article' && <FileText className="h-5 w-5 text-gray-400" />}
                    {activeTab === 'thesis' && <FileText className="h-5 w-5 text-gray-400" />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate uppercase tracking-tight" title={item.title}>
                      {item.title}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate flex items-center gap-2">
                       {activeTab === 'article' && <span>{item.authors || 'Sem autores'}</span>}
                       {activeTab === 'thesis' && <span>{item.authors || 'Sem autores'} • {item.university}</span>}
                       {activeTab === 'issue' && <span>{item.journal?.title}</span>}
                       {activeTab === 'journal' && <span>{item._count?.issues || 0} edições</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selected ? (
                    <Check className="h-4 w-4 text-brand-500 shrink-0" />
                  ) : (
                    <div className="flex items-center gap-2">
                      {(activeTab === 'journal' || activeTab === 'issue') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSuccess(item.id, activeTab, { includeChildContent: true });
                          }}
                          className="px-2 py-1 bg-brand-500 text-white text-[10px] font-bold rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-1"
                          title={activeTab === 'journal' ? "Incluir Galeria de Edições" : "Incluir Lista de Artigos"}
                        >
                          <Plus className="h-3 w-3" /> {activeTab === 'journal' ? "+ Portal Edições" : "+ Portal Artigos"}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSuccess(item.id, activeTab);
                        }}
                        className="p-1 px-2 text-[10px] font-bold text-gray-400 hover:text-brand-500 transition-colors border border-transparent hover:border-brand-500/30 rounded-lg flex items-center gap-1 shrink-0"
                      >
                        <Plus className="h-4 w-4 shrink-0" /> Vincular
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {!loading && items.length === 0 && (
            <div className="py-12 text-center text-gray-500 italic text-sm">
              Nenhum resultado encontrado.
            </div>
          )}

          {loading && (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
              <span className="text-xs text-gray-500">Buscando na biblioteca...</span>
            </div>
          )}

          {hasMore && !loading && (
            <button
               onClick={loadMore}
               className="w-full py-4 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Carregar mais itens
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}
