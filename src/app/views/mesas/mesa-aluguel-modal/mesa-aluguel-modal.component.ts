import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateFormatDirective } from '../../../shared/directives/date-format.directive';

interface Mesa {
  idDesks: number;
  numberDesks: number;
  nameDesks: string;
}

interface Cliente {
  idCustomers: number;
  nameCustomers: string;
  emailCustomers: string;
}

interface PlanoAluguel {
  idRentalPlans: number;
  planNameRentalPlans: string;
  priceRentalPlans: number;
  rentalCategory: {
    idRentalCategories: number;
    nameRentalCategories: string;
    baseDurationInDaysRentalCategories: number;
  };
  rentalShift: {
    idRentalShifts: number;
    nameRentalShifts: string;
    startTimeRentalShifts: string;
    endTimeRentalShifts: string;
  };
}

@Component({
  selector: 'app-mesa-aluguel-modal',
  templateUrl: './mesa-aluguel-modal.component.html',
  styleUrls: ['./mesa-aluguel-modal.component.scss'],
  imports: [CommonModule, FormsModule, DateFormatDirective]
})
export class MesaAluguelModalComponent {
  @Input() abrir: boolean = false;
  @Input() mesaSelecionada: Mesa | null = null;
  @Input() mesasDisponiveis: Mesa[] = [];
  @Input() clientes: Cliente[] = [];
  @Input() planosAluguel: PlanoAluguel[] = [];
  @Input() aluguelFormData: any = {};
  @Input() salvando: boolean = false;
  @Input() horarioInicio: string = '';
  @Input() horarioFim: string = '';
  @Input() dataTermino: string = '';
  @Input() dataInicioDisplay: string = '';

  @Output() fechar = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<void>();
  @Output() planoChange = new EventEmitter<void>();
  @Output() dataInicioChange = new EventEmitter<any>();
  @Output() abrirModalCliente = new EventEmitter<void>();
  @Output() abrirModalAluguelGeral = new EventEmitter<void>();

  onFechar() {
    this.fechar.emit();
  }

  onSalvar() {
    this.salvar.emit();
  }

  onPlanoChange() {
    this.planoChange.emit();
  }

  onDataInicioChange(event: any) {
    this.dataInicioChange.emit(event);
  }

  onAbrirModalCliente() {
    this.abrirModalCliente.emit();
  }

  onAbrirModalAluguelGeral() {
    this.abrirModalAluguelGeral.emit();
  }
}