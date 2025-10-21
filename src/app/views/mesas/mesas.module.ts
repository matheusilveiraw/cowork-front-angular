import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MesasComponent } from './mesas.component';
import { MesaCadastroModalComponent } from './mesa-cadastro-modal/mesa-cadastro-modal.component';
import { MesaAluguelModalComponent } from './mesa-aluguel-modal/mesa-aluguel-modal.component';
import { MesaCalendarioModalComponent } from './mesa-calendario-modal/mesa-calendario-modal.component';
import { DateFormatDirective } from '../../shared/directives/date-format.directive';

@NgModule({
  declarations: [
    MesasComponent,
    MesaCadastroModalComponent,
    MesaAluguelModalComponent,
    MesaCalendarioModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DateFormatDirective
  ],
  exports: [
    MesasComponent
  ]
})
export class MesasModule { }