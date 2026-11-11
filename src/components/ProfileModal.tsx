import React, { useEffect, useState } from 'react';
import type { UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onProfileUpdated: (user: UserProfile, token: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, user, onClose, onProfileUpdated }) => {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setErrorMessage('');
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token || localStorage.getItem('construtec_jwt_token') || ''}`
        },
        body: JSON.stringify({ name, email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Não foi possível atualizar o perfil.');
      onProfileUpdated({ ...data.user, token: data.token }, data.token);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao atualizar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h2 id="profile-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">Editar meu perfil</h2>
        <label className="block text-sm text-slate-700 dark:text-slate-300">
          Nome
          <input required minLength={2} maxLength={150} value={name} onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
        </label>
        <label className="block text-sm text-slate-700 dark:text-slate-300">
          E-mail
          <input required type="email" maxLength={180} value={email} onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
        </label>
        {errorMessage && <p role="alert" className="text-sm text-red-600">{errorMessage}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 dark:text-slate-300">Cancelar</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-60">
            {saving ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </div>
      </form>
    </div>
  );
};
