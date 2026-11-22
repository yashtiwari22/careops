'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, KbArticleSummary, KbChunkDto } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  BookOpen,
  Plus,
  Trash2,
  Layers,
  Clock,
  Sparkles,
  FileText,
  Search,
  CheckCircle2,
  RefreshCw,
  Eye,
  Database,
  Quote,
} from 'lucide-react';

export function KnowledgeBaseView() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KbArticleSummary | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: articles = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<KbArticleSummary[]>({
    queryKey: ['kb-articles'],
    queryFn: () => api.kb.listArticles(),
  });

  const { data: chunks = [], isLoading: isLoadingChunks } = useQuery<KbChunkDto[]>({
    queryKey: ['kb-chunks', selectedArticle?.id],
    queryFn: () =>
      selectedArticle ? api.kb.getArticleChunks(selectedArticle.id) : Promise.resolve([]),
    enabled: !!selectedArticle,
  });

  const createMutation = useMutation({
    mutationFn: (req: { title: string; content: string }) => api.kb.createArticle(req),
    onSuccess: () => {
      setCreateOpen(false);
      setTitle('');
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['kb-articles'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.kb.deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles'] });
      if (selectedArticle?.id) {
        setSelectedArticle(null);
      }
    },
  });

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.content && a.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Knowledge Base & pgvector Index
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage company policies and guides. Uploaded markdown is automatically chunked and embedded for RAG hybrid search.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-1.5 h-8 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5 h-8 text-xs bg-primary hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5" />
            New Policy Article
          </Button>
        </div>
      </div>

      {/* Search and Summary Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles & content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-3 self-start sm:self-center">
          <span>{articles.length} total articles</span>
          <span>&bull;</span>
          <span>{articles.reduce((acc, a) => acc + (a.chunkCount || 0), 0)} vector chunks indexed</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-lg border bg-card/40 animate-pulse" />
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <Card className="border-dashed bg-card/40">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">No Knowledge Base Articles</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">
              {searchQuery
                ? `No articles found matching "${searchQuery}".`
                : 'Upload documentation, return policies, or FAQs to power autonomous resolution agents.'}
            </p>
            {!searchQuery && (
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Add First Article
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((article) => (
            <Card
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="bg-card/60 hover:border-primary/50 hover:shadow-md transition-all duration-150 flex flex-col justify-between cursor-pointer group"
            >
              <CardHeader className="pb-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="text-[11px] font-mono text-muted-foreground truncate">
                      /{article.slug}
                    </CardDescription>
                  </div>

                  <Badge variant="secondary" className="gap-1 font-mono text-[10px] shrink-0">
                    <Layers className="w-3 h-3 text-primary" />
                    {article.chunkCount} chunks
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* Content snippet preview */}
                {article.content ? (
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed font-sans">
                    {article.content}
                  </p>
                ) : (
                  <p className="text-xs italic text-muted-foreground/60">
                    Click to inspect full document content and vector embeddings...
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2.5">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    {new Date(article.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-primary hover:bg-primary/10 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedArticle(article);
                      }}
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${article.title}" and remove its vector embeddings?`)) {
                          deleteMutation.mutate(article.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Inspect Article & Chunks Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="w-[95vw] !max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          {selectedArticle && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-lg font-bold tracking-tight break-words flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary shrink-0" />
                      {selectedArticle.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground font-mono mt-1">
                      /{selectedArticle.slug} &bull; Created {new Date(selectedArticle.createdAt).toLocaleString()}
                    </DialogDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs gap-1.5 shrink-0">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    {selectedArticle.chunkCount} vector {selectedArticle.chunkCount === 1 ? 'chunk' : 'chunks'}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="py-2 space-y-5">
                {/* Full Article Document Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      Full Article Content (Markdown)
                    </span>
                    <span className="text-[11px] font-normal text-muted-foreground font-mono">
                      {selectedArticle.content ? `${selectedArticle.content.length} characters` : ''}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg border bg-card/60 text-xs leading-relaxed font-sans whitespace-pre-wrap break-words text-foreground/90">
                    {selectedArticle.content || 'Content not available in summary.'}
                  </div>
                </div>

                {/* pgvector Chunks Inspector */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span>Indexed pgvector Chunks ({chunks.length})</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      pgvector: vector(1536) cosine distance
                    </span>
                  </div>

                  {isLoadingChunks ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-20 rounded border bg-card/40 animate-pulse" />
                      ))}
                    </div>
                  ) : chunks.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic p-3 border rounded bg-card/30">
                      No chunks recorded for this article.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {chunks.map((chunk) => (
                        <div
                          key={chunk.id}
                          className="p-3 rounded-lg border bg-muted/30 border-border/70 space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold font-mono text-primary">
                                Chunk #{chunk.chunkIndex}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono"
                              >
                                {chunk.hasEmbedding ? '✓ 1536-dim Vector Indexed' : 'No Embedding'}
                              </Badge>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {chunk.content.split(/\s+/).length} words
                            </span>
                          </div>

                          <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans bg-background/50 p-2.5 rounded border border-border/40">
                            {chunk.content}
                          </p>

                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                            <Quote className="w-3 h-3 text-primary/70" />
                            <span>Citation Reference: </span>
                            <span className="text-foreground/80 font-semibold">
                              [{selectedArticle.title} - Chunk {chunk.chunkIndex}]
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="border-t pt-3">
                <Button size="sm" variant="outline" onClick={() => setSelectedArticle(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Article Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-4 h-4 text-primary" />
              Add Knowledge Base Article
            </DialogTitle>
            <DialogDescription className="text-xs">
              Content is instantly chunked and encoded into 1536-dim embeddings in pgvector for hybrid semantic retrieval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Article Title
              </label>
              <Input
                placeholder="e.g. 30-Day Money-Back Guarantee & Return Instructions"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Article Body (Markdown supported)
              </label>
              <Textarea
                rows={10}
                placeholder="Write or paste your policy documentation here in markdown..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="font-mono text-xs leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                if (title.trim() && content.trim()) {
                  createMutation.mutate({ title, content });
                }
              }}
              disabled={createMutation.isPending || !title.trim() || !content.trim()}
            >
              <CheckCircle2 className="w-4 h-4" />
              Index Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
