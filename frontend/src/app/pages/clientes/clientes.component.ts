import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgroApiService } from '../../services/agro-api.service';
import { Tercero } from '../../models/agro.models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Encabezado de Página -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Clientes</h1>
          <p class="text-sm text-slate-500">Administra tus clientes y sus datos de contacto, CBU y facturación.</p>
        </div>
        <button
          (click)="abrirModalNuevo()"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-agro-600 hover:bg-agro-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all"
        >
          <span>➕</span> Nuevo Cliente
        </button>
      </div>

      <!-- Buscador -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="text-xs font-semibold text-slate-500">
          Total registrados: <strong class="text-slate-800">{{ terceros().length }}</strong> clientes
        </div>

        <div class="relative flex-1 max-w-xs">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs pointer-events-none">🔍</span>
          <input
            type="text"
            [ngModel]="busqueda()"
            (ngModelChange)="busqueda.set($event)"
            placeholder="Buscar por nombre, CUIT/DNI, teléfono..."
            class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-agro-500"
          />
        </div>
      </div>

      <!-- Estado de Carga -->
      @if (cargando()) {
        <div class="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <div class="inline-block w-8 h-8 border-4 border-agro-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="mt-2 text-xs font-semibold text-slate-500">Cargando clientes...</p>
        </div>
      }

      <!-- Estado Vacío -->
      @if (!cargando() && tercerosFiltrados().length === 0) {
        <div class="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <span class="text-4xl">👥</span>
          <h3 class="mt-2 font-bold text-slate-800">No se encontraron clientes</h3>
          <p class="text-xs text-slate-500 mt-1">Aún no hay clientes cargados o ninguno coincide con la búsqueda.</p>
          <button (click)="abrirModalNuevo()" class="mt-4 px-4 py-2 bg-agro-600 hover:bg-agro-700 text-white text-xs font-semibold rounded-xl">
            Registrar Primer Cliente
          </button>
        </div>
      }

      <!-- Grilla de Clientes -->
      @if (!cargando() && tercerosFiltrados().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (item of tercerosFiltrados(); track item.id) {
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 rounded-xl bg-agro-100 text-agro-800 flex items-center justify-center font-bold text-base shrink-0">
                    {{ item.nombre.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <h3 class="font-bold text-slate-900 text-base leading-snug">{{ item.nombre }}</h3>
                  </div>
                </div>

                <!-- Datos de Contacto y Fiscales -->
                <div class="mt-4 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  @if (item.numeroDocumento) {
                    <div class="flex items-center justify-between">
                      <span class="text-slate-400 font-medium">{{ item.tipoDocumento || 'DOC' }}:</span>
                      <span class="font-mono font-semibold text-slate-800">{{ item.numeroDocumento }}</span>
                    </div>
                  }
                  @if (item.telefono) {
                    <div class="flex items-center justify-between">
                      <span class="text-slate-400 font-medium">Teléfono:</span>
                      <span class="font-medium text-slate-700">📞 {{ item.telefono }}</span>
                    </div>
                  }
                  @if (item.email) {
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-slate-400 font-medium shrink-0">Email:</span>
                      <span class="text-slate-700 truncate">{{ item.email }}</span>
                    </div>
                  }
                  @if (item.cbu) {
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-slate-400 font-medium shrink-0">CBU / Alias:</span>
                      <span class="font-mono text-slate-700 truncate">{{ item.cbu }}</span>
                    </div>
                  }
                  @if (item.direccion) {
                    <div class="pt-1 border-t border-slate-200/60 text-slate-500">
                      📍 {{ item.direccion }}
                    </div>
                  }
                  @if (!item.numeroDocumento && !item.telefono && !item.email && !item.cbu && !item.direccion) {
                    <div class="text-slate-400 italic text-center py-1">Sin datos adicionales de contacto</div>
                  }
                </div>

                @if (item.lotes && item.lotes.length > 0) {
                  <div class="mt-3 flex flex-wrap gap-1">
                    @for (l of item.lotes; track l.id) {
                      <span class="px-2 py-0.5 bg-agro-50 text-agro-800 border border-agro-200/60 rounded text-[11px] font-medium">
                        📍 {{ l.nombre }} ({{ l.hectareas }} ha)
                      </span>
                    }
                  </div>
                }
              </div>

              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[11px] text-slate-400">
                  <strong>{{ item._count?.comprobantes || 0 }}</strong> comprobantes &bull;
                  <strong>{{ item._count?.movimientosCereal || 0 }}</strong> mov. acopio
                </span>
                <div class="flex items-center gap-1.5">
                  <button
                    (click)="abrirModalEditar(item)"
                    class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    (click)="eliminar(item)"
                    class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                    title="Eliminar cliente"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal Crear / Editar Cliente -->
      @if (mostrarModal()) {
        <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="text-lg font-bold text-slate-900">
                {{ editandoId() ? 'Editar Cliente' : 'Registrar Nuevo Cliente' }}
              </h3>
              <button (click)="mostrarModal.set(false)" class="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>

            <form (ngSubmit)="guardar()" class="mt-4 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Nombre o Razón Social *</label>
                <input
                  type="text"
                  [(ngModel)]="form.nombre"
                  name="nombre"
                  required
                  placeholder="Ej. Agropecuaria Don Pedro S.A."
                  class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-agro-500"
                />
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Tipo Doc.</label>
                  <select
                    [(ngModel)]="form.tipoDocumento"
                    name="tipoDocumento"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-agro-500"
                  >
                    <option value="CUIT">CUIT</option>
                    <option value="DNI">DNI</option>
                    <option value="CUIL">CUIL</option>
                  </select>
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Número de Documento</label>
                  <input
                    type="text"
                    [(ngModel)]="form.numeroDocumento"
                    name="numeroDocumento"
                    placeholder="Ej. 30-71234567-9"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-agro-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Teléfono</label>
                  <input
                    type="text"
                    [(ngModel)]="form.telefono"
                    name="telefono"
                    placeholder="Ej. +54 9 351 1234567"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-agro-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    [(ngModel)]="form.email"
                    name="email"
                    placeholder="contacto@ejemplo.com"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-agro-500"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">CBU o Alias Bancario</label>
                <input
                  type="text"
                  [(ngModel)]="form.cbu"
                  name="cbu"
                  placeholder="Ej. 0110599520000012345678 o campo.agro.mp"
                  class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-agro-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Dirección / Localidad</label>
                <input
                  type="text"
                  [(ngModel)]="form.direccion"
                  name="direccion"
                  placeholder="Ej. Ruta 9 Km 450, Marcos Juárez"
                  class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-agro-500"
                />
              </div>

              <div class="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  (click)="mostrarModal.set(false)"
                  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-agro-600 hover:bg-agro-700 text-white rounded-xl text-xs font-semibold shadow"
                >
                  {{ editandoId() ? 'Guardar Cambios' : 'Registrar Cliente' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class ClientesComponent implements OnInit {
  private api = inject(AgroApiService);

  terceros = signal<Tercero[]>([]);
  cargando = signal<boolean>(true);
  filtroTipo = signal<string>('');
  busqueda = signal<string>('');

  mostrarModal = signal<boolean>(false);
  editandoId = signal<string | null>(null);

  form: Partial<Tercero> = {
    nombre: '',
    tipo: 'CLIENTE',
    tipoDocumento: 'CUIT',
    numeroDocumento: '',
    telefono: '',
    email: '',
    cbu: '',
    direccion: '',
  };

  tercerosFiltrados = computed(() => {
    const t = this.filtroTipo();
    const q = this.busqueda().trim().toLowerCase();
    let items = this.terceros();

    if (t) {
      items = items.filter((i) => i.tipo === t);
    }
    if (q) {
      items = items.filter(
        (i) =>
          i.nombre.toLowerCase().includes(q) ||
          (i.numeroDocumento && i.numeroDocumento.toLowerCase().includes(q)) ||
          (i.telefono && i.telefono.toLowerCase().includes(q)) ||
          (i.email && i.email.toLowerCase().includes(q))
      );
    }
    return items;
  });

  ngOnInit(): void {
    this.cargarTerceros();
  }

  cargarTerceros(): void {
    this.cargando.set(true);
    this.api.getTerceros().subscribe({
      next: (data) => {
        this.terceros.set(data);
        this.cargando.set(false);
      },
      error: (e) => {
        console.error('Error cargando terceros:', e);
        this.cargando.set(false);
      },
    });
  }

  abrirModalNuevo(): void {
    this.editandoId.set(null);
    this.form = {
      nombre: '',
      tipo: 'CLIENTE',
      tipoDocumento: 'CUIT',
      numeroDocumento: '',
      telefono: '',
      email: '',
      cbu: '',
      direccion: '',
    };
    this.mostrarModal.set(true);
  }

  abrirModalEditar(tercero: Tercero): void {
    this.editandoId.set(tercero.id);
    this.form = {
      nombre: tercero.nombre,
      tipo: tercero.tipo,
      tipoDocumento: tercero.tipoDocumento || 'CUIT',
      numeroDocumento: tercero.numeroDocumento || '',
      telefono: tercero.telefono || '',
      email: tercero.email || '',
      cbu: tercero.cbu || '',
      direccion: tercero.direccion || '',
    };
    this.mostrarModal.set(true);
  }

  guardar(): void {
    const id = this.editandoId();
    if (id) {
      this.api.updateTercero(id, this.form).subscribe({
        next: () => {
          this.mostrarModal.set(false);
          this.cargarTerceros();
        },
        error: (e) => alert('Error al actualizar cliente: ' + (e.error?.error || e.message)),
      });
    } else {
      this.api.createTercero(this.form).subscribe({
        next: () => {
          this.mostrarModal.set(false);
          this.cargarTerceros();
        },
        error: (e) => alert('Error al registrar cliente: ' + (e.error?.error || e.message)),
      });
    }
  }

  eliminar(tercero: Tercero): void {
    if (!confirm(`¿Seguro que deseas eliminar a "${tercero.nombre}"?`)) return;
    this.api.deleteTercero(tercero.id).subscribe({
      next: () => this.cargarTerceros(),
      error: (e) =>
        alert(
          'No se puede eliminar este registro porque tiene lotes, comprobantes o movimientos asociados.'
        ),
    });
  }
}

