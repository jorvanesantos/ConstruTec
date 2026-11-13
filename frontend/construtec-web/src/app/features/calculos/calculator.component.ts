import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import confetti from 'canvas-confetti';
import {
  Anchor,
  ArrowLeft,
  Box,
  BrickWall,
  Calculator,
  Check,
  CheckCircle2,
  Grid3x3,
  Home,
  Info,
  Layers,
  LucideAngularModule,
  MapPin,
  Paintbrush,
  Printer,
  Save,
  Share2,
  ShieldAlert,
  SlidersHorizontal,
  TriangleAlert,
  Wrench
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { CalculoService } from '../../core/services/calculo.service';
import { MaterialService } from '../../core/services/material.service';
import { ObraService } from '../../core/services/obra.service';
import { UiStateService } from '../../core/services/ui-state.service';
import { CalculationResult, SavedBudget, WorkTypeKey } from '../../core/models/types';
import { AuthGuardViewComponent } from '../../shared/components/auth-guard-view.component';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AuthGuardViewComponent, BrlCurrencyPipe],
  template: `
    @if (!auth.isLoggedIn()) {
      <app-auth-guard-view
        message="Para realizar cálculos de materiais e gerar orçamentos no ConstruTec, é necessário estar logado na sua conta."
      ></app-auth-guard-view>
    } @else {
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Barra Superior com Botão Voltar -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="space-y-1">
          <button
            type="button"
            (click)="ui.navigateTo('home')"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
          >
            <lucide-icon [img]="ArrowLeft" class="w-4 h-4"></lucide-icon>
            Voltar ao Início
          </button>
          <h1 class="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <lucide-icon [img]="Calculator" class="w-7 h-7 text-amber-500"></lucide-icon>
            Calculadora de Materiais
          </h1>
        </div>

        <button
          type="button"
          (click)="ui.locationModalOpen.set(true)"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-amber-500 transition-colors cursor-pointer"
        >
          <lucide-icon [img]="MapPin" class="w-4 h-4 text-amber-500"></lucide-icon>
          <span>Base Regional: {{ ui.currentLocation().city }} ({{ ui.currentLocation().uf }})</span>
        </button>
      </div>

      <!-- Seletor de Tipo de Obra -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 px-1">
          1. Selecione o Tipo de Obra
        </p>
        <div class="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          @for (wt of workTypes; track wt.id) {
            <button
              type="button"
              (click)="selectType(wt.id)"
              class="flex flex-col items-center justify-center p-2.5 rounded-xl border text-center gap-1.5 transition-all cursor-pointer"
              [ngClass]="selectedType() === wt.id
                ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:border-amber-400'"
            >
              <lucide-icon [img]="getIcon(wt.icon)" class="w-4 h-4"></lucide-icon>
              <span class="text-[11px] leading-tight line-clamp-1">{{ wt.name }}</span>
            </button>
          }
        </div>
      </div>

      <!-- ETAPA 1: FORMULÁRIO DE MEDIDAS -->
      @if (step() === 1) {
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 class="text-lg font-bold text-slate-900 dark:text-white">
                2. Parâmetros Técnicos — {{ currentWorkInfo()?.name }}
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {{ currentWorkInfo()?.description }}
              </p>
            </div>
            <span class="text-xs font-semibold px-3 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 self-start">
              Perda padrão: {{ wastePercentage }}%
            </span>
          </div>

          <form (ngSubmit)="runCalculation()" class="space-y-6">
            <!-- Campos por Tipo de Obra -->
            @switch (selectedType()) {
              @case ('muro') {
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Comprimento do Muro (m)</label>
                    <input type="number" step="0.1" min="0.5" [(ngModel)]="length" name="muroLen" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Altura do Muro (m)</label>
                    <input type="number" step="0.1" min="0.5" [(ngModel)]="height" name="muroHeight" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tipo de Bloco / Tijolo</label>
                    <select [(ngModel)]="blockType" name="muroBlock" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm">
                      <option value="bloco_14">Bloco de Concreto 14x19x39 cm</option>
                      <option value="bloco_09">Bloco de Concreto 09x19x39 cm</option>
                      <option value="tijolo_8f">Tijolo Cerâmico 8 Furos</option>
                    </select>
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Qtd. Portões / Portas</label>
                    <input type="number" min="0" [(ngModel)]="doorsCount" name="muroDoors" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Largura do Vão (m)</label>
                    <input type="number" step="0.1" min="0" [(ngModel)]="doorWidth" name="muroDoorW" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Altura do Vão (m)</label>
                    <input type="number" step="0.1" min="0" [(ngModel)]="doorHeight" name="muroDoorH" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                </div>
              }

              @case ('parede') {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Comprimento (m)</label>
                    <input type="number" step="0.1" min="0.5" [(ngModel)]="length" name="pLen" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Pé-Direito / Altura (m)</label>
                    <input type="number" step="0.1" min="0.5" [(ngModel)]="height" name="pHeight" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Bloco / Tijolo</label>
                    <select [(ngModel)]="blockType" name="pBlock" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm">
                      <option value="bloco_14">Bloco Concreto 14 cm</option>
                      <option value="bloco_09">Bloco Concreto 09 cm</option>
                      <option value="tijolo_8f">Tijolo 8 Furos</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Acabamento / Reboco</label>
                    <select [(ngModel)]="renderType" name="pRender" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm">
                      <option value="ambas_faces">Reboco em Ambas as Faces</option>
                      <option value="uma_face">Reboco em Apenas 1 Face</option>
                      <option value="sem_reboco">Sem Reboco (Apenas Alvenaria)</option>
                    </select>
                  </div>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Qtd. Portas</label>
                    <input type="number" min="0" [(ngModel)]="doorsCount" name="pDoors" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Qtd. Janelas</label>
                    <input type="number" min="0" [(ngModel)]="windowsCount" name="pWin" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Largura Janela (m)</label>
                    <input type="number" step="0.1" min="0" [(ngModel)]="windowWidth" name="pWinW" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Altura Janela (m)</label>
                    <input type="number" step="0.1" min="0" [(ngModel)]="windowHeight" name="pWinH" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                </div>
              }

              @case ('piso') {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Comprimento do Ambiente (m)</label>
                    <input type="number" step="0.1" min="0.5" [(ngModel)]="length" name="piLen" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Largura do Ambiente (m)</label>
                    <input type="number" step="0.1" min="0.5" [(ngModel)]="width" name="piWidth" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Material de Revestimento</label>
                    <select [(ngModel)]="tileType" name="piTile" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm">
                      <option value="porcelanato">Porcelanato Retificado (AC-III)</option>
                      <option value="ceramica_padrao">Cerâmica Esmaltada Padrão (AC-I)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Formato da Peça (cm)</label>
                    <select [(ngModel)]="tileSizeCm" name="piSize" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm">
                      <option [ngValue]="45">45 x 45 cm</option>
                      <option [ngValue]="60">60 x 60 cm</option>
                      <option [ngValue]="80">80 x 80 cm</option>
                      <option [ngValue]="90">90 x 90 cm</option>
                    </select>
                  </div>
                </div>
              }

              @case ('pintura') {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Extensão das Paredes (m)</label>
                    <input type="number" step="0.1" min="0.5" [(ngModel)]="length" name="ptLen" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Altura / Pé-Direito (m)</label>
                    <input type="number" step="0.1" min="0.5" [(ngModel)]="height" name="ptHeight" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Quantidade de Paredes</label>
                    <input type="number" min="1" [(ngModel)]="wallsCount" name="ptWalls" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Demãos de Tinta</label>
                    <select [(ngModel)]="coats" name="ptCoats" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm">
                      <option [ngValue]="2">2 Demãos (Repintura)</option>
                      <option [ngValue]="3">3 Demãos (Primeira Pintura / Cor Forte)</option>
                    </select>
                  </div>
                </div>
                <div class="flex flex-wrap gap-6 pt-1">
                  <label class="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="needsSealer" name="ptSealer" class="w-4 h-4 rounded accent-amber-500" />
                    Incluir Selador Acrílico (Parede Nova)
                  </label>
                  <label class="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="needsPutty" name="ptPutty" class="w-4 h-4 rounded accent-amber-500" />
                    Incluir Massa Corrida / Nivelamento
                  </label>
                </div>
              }

              @case ('concreto') {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Comprimento (m)</label>
                    <input type="number" step="0.1" min="0.5" [(ngModel)]="length" name="cLen" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Largura (m)</label>
                    <input type="number" step="0.1" min="0.2" [(ngModel)]="width" name="cWidth" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Espessura / Altura (m)</label>
                    <input type="number" step="0.02" min="0.05" [(ngModel)]="depth" name="cDepth" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Traço Estrutural</label>
                    <select [(ngModel)]="mixRatio" name="cMix" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm">
                      <option value="1_2_3">1:2:3 (Estrutural 25 MPa - Lajes/Vigas)</option>
                      <option value="1_2.5_3.5">1:2.5:3.5 (Contrapiso / Geral 20 MPa)</option>
                      <option value="1_3_4">1:3:4 (Concreto Magro / Lastro)</option>
                    </select>
                  </div>
                </div>
              }

              @case ('fundacao') {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Elemento de Fundação</label>
                    <select [(ngModel)]="foundationType" name="fType" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm">
                      <option value="baldrame">Viga Baldrame (metros lineares)</option>
                      <option value="sapata_isolada">Sapatas Isoladas (unidades)</option>
                      <option value="estaca_broca">Estacas Broca (unidades)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {{ foundationType === 'baldrame' ? 'Metros Lineares (m)' : 'Quantidade de Elementos' }}
                    </label>
                    <input type="number" step="1" min="1" [(ngModel)]="length" name="fQty" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Largura / Diâmetro (m)</label>
                    <input type="number" step="0.05" min="0.15" [(ngModel)]="width" name="fWidth" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Altura / Profundidade (m)</label>
                    <input type="number" step="0.05" min="0.2" [(ngModel)]="depth" name="fDepth" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                </div>
              }

              @case ('telhado') {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Comprimento Projetado (m)</label>
                    <input type="number" step="0.1" min="1" [(ngModel)]="length" name="tLen" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Largura Projetada (m)</label>
                    <input type="number" step="0.1" min="1" [(ngModel)]="width" name="tWidth" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Inclinação (%)</label>
                    <input type="number" min="10" max="80" [(ngModel)]="roofSlope" name="tSlope" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tipo de Telha</label>
                    <select [(ngModel)]="roofTileType" name="tTile" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm">
                      <option value="ceramica_romana">Cerâmica Romana / Colonial</option>
                      <option value="fibrocimento_ondulada">Fibrocimento Ondulada 6mm</option>
                    </select>
                  </div>
                </div>
                <label class="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="includeWoodwork" name="tWood" class="w-4 h-4 rounded accent-amber-500" />
                  Incluir Kit de Madeiramento Estrutural (Vigas, Caibros e Ripas)
                </label>
              }

              @case ('revestimento') {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Comprimento das Paredes (m)</label>
                    <input type="number" step="0.1" min="0.5" [(ngModel)]="length" name="rLen" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Altura do Revestimento (m)</label>
                    <input type="number" step="0.1" min="0.5" [(ngModel)]="height" name="rHeight" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Qtd. Portas</label>
                    <input type="number" min="0" [(ngModel)]="doorsCount" name="rDoors" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Qtd. Janelas / Box</label>
                    <input type="number" min="0" [(ngModel)]="windowsCount" name="rWins" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                </div>
              }

              @case ('outro') {
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Descrição da Reforma / Serviço</label>
                    <input type="text" [(ngModel)]="customDescription" name="oDesc" placeholder="Ex: Calçada externa e contrapiso" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Área Total (m²)</label>
                    <input type="number" step="0.5" min="0.5" [(ngModel)]="customArea" name="oArea" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Espessura Média (cm)</label>
                    <input type="number" step="1" min="2" [(ngModel)]="thicknessCm" name="oThick" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                  </div>
                </div>
                <div class="flex flex-wrap gap-6 pt-1">
                  <label class="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="includeMasonry" name="oMason" class="w-4 h-4 rounded accent-amber-500" />
                    Incluir Blocos de Alvenaria Auxiliar
                  </label>
                  <label class="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="includePainting" name="oPaint" class="w-4 h-4 rounded accent-amber-500" />
                    Incluir Acabamento em Pintura
                  </label>
                </div>
              }
            }

            <!-- Controle Desperdício -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
              <div class="flex items-center justify-between text-xs font-semibold">
                <span class="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <lucide-icon [img]="SlidersHorizontal" class="w-4 h-4 text-amber-500"></lucide-icon>
                  Margem Técnica de Segurança / Perdas (%)
                </span>
                <span class="font-bold text-amber-600 dark:text-amber-400">{{ wastePercentage }}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                [(ngModel)]="wastePercentage"
                name="wasteSlider"
                class="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div class="flex justify-end pt-2">
              <button
                type="submit"
                class="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm shadow-md transition-colors cursor-pointer"
              >
                <lucide-icon [img]="Calculator" class="w-5 h-5"></lucide-icon>
                Calcular Materiais e Orçamento
              </button>
            </div>
          </form>
        </div>
      }

      <!-- ETAPA 2: RESULTADOS -->
      @if (step() === 2 && result(); as res) {
        <div class="space-y-6">
          <!-- KPIs de Resultado -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Área Calculada</span>
              <p class="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {{ res.areaM2 }} m²
              </p>
            </div>

            @if (res.volumeM3) {
              <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Volume Estimado</span>
                <p class="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {{ res.volumeM3 }} m³
                </p>
              </div>
            } @else {
              <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Margem de Segurança</span>
                <p class="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  +{{ res.wastePercentage }}%
                </p>
              </div>
            }

            <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Itens na Lista</span>
              <p class="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {{ res.materials.length }} insumos
              </p>
            </div>

            <div class="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-xs">
              <span class="text-xs font-bold text-amber-700 dark:text-amber-300">Investimento Total Estimado</span>
              <p class="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {{ res.totalEstimatedCost | brl }}
              </p>
            </div>
          </div>

          <!-- Lista Comercial -->
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  Lista de Materiais Recomendada ({{ res.workTypeName }})
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Quantitativos comerciais já arredondados para evitar falta na entrega
                </p>
              </div>
              <button
                type="button"
                (click)="step.set(1)"
                class="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                ← Alterar Medidas
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
                    <th class="py-3 px-6 font-bold">Material / Descrição</th>
                    <th class="py-3 px-4 font-bold text-right">Qtd. Teórica</th>
                    <th class="py-3 px-4 font-bold text-right">Qtd. Compra</th>
                    <th class="py-3 px-4 font-bold text-right">Preço Unit.</th>
                    <th class="py-3 px-6 font-bold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (mat of res.materials; track mat.id) {
                    <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td class="py-3.5 px-6">
                        <p class="font-bold text-slate-900 dark:text-white">{{ mat.name }}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400">{{ mat.purpose }}</p>
                      </td>
                      <td class="py-3.5 px-4 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                        {{ mat.theoreticalQuantity }}
                      </td>
                      <td class="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                        {{ mat.commercialQuantity }} {{ mat.unit }}
                      </td>
                      <td class="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300">
                        {{ mat.unitPrice | brl }}
                      </td>
                      <td class="py-3.5 px-6 text-right font-bold text-slate-900 dark:text-white">
                        {{ mat.totalPrice | brl }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Fórmulas + Salvar / Imprimir -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div class="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <lucide-icon [img]="Info" class="w-4 h-4 text-amber-500"></lucide-icon>
                Memória de Cálculo e Premissas
              </h4>
              <ul class="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc pl-5">
                @for (formula of res.formulasUsed; track formula) {
                  <li>{{ formula }}</li>
                }
              </ul>
              <div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                <lucide-icon [img]="TriangleAlert" class="w-4 h-4 shrink-0 text-amber-500 mt-0.5"></lucide-icon>
                <span>{{ res.technicalWarning }}</span>
              </div>
            </div>

            <div class="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 class="text-sm font-bold text-slate-900 dark:text-white">Salvar & Exportar Orçamento</h4>

              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nome do Projeto / Obra</label>
                <input
                  type="text"
                  [(ngModel)]="budgetTitle"
                  name="bTitle"
                  placeholder="Ex: Muro dos Fundos - Casa Jardim"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Cliente / Responsável (opcional)</label>
                <input
                  type="text"
                  [(ngModel)]="clientName"
                  name="bClient"
                  placeholder="Nome do cliente ou proprietário"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                />
              </div>

              @if (savedFeedback()) {
                <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <lucide-icon [img]="CheckCircle2" class="w-4 h-4"></lucide-icon>
                  <span>Orçamento salvo no seu histórico com sucesso!</span>
                </div>
              }

              <div class="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  (click)="saveBudget()"
                  [disabled]="saving()"
                  class="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <lucide-icon [img]="Save" class="w-4 h-4"></lucide-icon>
                  {{ saving() ? 'Salvando...' : 'Salvar Orçamento no Histórico' }}
                </button>

                <div class="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    (click)="openPrint()"
                    class="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <lucide-icon [img]="Printer" class="w-4 h-4"></lucide-icon>
                    Imprimir / PDF
                  </button>
                  <button
                    type="button"
                    (click)="copySummary()"
                    class="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <lucide-icon [img]="copied() ? Check : Share2" class="w-4 h-4"></lucide-icon>
                    {{ copied() ? 'Copiado!' : 'Copiar Resumo' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
    }
  `
})
export class CalculatorComponent implements OnInit {
  readonly ui = inject(UiStateService);
  readonly auth = inject(AuthService);
  private readonly calculoService = inject(CalculoService);
  private readonly materialService = inject(MaterialService);
  private readonly obraService = inject(ObraService);

