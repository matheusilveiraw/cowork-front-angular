import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Mesa {
  idDesks: number;
  numberDesks: number;
  nameDesks: string;
}

interface Turno {
  idRentalShifts: number;
  nameRentalShifts: string;
  descriptionRentalShifts: string;
  startTimeRentalShifts: string;
  endTimeRentalShifts: string;
}

@Component({
  selector: 'app-mesa-calendario-modal',
  templateUrl: './mesa-calendario-modal.component.html',
  styleUrls: ['./mesa-calendario-modal.component.scss'],
  imports: [CommonModule]
})
export class MesaCalendarioModalComponent {
  @Input() abrir: boolean = false;
  @Input() mesas: Mesa[] = [];
  @Input() mesaCalendarioAtual: Mesa | null = null;
  @Input() alugueisMesa: any[] = [];
  @Input() turnos: Turno[] = [];
  @Input() mesAtual: Date = new Date();
  @Input() loading: boolean = false;

  @Output() fechar = new EventEmitter<void>();
  @Output() mudarMesa = new EventEmitter<any>();
  @Output() mesAnterior = new EventEmitter<void>();
  @Output() mesProximo = new EventEmitter<void>();

  onFechar() {
    this.fechar.emit();
  }

  onMudarMesa(event: any) {
    this.mudarMesa.emit(event);
  }

  onMesAnterior() {
    this.mesAnterior.emit();
  }

  onMesProximo() {
    this.mesProximo.emit();
  }

  getDiasDoMes(): (Date | null)[] {
    const year = this.mesAtual.getFullYear();
    const month = this.mesAtual.getMonth();

    const primeiroDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);

    const diasVaziosInicio = primeiroDia.getDay();

    const dias: (Date | null)[] = [];

    for (let i = 0; i < diasVaziosInicio; i++) {
      dias.push(null);
    }

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(year, month, dia));
    }

    return dias;
  }

  getDiasDaSemana(): string[] {
    return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  }

  getNomeMes(): string {
    const options = { month: 'long', year: 'numeric' } as const;
    return this.mesAtual.toLocaleDateString('pt-BR', options);
  }

  estaDiaOcupado(data: Date): boolean {
    if (!data) return false;

    return this.alugueisMesa.some(aluguel => {
      const inicio = new Date(aluguel.startPeriodDeskRentals);
      const fim = new Date(aluguel.endPeriodDeskRentals);

      return data >= new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate()) &&
        data <= new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
    });
  }

  getTurnosOcupados(data: Date): string[] {
    if (!data) return [];

    const turnosOcupados: string[] = [];

    this.alugueisMesa.forEach(aluguel => {
      const inicio = new Date(aluguel.startPeriodDeskRentals);
      const fim = new Date(aluguel.endPeriodDeskRentals);

      if (data >= new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate()) &&
        data <= new Date(fim.getFullYear(), fim.getMonth(), fim.getDate())) {

        if (aluguel.rentalPlan && aluguel.rentalPlan.rentalShift) {
          turnosOcupados.push(aluguel.rentalPlan.rentalShift.nameRentalShifts);
        }
      }
    });

    return turnosOcupados;
  }

  getCorTurno(turnoNome: string): string {
    const turno = this.turnos.find(t => t.nameRentalShifts === turnoNome);

    if (!turno) return 'bg-secondary';

    const cores: { [key: string]: string } = {
      '1': 'bg-warning',
      '2': 'bg-info',
      '3': 'bg-primary',
      'Manhã': 'bg-warning',
      'Tarde': 'bg-info',
      'Dia Todo': 'bg-primary',
      'Noite': 'bg-dark'
    };

    return cores[turno.idRentalShifts.toString()] || cores[turnoNome] || 'bg-secondary';
  }

  ehHoje(data: Date): boolean {
    if (!data) return false;

    const hoje = new Date();
    return data.getDate() === hoje.getDate() &&
      data.getMonth() === hoje.getMonth() &&
      data.getFullYear() === hoje.getFullYear();
  }

  getDiaClass(dia: Date | null): string {
    const classes = ['calendar-day-cell'];

    if (!dia) {
      classes.push('empty');
      return classes.join(' ');
    }

    if (this.ehHoje(dia)) {
      classes.push('today');
    }

    if (this.estaDiaOcupado(dia)) {
      classes.push('occupied');
    } else {
      classes.push('available');
    }

    return classes.join(' ');
  }

  getTooltipDia(dia: Date | null): string {
    if (!dia) return '';

    const turnosOcupados = this.getTurnosOcupados(dia);

    let tooltip = `Dia ${dia.toLocaleDateString('pt-BR')}\n`;

    if (turnosOcupados.length > 0) {
      tooltip += `🟥 Ocupado: ${turnosOcupados.join(', ')}`;
    } else {
      tooltip += `🟩 Totalmente Disponível`;
    }

    return tooltip.trim();
  }

  getClasseTurno(turnoNome: string): string {
    const baseClass = 'shift-badge ';
    const cor = this.getCorTurno(turnoNome);
    return baseClass + cor;
  }

  getAbreviacaoTurno(turnoNome: string): string {
    const turno = this.turnos.find(t => t.nameRentalShifts === turnoNome);

    if (!turno) {
      return turnoNome.charAt(0);
    }

    const palavras = turno.nameRentalShifts.split(' ');
    if (palavras.length === 1) {
      return turno.nameRentalShifts.charAt(0);
    } else {
      return palavras.map(palavra => palavra.charAt(0)).join('');
    }
  }

  getDescricaoTurno(turnoNome: string): string {
    const turno = this.turnos.find(t => t.nameRentalShifts === turnoNome);
    return turno ? `${turno.nameRentalShifts} (${turno.startTimeRentalShifts} às ${turno.endTimeRentalShifts})` : turnoNome;
  }

  getTurnosDoDia(data: Date): { nome: string, ocupado: boolean }[] {
    if (!data) return [];

    const turnosOcupados = this.getTurnosOcupados(data);

    return this.turnos
      .filter(turno => turnosOcupados.includes(turno.nameRentalShifts))
      .map(turno => ({
        nome: turno.nameRentalShifts,
        ocupado: true
      }));
  }

  getTituloTurno(turnoNome: string): string {
    const descricao = this.getDescricaoTurno(turnoNome);
    return `${descricao} - Ocupado`;
  }
}