import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-construtec-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2.5 select-none">
      <div
        class="relative flex items-center justify-center rounded-xl overflow-hidden bg-amber-500/10 border border-amber-500/20 shadow-sm shrink-0"
        [ngClass]="sizeClass"
      >
        <img
          src="/assets/images/yellow_hardhat_logo_1790727668517.jpg"
          alt="Logo ConstruTec"
          class="w-full h-full object-cover"
        />
      </div>
      @if (showText) {
        <div class="flex flex-col leading-none">
          <div class="flex items-center gap-1">
            <span class="font-display font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              Constru<span class="text-amber-500">Tec</span>
            </span>
          </div>
          <span class="text-[10px] font-medium tracking-wider text-slate-500 dark:text-slate-400 uppercase mt-0.5">
            Engenharia & Orçamentos
          </span>
        </div>
      }
    </div>
  `
})
export class ConstruTecLogoComponent {
  @Input() sizeClass = 'w-10 h-10';
  @Input() showText = true;
}
