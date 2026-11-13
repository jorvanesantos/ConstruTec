import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, effect, inject, signal } from '@angular/core';
import { AlertCircle, Camera, CheckCircle2, LucideAngularModule, Trash2, Upload, X } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { UiStateService } from '../../core/services/ui-state.service';

@Component({
  selector: 'app-avatar-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (ui.avatarModalOpen() && auth.currentUser(); as user) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
        (click)="close()"
      >
        <div
          class="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
          (click)="$event.stopPropagation()"
        >
          <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <lucide-icon [img]="Camera" class="w-5 h-5"></lucide-icon>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Foto de Perfil</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Adicione ou troque sua foto exibida no sistema</p>
              </div>
            </div>
            <button
              type="button"
              (click)="close()"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <lucide-icon [img]="X" class="w-4 h-4"></lucide-icon>
            </button>
          </div>

          <div class="p-6 space-y-5">
            <!-- Pré-visualização -->
            <div class="flex flex-col items-center gap-3">
              <div class="w-28 h-28 rounded-2xl overflow-hidden bg-amber-500 text-slate-950 font-extrabold text-4xl flex items-center justify-center border-2 border-amber-400/50 shadow-md">
                @if (previewUrl()) {
                  <img
                    [src]="previewUrl()!"
                    [alt]="user.name"
                    class="w-full h-full object-cover"
                    referrerpolicy="no-referrer"
                  />
                } @else {
                  <span>{{ user.name.charAt(0).toUpperCase() }}</span>
                }
              </div>
              <div class="text-center">
                <p class="text-sm font-bold text-slate-900 dark:text-white">{{ user.name }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ user.email }}</p>
              </div>
            </div>

            @if (errorMsg()) {
              <div class="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-xs font-medium">
                <lucide-icon [img]="AlertCircle" class="w-4 h-4 shrink-0"></lucide-icon>
                <span>{{ errorMsg() }}</span>
              </div>
            }

            @if (successMsg()) {
              <div class="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 text-xs font-medium">
                <lucide-icon [img]="CheckCircle2" class="w-4 h-4 shrink-0"></lucide-icon>
                <span>{{ successMsg() }}</span>
              </div>
            }

            <input
              #fileInput
              type="file"
              accept="image/*"
              class="hidden"
              (change)="onFileSelected($event)"
            />

            <div class="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                (click)="fileInput.click()"
                [disabled]="saving()"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold cursor-pointer transition-colors"
              >
                <lucide-icon [img]="Upload" class="w-4 h-4 text-amber-500"></lucide-icon>
                {{ previewUrl() ? 'Escolher Outra Foto' : 'Selecionar Foto' }}
              </button>

              @if (previewUrl()) {
                <button
                  type="button"
                  (click)="clearPhoto()"
                  [disabled]="saving()"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 text-xs font-bold cursor-pointer transition-colors"
                >
                  <lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon>
                  Remover Foto
                </button>
              }
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                (click)="close()"
                class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="save()"
                [disabled]="saving()"
                class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 text-xs font-bold cursor-pointer"
              >
                {{ saving() ? 'Salvando...' : 'Salvar Foto' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class AvatarModalComponent {
  readonly ui = inject(UiStateService);
  readonly auth = inject(AuthService);

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  readonly previewUrl = signal<string | null>(null);
  readonly saving = signal(false);
  readonly errorMsg = signal('');
  readonly successMsg = signal('');

  readonly Camera = Camera;
  readonly Upload = Upload;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;

  constructor() {
    effect(() => {
      if (this.ui.avatarModalOpen()) {
        this.previewUrl.set(this.auth.currentUser()?.avatarUrl || null);
        this.errorMsg.set('');
        this.successMsg.set('');
      }
    });
  }

  close(): void {
    this.ui.avatarModalOpen.set(false);
  }

  clearPhoto(): void {
    this.previewUrl.set(null);
    this.errorMsg.set('');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMsg.set('Selecione um arquivo de imagem válido (JPG, PNG ou WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMsg.set('A imagem deve ter no máximo 5 MB.');
      return;
    }

    this.errorMsg.set('');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      this.resizeImage(dataUrl, 256)
        .then(resized => this.previewUrl.set(resized))
        .catch(() => this.previewUrl.set(dataUrl));
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  private resizeImage(src: string, maxSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas indisponível'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = src;
    });
  }

  async save(): Promise<void> {
    this.errorMsg.set('');
    this.successMsg.set('');
    this.saving.set(true);
    const res = await this.auth.updateAvatar(this.previewUrl());
    this.saving.set(false);

    if (!res.success) {
      this.errorMsg.set(res.error || 'Não foi possível salvar a foto de perfil.');
      return;
    }

    this.successMsg.set('Foto de perfil atualizada com sucesso!');
    setTimeout(() => {
      this.close();
    }, 800);
  }
}