  readonly workTypes = this.materialService.getStaticWorkTypes();
  readonly selectedType = signal<WorkTypeKey>('muro');
  readonly step = signal<1 | 2>(1);
  readonly result = signal<CalculationResult | null>(null);
  readonly saving = signal(false);
  readonly savedFeedback = signal(false);
  readonly copied = signal(false);

  // Inputs do formulário
  length = 10;
  height = 2.5;
  width = 4;
  depth = 0.15;
  blockType: 'bloco_14' | 'bloco_09' | 'tijolo_8f' = 'bloco_14';
  renderType: 'ambas_faces' | 'uma_face' | 'sem_reboco' = 'ambas_faces';
  tileType: 'porcelanato' | 'ceramica_padrao' = 'porcelanato';
  tileSizeCm = 60;
  wallsCount = 4;
  coats = 2;
  needsSealer = true;
  needsPutty = false;
  mixRatio: '1_2_3' | '1_2.5_3.5' | '1_3_4' = '1_2_3';
  foundationType: 'baldrame' | 'sapata_isolada' | 'estaca_broca' = 'baldrame';
  roofSlope = 30;
  roofTileType: 'ceramica_romana' | 'fibrocimento_ondulada' = 'ceramica_romana';
  includeWoodwork = true;
  doorsCount = 0;
  doorWidth = 0.9;
  doorHeight = 2.1;
  windowsCount = 0;
  windowWidth = 1.2;
  windowHeight = 1.0;
  customDescription = 'Contrapiso / Calçada';
  customArea = 20;
  thicknessCm = 6;
  includeMasonry = false;
  includePainting = false;
  wastePercentage = 10;

