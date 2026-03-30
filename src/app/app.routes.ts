import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';
import { PedidosList } from './pages/pedidos/pedidos-list/pedidos-list';
import { ClientesList } from './pages/clientes/clientes-list/clientes-list';
import { VentasList } from './pages/ventas/ventas-list/ventas-list';

export const routes: Routes = [
  { path: '', redirectTo: 'ventas', pathMatch: 'full' },
  {
    path: '',
    component: Shell,
    children: [
      { path: 'ventas',   component: VentasList   },
      { path: 'pedidos',  component: PedidosList  },
      { path: 'clientes', component: ClientesList },
    ],
  },
];
