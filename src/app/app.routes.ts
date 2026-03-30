import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';
import { PedidosList } from './pages/pedidos/pedidos-list/pedidos-list';

export const routes: Routes = [
  { path: '', redirectTo: 'pedidos', pathMatch: 'full' },
  {
    path: '',
    component: Shell,
    children: [
      { path: 'pedidos', component: PedidosList },
    ],
  },
];
