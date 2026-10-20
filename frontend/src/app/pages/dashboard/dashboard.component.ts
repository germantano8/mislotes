import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AgroApiService } from '../../services/agro-api.service';
import { Lote, SaldoCereal, Trabajo } from '../../models/agro.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8 animate-fade-in">
      <!-- Banner de Bienvenida -->
      <div class="bg-gradient-to-r from-agro-800 to-agro-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div class="relative z-10 max-w-2xl">
          <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">Panel de Control Agrícola</h1>
          <p class="mt-2 text-agro-100 text-sm sm:text-base leading-relaxed">
            Monitoreo en tiempo real de lotes, balance de cereal en acopio, trazabilidad histórica de labores y facturación contable.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <a routerLink="/acopio" class="inline-flex items-center gap-2 px-4 py-2 bg-agro-500 hover:bg-agro-600 text-white rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg">
              🌾 Liquidar Cereal
            </a>
            <a routerLink="/trabajos" class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-medium transition-all backdrop-blur-sm">
              🚜 Registrar Labor
            </a>
            <a routerLink="/lotes" class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-medium transition-all backdrop-blur-sm">
              📍 Administrar Lotes
            </a>
          </div>
        </div>
        <div class="absolute -right-8 -bottom-10 opacity-10 text-white select-none pointer-events-none text-9xl">
          🌾
        </div>
      </div>

      <!-- Tarjetas de Métricas Clave -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <!-- Hectáreas Operadas -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Superficie Total</span>
            <div class="w-10 h-10 rounded-xl bg-agro-100 text-agro-700 flex items-center justify-center text-lg font-bold">
              🗺️
            </div>
          </div>
          <div class="mt-4">
            <div class="text-3xl font-extrabold text-slate-800">{{ totalHectareas() | number:'1.1-2' }} <span class="text-sm font-medium text-slate-500">ha</span></div>
            <p class="mt-1 text-xs text-slate-500 flex items-center gap-1">
              Distribuido en <strong class="text-slate-700">{{ lotes().length }}</strong> parcelas/lotes
            </p>
          </div>
        </div>

        <!-- Cereal Acopiado -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Cereal en Silo/Acopio</span>
            <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-bold">
              🌾
            </div>
          </div>
          <div class="mt-4">
            <div class="text-3xl font-extrabold text-slate-800">{{ (totalKgAcopio() / 1000) | number:'1.1-2' }} <span class="text-sm font-medium text-slate-500">Tn</span></div>
            <p class="mt-1 text-xs text-slate-500 flex items-center gap-1">
              ({{ totalKgAcopio() | number:'1.0-0' }} kg en stock neto)
            </p>
          </div>
        </div>

        <!-- Labores Registradas -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Labores Registradas</span>
            <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
              🚜
            </div>
          </div>
          <div class="mt-4">
            <div class="text-3xl font-extrabold text-slate-800">{{ trabajos().length }}</div>
            <p class="mt-1 text-xs text-slate-500 flex items-center gap-1">
              Siembras, aplicaciones y cosechas
            </p>
          </div>
        </div>
      </div>

      <!-- Sección de Estado de Acopio y Lotes Destacados -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Saldos de Acopio por Tercero -->
        <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h2 class="text-lg font-bold text-slate-800">Saldos de Cereal en Acopio</h2>
              <p class="text-xs text-slate-500">Stock neto disponible por productor y grano</p>
            </div>
            <a routerLink="/acopio" class="text-xs font-semibold text-agro-700 hover:text-agro-800 hover:underline">
              Ver movimientos &rarr;
            </a>
          </div>

          @if (saldos().length === 0) {
            <div class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p class="text-slate-400 text-sm">No hay saldos de cereal registrados.</p>
              <a routerLink="/acopio" class="mt-2 inline-block text-xs font-semibold text-agro-600 hover:underline">Registrar primer movimiento</a>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead>
                  <tr class="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                    <th class="pb-3">Productor / Dueño</th>
                    <th class="pb-3">Cultivo</th>
                    <th class="pb-3 text-right">Saldo en Kilos</th>
                    <th class="pb-3 text-right">Toneladas</th>
                    <th class="pb-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (item of saldos(); track item.terceroId + '-' + item.cultivoId) {
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="py-3 font-semibold text-slate-800 flex items-center gap-2">
                        <span class="w-7 h-7 rounded-lg bg-agro-100 text-agro-800 flex items-center justify-center text-xs font-bold">
                          {{ item.terceroNombre.charAt(0) }}
                        </span>
                        {{ item.terceroNombre }}
                      </td>
                      <td class="py-3">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                          {{ item.cultivoNombre }}
                        </span>
                      </td>
                      <td class="py-3 text-right font-mono font-bold text-slate-800">
                        {{ item.saldoKg | number:'1.0-0' }} kg
                      </td>
                      <td class="py-3 text-right font-mono text-slate-600">
                        {{ (item.saldoKg / 1000) | number:'1.1-2' }} Tn
                      </td>
                      <td class="py-3 text-right">
                        <a routerLink="/acopio" class="text-xs font-medium text-agro-600 hover:text-agro-800 hover:underline">
                          Liquidar
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Últimas Labores Registradas -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-5">
              <div>
                <h2 class="text-lg font-bold text-slate-800">Últimas Labores</h2>
                <p class="text-xs text-slate-500">Historial reciente de trabajos en campo</p>
              </div>
              <a routerLink="/trabajos" class="text-xs font-semibold text-agro-700 hover:text-agro-800 hover:underline">
                Ver todas &rarr;
              </a>
            </div>

            @if (ultimosTrabajos().length === 0) {
              <div class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p class="text-slate-400 text-sm">No hay labores registradas aún.</p>
                <a routerLink="/trabajos" class="mt-2 inline-block text-xs font-semibold text-agro-600 hover:underline">Registrar primera labor</a>
              </div>
            } @else {
              <div class="space-y-3">
                @for (trabajo of ultimosTrabajos(); track trabajo.id) {
                  <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                        [ngClass]="{
                          'bg-emerald-100 text-emerald-700': trabajo.tipo === 'SIEMBRA',
                          'bg-sky-100 text-sky-700': trabajo.tipo === 'FUMIGACION',
                          'bg-amber-100 text-amber-700': trabajo.tipo === 'COSECHA'
                        }">
                        {{ trabajo.tipo === 'SIEMBRA' ? '🌱' : trabajo.tipo === 'FUMIGACION' ? '💧' : '🌾' }}
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-bold text-slate-800 truncate">
                            {{ trabajo.lote?.nombre || 'Lote #' + trabajo.loteId }}
                          </span>
                          <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase"
                            [ngClass]="{
                              'bg-emerald-50 text-emerald-700 border border-emerald-200': trabajo.tipo === 'SIEMBRA',
                              'bg-sky-50 text-sky-700 border border-sky-200': trabajo.tipo === 'FUMIGACION',
                              'bg-amber-50 text-amber-700 border border-amber-200': trabajo.tipo === 'COSECHA'
                            }">
                            {{ trabajo.tipo }}
                          </span>
                        </div>
                        <p class="text-xs text-slate-500 truncate mt-0.5">
                          {{ obtenerCultivoTrabajo(trabajo) }} &bull; {{ trabajo.hectareas | number:'1.0-1' }} ha
                        </p>
                      </div>
                    </div>
                    <div class="text-right shrink-0">
                      <span class="text-xs font-medium text-slate-600">{{ trabajo.fecha | date:'dd/MM/yyyy':'UTC' }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Mostrando últimas {{ ultimosTrabajos().length }} de {{ trabajos().length }} labores</span>
            <a routerLink="/trabajos" class="font-bold text-agro-700 hover:underline">+ Nueva labor</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(AgroApiService);

  lotes = signal<Lote[]>([]);
  saldos = signal<SaldoCereal[]>([]);
  trabajos = signal<Trabajo[]>([]);

  totalHectareas = computed(() => {
    return this.lotes().reduce((acc, l) => acc + Number(l.hectareas || 0), 0);
  });

  ultimosTrabajos = computed(() => {
    return [...this.trabajos()]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5);
  });

  totalKgAcopio = computed(() => {
    return this.saldos().reduce((acc, s) => acc + Number(s.saldoKg || 0), 0);
  });

  obtenerCultivoTrabajo(trabajo: Trabajo): string {
    if (trabajo.siembra?.cultivo?.nombre) return trabajo.siembra.cultivo.nombre;
    if (trabajo.cosecha?.cultivo?.nombre) return trabajo.cosecha.cultivo.nombre;
    if (trabajo.fumigacion?.cultivo?.nombre) return trabajo.fumigacion.cultivo.nombre;
    return trabajo.tipo === 'FUMIGACION' ? 'Barbecho / General' : 'Sin cultivo';
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.api.getLotes().subscribe({
      next: (data) => this.lotes.set(data),
      error: (e) => console.error('Error cargando lotes:', e),
    });

    this.api.getSaldosAcopio().subscribe({
      next: (data) => this.saldos.set(data),
      error: (e) => console.error('Error cargando saldos:', e),
    });

    this.api.getTrabajos().subscribe({
      next: (data) => this.trabajos.set(data),
      error: (e) => console.error('Error cargando trabajos:', e),
    });
  }
}