  budgetTitle = '';
  clientName = '';

  readonly ArrowLeft = ArrowLeft;
  readonly Calculator = Calculator;
  readonly MapPin = MapPin;
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly Info = Info;
  readonly TriangleAlert = TriangleAlert;
  readonly Save = Save;
  readonly Printer = Printer;
  readonly Share2 = Share2;
  readonly Check = Check;
  readonly CheckCircle2 = CheckCircle2;

  ngOnInit(): void {
    this.selectType(this.ui.selectedWorkType());
    if (!this.auth.isLoggedIn()) {
      this.ui.openAuthModal('Faça login para realizar cálculos de materiais e gerar orçamentos.');
    }
  }

  currentWorkInfo() {
    return this.workTypes.find(w => w.id === this.selectedType());
  }

  selectType(type: WorkTypeKey): void {
    this.selectedType.set(type);
    this.ui.selectedWorkType.set(type);
    const info = this.workTypes.find(w => w.id === type);
    if (info) {
      this.wastePercentage = info.defaultWaste;
    }
    this.step.set(1);
    this.savedFeedback.set(false);
  }

  getIcon(iconName: string): any {
    const map: Record<string, any> = {
      ShieldAlert,
      BrickWall,
      Grid3x3,
      Paintbrush,
      Box,
      Anchor,
      Home,
      Layers,
      Wrench
    };
    return map[iconName] || Wrench;
  }

