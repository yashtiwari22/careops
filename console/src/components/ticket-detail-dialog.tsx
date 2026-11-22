'use client';

import { useQuery } from '@tanstack/react-query';
import { api, Ticket, TicketEvent, AgentRun } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  Bot,
  Activity,
  DollarSign,
  Cpu,
  ArrowRight,
  Sparkles,
  BookOpen,
  Wrench,
  ShieldCheck,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface TicketDetailDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketDetailDialog({ ticket, open, onOpenChange }: TicketDetailDialogProps) {
  const ticketId = ticket?.id;

  const { data: events = [] } = useQuery<TicketEvent[]>({
    queryKey: ['ticket-events', ticketId],
    queryFn: () => (ticketId ? api.tickets.getEvents(ticketId) : Promise.resolve([])),
    enabled: !!ticketId && open,
  });

  const { data: agentRuns = [] } = useQuery<AgentRun[]>({
    queryKey: ['agent-runs', ticketId],
    queryFn: () => (ticketId ? api.tickets.getAgentRuns(ticketId) : Promise.resolve([])),
    enabled: !!ticketId && open,
  });

  const humanApprovalEvent = events.find(
    (e) => e.eventType === 'HUMAN_APPROVED' || e.eventType === 'HUMAN_EDITED_AND_APPROVED'
  );

  const humanRejectionEvent = events.find(
    (e) => e.eventType === 'HUMAN_REJECTED'
  );

  if (!ticket) return null;

  const getPriorityVariant = (priority?: string) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT':
        return 'destructive';
      case 'HIGH':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toUpperCase()) {
      case 'ANGRY':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'NEGATIVE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'POSITIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

interface AgentPayloadData {
  // TRIAGE / MAILROOM
  summary?: string;
  category?: string;
  priority?: string;
  sentiment?: string;
  routeToActionAgent?: boolean;
  routeToResolutionAgent?: boolean;
  // RESOLUTION
  draftReply?: string;
  reply?: string;                  // fallback for compatibility
  citations?: string[];
  confidenceScore?: number;        // legacy — not used by backend
  // ACTION
  toolName?: string;
  actionExecuted?: boolean;
  proposedAction?: {
    actionType?: string;
    amount?: number | string;
    orderNumber?: string;
    reason?: string;
  };
  toolOutput?: Record<string, unknown>;
  // CRITIC & shared fields
  verdict?: string;           // APPROVED | NEEDS_REVISION | AWAITING_APPROVAL
  confidence?: number;        // 0.0–1.0 (used by ResolutionResult and CriticResult)
  score?: number;             // fallback
  hallucinationDetected?: boolean;
  policyViolationDetected?: boolean;
  critiqueNotes?: string;
  notes?: string;             // fallback
  revisionFeedback?: string;
  involvesFinancialAction?: boolean;
}

  const renderAgentPayload = (run: AgentRun) => {
    if (!run.outputPayload) return null;

    let parsed: AgentPayloadData | null = null;
    try {
      parsed = JSON.parse(run.outputPayload) as AgentPayloadData;
    } catch {
      return (
        <div className="text-xs bg-muted/60 rounded p-2.5 font-mono overflow-x-auto break-all text-muted-foreground whitespace-pre-wrap">
          {run.outputPayload}
        </div>
      );
    }

    if (!parsed) return null;

    if (run.agentName === 'TRIAGE' || run.agentName === 'MAILROOM') {
      return (
        <div className="space-y-2 pt-1 text-xs">
          {parsed.summary && (
            <div className="p-2.5 rounded bg-muted/40 text-foreground/90 leading-relaxed border border-border/40">
              <span className="font-semibold text-primary">Summary: </span>
              {parsed.summary}
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            {parsed.category && (
              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                Category: {parsed.category}
              </Badge>
            )}
            {parsed.priority && (
              <Badge variant={getPriorityVariant(parsed.priority)} className="text-[10px]">
                Priority: {parsed.priority}
              </Badge>
            )}
            {parsed.sentiment && (
              <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getSentimentColor(parsed.sentiment)}`}>
                Sentiment: {parsed.sentiment}
              </span>
            )}
            {parsed.routeToResolutionAgent && (
              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border border-primary/20">
                Route → Resolution
              </Badge>
            )}
            {parsed.routeToActionAgent && (
              <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Route → Action
              </Badge>
            )}
          </div>
        </div>
      );
    }

    if (run.agentName === 'RESOLUTION') {
      const draft = parsed.draftReply || parsed.reply;
      const conf = parsed.confidence ?? parsed.confidenceScore;
      return (
        <div className="space-y-3 pt-1">
          {/* Draft Reply */}
          <div className="p-3 rounded-md bg-muted/40 border space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Draft Resolution Reply
              </span>
              {conf != null && (
                <Badge variant="outline" className="font-mono text-[10px]">
                  Confidence: {Math.round(conf * 100)}%
                </Badge>
              )}
            </div>
            {draft ? (
              <p className="text-xs leading-relaxed whitespace-pre-wrap break-words text-foreground/90 font-sans">
                {draft}
              </p>
            ) : (
              <p className="text-xs italic text-muted-foreground">
                No draft resolution reply generated.
              </p>
            )}
          </div>

          {/* Citations */}
          {Array.isArray(parsed.citations) && parsed.citations.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-primary" />
                RAG Knowledge Citations ({parsed.citations.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {parsed.citations.map((cite: string, idx: number) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-[10px] bg-primary/10 text-primary border border-primary/20"
                  >
                    {cite}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (run.agentName === 'ACTION') {
      const hasProposed = Boolean(
        parsed.proposedAction &&
        (parsed.proposedAction.amount != null || parsed.proposedAction.orderNumber || parsed.proposedAction.actionType)
      );

      return (
        <div className="space-y-2 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold flex items-center gap-1.5 text-foreground">
              <Wrench className="w-3.5 h-3.5 text-blue-400" />
              Tool: <span className="font-mono text-primary">{parsed.toolName || 'none'}</span>
            </span>
            <Badge variant={parsed.actionExecuted ? 'default' : 'secondary'} className="text-[10px]">
              {parsed.actionExecuted ? 'Executed' : 'No Action'}
            </Badge>
          </div>

          {hasProposed && parsed.proposedAction && (
            <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-xs space-y-1">
              <div className="flex items-center justify-between text-red-400 font-semibold">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Staged Financial Action: {parsed.proposedAction.actionType || 'REFUND'}
                </span>
                {parsed.proposedAction.amount && (
                  <span className="font-mono">${Number(parsed.proposedAction.amount).toFixed(2)}</span>
                )}
              </div>
              <p className="text-muted-foreground text-[11px]">
                {parsed.proposedAction.orderNumber && `Order: ${parsed.proposedAction.orderNumber}`}
                {parsed.proposedAction.orderNumber && parsed.proposedAction.reason && ' • '}
                {parsed.proposedAction.reason}
              </p>
            </div>
          )}

          {parsed.toolOutput && Object.keys(parsed.toolOutput).length > 0 && (
            <div className="p-2 rounded bg-muted/40 font-mono text-[11px] text-muted-foreground overflow-x-auto break-all whitespace-pre-wrap">
              <span className="font-semibold text-foreground/80">Tool Output: </span>
              {JSON.stringify(parsed.toolOutput, null, 2)}
            </div>
          )}
        </div>
      );
    }

    if (run.agentName === 'CRITIC') {
      const verdict = parsed.verdict ?? 'UNKNOWN';
      const score = parsed.confidence ?? parsed.score;
      const notes = parsed.critiqueNotes || parsed.notes;
      const isTicketResolved = ticket.status === 'SENT' || ticket.status === 'APPROVED';

      return (
        <div className="space-y-2 pt-1 text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Critic Score:</span>
              <Badge
                variant={score != null && score >= 0.85 ? 'default' : 'destructive'}
                className="font-mono text-[11px]"
              >
                {score != null ? score.toFixed(2) : 'N/A'}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {parsed.hallucinationDetected && (
                <Badge variant="destructive" className="text-[10px]">Hallucination Detected</Badge>
              )}
              {parsed.policyViolationDetected && (
                <Badge variant="destructive" className="text-[10px]">Policy Violation</Badge>
              )}
              {parsed.involvesFinancialAction && (
                <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Financial Action
                </Badge>
              )}
              {verdict === 'AWAITING_APPROVAL' ? (
                isTicketResolved ? (
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    Human Review Passed (Sent)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px]">
                    Requires Staff Sign-Off
                  </Badge>
                )
              ) : verdict === 'APPROVED' ? (
                <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
                  Auto-Approved by Critic
                </Badge>
              ) : verdict === 'NEEDS_REVISION' ? (
                <Badge variant="destructive" className="text-[10px]">
                  Revision Required
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  {verdict}
                </Badge>
              )}
            </div>
          </div>

          {notes && (
            <div className="p-2 rounded bg-muted/40 text-muted-foreground text-[11px] leading-relaxed break-words">
              <span className="font-semibold text-foreground/80">Evaluation Notes: </span>
              {notes}
            </div>
          )}
          {parsed.revisionFeedback && (
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed break-words">
              <span className="font-semibold">Revision Feedback: </span>
              {parsed.revisionFeedback}
            </div>
          )}
        </div>
      );
    }

    // Default fallback — pretty-printed JSON
    return (
      <div className="text-xs bg-muted/60 rounded p-2.5 font-mono overflow-x-auto break-all text-muted-foreground whitespace-pre-wrap">
        {JSON.stringify(parsed, null, 2)}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] !max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-bold tracking-tight break-words">
                {ticket.subject}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1 break-words overflow-hidden">
                From <span className="font-medium text-foreground">{ticket.customerName}</span>{' '}
                <span className="break-all">({ticket.customerEmail})</span> &bull; Created {new Date(ticket.createdAt).toLocaleString()}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Badge variant="outline" className="capitalize">
                {ticket.status.toLowerCase().replace('_', ' ')}
              </Badge>
              {ticket.priority && (
                <Badge variant={getPriorityVariant(ticket.priority)}>
                  {ticket.priority}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="py-2 space-y-6">
          {/* Customer Conversation Message */}
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Customer Message</span>
              <span>{new Date(ticket.createdAt).toLocaleTimeString()}</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
              {ticket.body}
            </p>
          </div>

          {/* Human Approval Recorded Banner */}
          {humanApprovalEvent && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-emerald-200">Staff Review Sign-Off:</span> This ticket was intercepted by CriticAgent due to a financial refund, reviewed by a support specialist in the Approval Queue, and approved on{' '}
                <span className="font-medium text-emerald-100">{new Date(humanApprovalEvent.createdAt).toLocaleString()}</span>.
              </div>
            </div>
          )}

          {/* Human Rejection Recorded Banner */}
          {humanRejectionEvent && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-xs text-red-300">
              <XCircle className="w-4 h-4 text-destructive shrink-0" />
              <div>
                <span className="font-semibold text-red-200">Staff Rejection Recorded:</span> This prompt injection / policy escalation was reviewed and rejected by staff on{' '}
                <span className="font-medium text-red-100">{new Date(humanRejectionEvent.createdAt).toLocaleString()}</span>.
              </div>
            </div>
          )}

          {/* Mailroom Intelligence Card */}
          <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Bot className="w-4 h-4" />
              <span>Mailroom Intelligence</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="p-2.5 rounded-md border bg-background/50">
                <div className="text-xs text-muted-foreground">Category</div>
                <div className="font-semibold mt-0.5">{ticket.category || 'Pending'}</div>
              </div>
              <div className="p-2.5 rounded-md border bg-background/50">
                <div className="text-xs text-muted-foreground">Priority</div>
                <div className="font-semibold mt-0.5">{ticket.priority || 'Pending'}</div>
              </div>
              <div className="p-2.5 rounded-md border bg-background/50">
                <div className="text-xs text-muted-foreground">Sentiment</div>
                <div className="mt-0.5">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${getSentimentColor(ticket.sentiment)}`}>
                    {ticket.sentiment || 'Pending'}
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-md border bg-background/50">
                <div className="text-xs text-muted-foreground">Version (Lock)</div>
                <div className="font-semibold font-mono text-xs mt-0.5">v{ticket.version}</div>
              </div>
            </div>
          </div>

          {/* Tabs for Timeline and Audit Events */}
          <Tabs defaultValue="agents" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="agents" className="gap-2 text-xs sm:text-sm">
                <Cpu className="w-4 h-4" />
                <span>Multi-Agent Pipeline ({agentRuns.length})</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-2 text-xs sm:text-sm">
                <Activity className="w-4 h-4" />
                <span>Audit Log ({events.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Agent Runs Tab */}
            <TabsContent value="agents" className="space-y-3 pt-3">
              {agentRuns.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg bg-card/50">
                  No agent runs recorded yet. Mailroom worker may be currently processing.
                </div>
              ) : (
                agentRuns.map((run) => (
                  <div key={run.id} className="border rounded-lg p-3.5 bg-card/60 space-y-2.5">
                    {/* Agent run header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Bot className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-semibold text-sm">{run.agentName}</span>
                        <Badge variant="outline" className="text-xs font-mono shrink-0 max-w-[220px]" title={run.model}>
                          <span className="truncate">{run.model}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {run.durationMs}ms
                        </span>
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5" />
                          {run.promptTokens + run.completionTokens} tok
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400 font-mono">
                          <DollarSign className="w-3 h-3" />
                          ${Number(run.estimatedCostUsd).toFixed(6)}
                        </span>
                        <Badge variant={run.status === 'SUCCESS' ? 'default' : 'destructive'} className="text-xs">
                          {run.status}
                        </Badge>
                      </div>
                    </div>

                    {renderAgentPayload(run)}
                  </div>
                ))
              )}
            </TabsContent>

            {/* Audit Log Tab */}
            <TabsContent value="events" className="space-y-3 pt-3">
              {events.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg bg-card/50">
                  No events recorded.
                </div>
              ) : (
                <div className="relative border-l border-muted-foreground/20 ml-3 space-y-4 py-2">
                  {events.map((evt) => (
                    <div key={evt.id} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                      <div className="border rounded-lg p-3 bg-card/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">{evt.eventType}</span>
                          <span className="text-muted-foreground">
                            {new Date(evt.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        {evt.fromState && evt.toState && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                            <Badge variant="outline" className="text-[10px]">
                              {evt.fromState}
                            </Badge>
                            <ArrowRight className="w-3 h-3" />
                            <Badge variant="default" className="text-[10px]">
                              {evt.toState}
                            </Badge>
                          </div>
                        )}
                        {evt.payload && (
                          <div className="text-[11px] font-mono text-muted-foreground mt-1.5 bg-muted/40 p-2 rounded break-all whitespace-pre-wrap overflow-x-auto">
                            {evt.payload}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
