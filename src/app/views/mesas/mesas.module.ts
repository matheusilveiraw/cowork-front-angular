import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MesasComponent } from './mesas.component';
import { DateFormatDirective } from '../../shared/directives/date-format.directive';

@NgModule({
  declarations: [
    MesasComponent
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