  async runCalculation(): Promise<void> {
    if (!this.auth.isLoggedIn()) {
      this.ui.openAuthModal('Faça login para realizar cálculos de materiais e gerar orçamentos.');
      return;
    }

    const type = this.selectedType();
    const payload = {
      length: this.length,
      wallLength: this.length,
      height: this.height,
      width: this.width,
      heightOrDepth: this.depth,
      depthOrHeight: this.depth,
      widthOrDiameter: this.width,
      linearMetersOrUnits: this.length,
      blockType: this.blockType,
      renderType: this.renderType,
      tileType: this.tileType,
      tileSizeCm: this.tileSizeCm,
      wallsCount: this.wallsCount,
      coats: this.coats,
      needsSealer: this.needsSealer,
      needsPutty: this.needsPutty,
      mixRatio: this.mixRatio,
      foundationType: this.foundationType,
      slopePercentage: this.roofSlope,
      includeWoodwork: this.includeWoodwork,
      doorsCount: this.doorsCount,
      doorWidth: this.doorWidth,
      doorHeight: this.doorHeight,
      windowsCount: this.windowsCount,
      windowWidth: this.windowWidth,
      windowHeight: this.windowHeight,
      description: this.customDescription,
      area: this.customArea,
      thicknessCm: this.thicknessCm,
      includeMasonry: this.includeMasonry,
      includePainting: this.includePainting,
      wastePercentage: this.wastePercentage,
      location: this.ui.currentLocation()
    };

    try {
      const computed = await this.calculoService.calculateRemote(type, payload);
      this.result.set(computed);
      this.budgetTitle = `${computed.workTypeName} (${computed.areaM2} m²)`;
      this.savedFeedback.set(false);
      this.step.set(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        this.auth.logout();
        this.ui.openAuthModal('Sessão expirada. Faça login novamente para continuar calculando.');
      }
    }
  }

