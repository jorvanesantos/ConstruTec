import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }): void;
      renderButton(
        element: HTMLElement,
        options: { theme: 'outline'; size: 'large'; shape: 'pill'; width: number; text: 'continue_with' }
      ): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google) {
    return Promise.resolve();
  }
  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => window.google
      ? resolve()
      : reject(new Error('O serviço de login do Google não ficou disponível.'));
    script.onerror = () => reject(new Error('Não foi possível carregar o serviço de login do Google.'));
    document.head.appendChild(script);
  }).catch(error => {
    googleScriptPromise = null;
    throw error;
  });

  return googleScriptPromise;
}

@Component({
  selector: 'app-google-sign-in-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2">
      <div #buttonHost class="flex justify-center min-h-10"></div>
      @if (message()) {
        <p class="text-center text-xs text-slate-500 dark:text-slate-400" role="status">{{ message() }}</p>
      }
    </div>
  `
})
export class GoogleSignInButtonComponent implements AfterViewInit {
  private readonly http = inject(HttpClient);
  private readonly buttonHost = viewChild.required<ElementRef<HTMLDivElement>>('buttonHost');

  readonly credential = output<string>();
  readonly message = signal('');

  async ngAfterViewInit(): Promise<void> {
    try {
      const { clientId } = await firstValueFrom(
        this.http.get<{ clientId: string }>('/api/auth/google/config')
      );
      if (!clientId) {
        this.message.set('Login Google indisponível: configure GOOGLE_CLIENT_ID no .env do servidor.');
        return;
      }

      await loadGoogleIdentityScript();
      const google = window.google;
      if (!google) {
        throw new Error('O serviço de login do Google não ficou disponível.');
      }

      google.accounts.id.initialize({
        client_id: clientId,
        callback: response => {
          if (response.credential) {
            this.message.set('');
            this.credential.emit(response.credential);
          } else {
            this.message.set('O Google não retornou uma credencial. Tente novamente.');
          }
        }
      });
      google.accounts.id.renderButton(this.buttonHost().nativeElement, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        width: 340,
        text: 'continue_with'
      });
    } catch (error) {
      console.error('[Auth] Falha ao inicializar o botão Google:', error);
      this.message.set('Não foi possível carregar o login Google. Verifique a conexão e tente novamente.');
    }
  }
}
