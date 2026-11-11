import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, LifeBuoy, Send } from 'lucide-react';
import type { SupportTicket, UserProfile } from '../types';

interface SupportTicketsProps {
  user: UserProfile;
}

const statusLabels: Record<SupportTicket['status'], string> = {
  aberto: 'Aberto',
  em_atendimento: 'Em atendimento',
  respondido: 'Respondido',
  fechado: 'Fechado'
};

export const SupportTickets: React.FC<SupportTicketsProps> = ({ user }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadTickets = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/chamados', {
        headers: { Authorization: `Bearer ${user.token || localStorage.getItem('construtec_jwt_token') || ''}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Não foi possível carregar seus chamados.');
      setTickets(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao carregar chamados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, [user.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      const response = await fetch('/api/chamados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token || localStorage.getItem('construtec_jwt_token') || ''}`
        },
        body: JSON.stringify({ subject, message })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Não foi possível registrar o chamado.');
      setSubject('');
      setMessage('');
      setNotice(data.persisted
        ? 'Chamado registrado. Você poderá acompanhar a resposta nesta página.'
        : 'Chamado registrado apenas nesta execução. O MySQL está indisponível e o chamado será perdido quando o servidor reiniciar.');
      await loadTickets();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao registrar chamado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header className="flex items-start gap-3">
        <div className="rounded-xl bg-amber-100 p-2.5 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
          <LifeBuoy className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Suporte ConstruTec</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Abra um chamado sobre dúvidas ou problemas e acompanhe a resposta da equipe.
          </p>
        </div>
      </header>

      {errorMessage && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold text-slate-900 dark:text-white">Novo chamado</h2>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assunto</span>
          <input
            required
            minLength={3}
            maxLength={150}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            placeholder="Ex.: dúvida sobre um cálculo"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Descreva a dúvida ou o problema</span>
          <textarea
            required
            minLength={10}
            maxLength={5000}
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            placeholder="Inclua os detalhes necessários para a equipe entender o caso."
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">{message.length}/5000</span>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            Enviar chamado
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Meus chamados</h2>
          <button onClick={() => void loadTickets()} disabled={loading} className="text-xs font-semibold text-amber-700 hover:underline dark:text-amber-300">
            Atualizar
          </button>
        </div>
        {loading && tickets.length === 0 && <p className="text-sm text-slate-500">Carregando chamados...</p>}
        {!loading && tickets.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
            Você ainda não abriu chamados.
          </p>
        )}
        {tickets.map((ticket) => (
          <article key={ticket.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{ticket.subject}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{ticket.message}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Clock3 className="h-3.5 w-3.5" />
                {statusLabels[ticket.status]}
              </span>
            </div>
            {ticket.response && (
              <div className="mt-4 rounded-xl border-l-4 border-emerald-500 bg-emerald-50 p-3 dark:bg-emerald-950/30">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Resposta da equipe{ticket.responseBy ? ` — ${ticket.responseBy}` : ''}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{ticket.response}</p>
              </div>
            )}
            <p className="mt-3 text-[11px] text-slate-400">
              Aberto em {new Date(ticket.createdAt).toLocaleString('pt-BR')}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};