  async saveBudget(): Promise<void> {
    const res = this.result();
    if (!res) return;

    if (!this.auth.isLoggedIn()) {
      this.ui.openAuthModal('Faça login para salvar seu orçamento no histórico e acessar depois.');
      return;
    }

    const user = this.auth.currentUser()!;
    this.saving.set(true);

    const budget: SavedBudget = {
      id: `orc_${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      title: this.budgetTitle.trim() || `${res.workTypeName} (${res.areaM2} m²)`,
      clientName: this.clientName.trim() || user.name,
      location: this.ui.currentLocation(),
      workType: res.workType,
      workTypeName: res.workTypeName,
      calculationResult: res,
      status: 'rascunho',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.obraService.saveBudget(budget);
    this.saving.set(false);
    this.savedFeedback.set(true);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch {
      // ignora em headless sem canvas
    }
  }

  openPrint(): void {
    const res = this.result();
    if (!res) return;
    const budget: SavedBudget = {
      id: `preview_${Date.now()}`,
      title: this.budgetTitle || res.workTypeName,
      clientName: this.clientName || undefined,
      location: this.ui.currentLocation(),
      workType: res.workType,
      workTypeName: res.workTypeName,
      calculationResult: res,
      status: 'rascunho',
      createdAt: res.calculatedAt,
      updatedAt: res.calculatedAt
    };
    this.ui.openPrintModal(budget);
  }

  async copySummary(): Promise<void> {
    const res = this.result();
    if (!res) return;
    const lines = [
      `Orçamento ConstruTec - ${this.budgetTitle || res.workTypeName}`,
      `Região: ${this.ui.currentLocation().city} (${this.ui.currentLocation().uf})`,
      `Área: ${res.areaM2} m² | Perda: ${res.wastePercentage}%`,
      '',
      ...res.materials.map(m => `- ${m.name}: ${m.commercialQuantity} ${m.unit} (R$ ${m.totalPrice.toFixed(2)})`),
      '',
      `Total Estimado: R$ ${res.totalEstimatedCost.toFixed(2)}`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // ignore
    }
  }
}
