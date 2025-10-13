import { Routes } from '@angular/router';
import { MesasComponent } from './mesas.component';

export const routes: Routes = [
  {
    path: '',
    component: MesasComponent,
    data: {
      title: 'Mesas'
    }
  }
];