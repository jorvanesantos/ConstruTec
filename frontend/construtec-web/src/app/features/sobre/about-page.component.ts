import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Check,
  Copy,
  Database,
  Download,
  FileText,
  Layers,
  LucideAngularModule,
  ShieldCheck
} from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { UiStateService } from '../../core/services/ui-state.service';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div class="space-y-1">
        <button
          type="button"
          (click)="ui.navigateTo('home')"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-amber-600 cursor-pointer"
        >
          <lucide-icon [img]="ArrowLeft" class="w-4 h-4"></lucide-icon>
          Voltar ao Início
        </button>
        <h1 class="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <lucide-icon [img]="BookOpen" class="w-7 h-7 text-amber-500"></lucide-icon>
          Sobre o ConstruTec & Documentação Técnica
        </h1>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          Arquitetura Full-Stack padronizada em Angular 19, Node.js/Express e MySQL com tabelas SINAPI regionais.
        </p>
      </div>

      <!-- Cards Arquitetura -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div class="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <lucide-icon [img]="Layers" class="w-5 h-5"></lucide-icon>
          </div>
          <h3 class="font-bold text-slate-900 dark:text-white">Frontend Angular 19</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Organizado em Core, Shared, Layout e Features com Standalone Components, Signals, HttpInterceptor JWT e Tailwind CSS v4.
          </p>
        </div>

        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div class="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center">
            <lucide-icon [img]="Building2" class="w-5 h-5"></lucide-icon>
          </div>
          <h3 class="font-bold text-slate-900 dark:text-white">Backend Node.js & Express</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Camadas isoladas em Controllers, Services, Repositories, Middlewares RBAC e Validators sobre TypeScript.
          </p>
        </div>

        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <lucide-icon [img]="Database" class="w-5 h-5"></lucide-icon>
          </div>
          <h3 class="font-bold text-slate-900 dark:text-white">Persistência MySQL + Fallback</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Esquema relacional completo (<code class="font-mono">usuario</code>, <code class="font-mono">obra</code>, <code class="font-mono">medicao</code>, <code class="font-mono">material</code>, <code class="font-mono">historico</code>) com contingência segura em memória.
          </p>
        </div>
      </div>

      <!-- Downloads Oficiais -->
      <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <lucide-icon [img]="FileText" class="w-5 h-5 text-amber-500"></lucide-icon>
              Documentação e Manuais Acadêmicos (ADS)
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Baixe os manuais completos explicando o fluxo de código, segurança JWT/bcryptjs, JSON e estrutura de pastas.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <a
            href="/api/docs/download-word?doc=ads"
            download
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors"
          >
            <lucide-icon [img]="Download" class="w-4 h-4"></lucide-icon>
            Baixar Guia de Fluxo & Arquitetura (.docx)
          </a>

          <a
            href="/api/docs/download-word"
            download
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <lucide-icon [img]="Download" class="w-4 h-4 text-amber-500"></lucide-icon>
            Baixar Especificação Completa (.docx)
          </a>

          <a
            href="/api/docs/download-txt"
            download
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <lucide-icon [img]="FileText" class="w-4 h-4"></lucide-icon>
            Baixar Especificação (.txt)
          </a>

          <button
            type="button"
            (click)="toggleSpecPreview()"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs hover:opacity-90 cursor-pointer"
          >
            {{ showSpec() ? 'Ocultar Visualização' : 'Visualizar Texto na Tela' }}
          </button>
        </div>

        @if (showSpec()) {
          <div class="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Especificação Técnica ConstruTec</span>
              <button
                type="button"
                (click)="copySpec()"
                class="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                <lucide-icon [img]="copied() ? Check : Copy" class="w-3.5 h-3.5"></lucide-icon>
                {{ copied() ? 'Copiado!' : 'Copiar Texto' }}
              </button>
            </div>
            <pre class="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">{{ specContent() }}</pre>
          </div>
        }
      </div>

      <div class="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
        <lucide-icon [img]="ShieldCheck" class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"></lucide-icon>
        <div class="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
          <p class="font-bold">Segurança e Controle de Acesso (RBAC)</p>
          <p>
            Senhas protegidas com hash criptográfico bcryptjs, tokens assinados com JWT (RFC 7519) enviados via Bearer Header e registro contínuo em trilha de auditoria.
          </p>
        </div>
      </div>
    </div>
  `
})
export class AboutPageComponent {
  readonly ui = inject(UiStateService);
  private readonly http = inject(HttpClient);

  readonly showSpec = signal(false);
  readonly specContent = signal('');
  readonly copied = signal(false);

  readonly ArrowLeft = ArrowLeft;
  readonly BookOpen = BookOpen;
  readonly Layers = Layers;
  readonly Building2 = Building2;
  readonly Database = Database;
  readonly FileText = FileText;
  readonly Download = Download;
  readonly Copy = Copy;
  readonly Check = Check;
  readonly ShieldCheck = ShieldCheck;

  async toggleSpecPreview(): Promise<void> {
    const next = !this.showSpec();
    this.showSpec.set(next);
    if (next && !this.specContent()) {
      try {
        const res = await firstValueFrom(this.http.get<{ content: string }>('/api/docs/content'));
        this.specContent.set(res.content || '');
      } catch {
        this.specContent.set('Não foi possível carregar o texto completo no momento.');
      }
    }
  }

  async copySpec(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.specContent());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // ignore
    }
  }
}
