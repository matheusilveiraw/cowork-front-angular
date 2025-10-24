import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateFormatDirective } from '../../shared/directives/date-format.directive';
import Swal from 'sweetalert2';

// Interfaces
interface Mesa {
  idDesks: number;
  numberDesks: number;
  nameDesks: string;
  status?: 'available' | 'occupied' | 'unavailable';
  nextAvailableDate?: string;
  currentRental?: any;
}

interface Cliente {
  idCustomers: number;
  nameCustomers: string;
  emailCustomers: string;
  phoneCustomers: string;
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

interface Turno {
  idRentalShifts: number;
  nameRentalShifts: string;
  descriptionRentalShifts: string;
  startTimeRentalShifts: string;
  endTimeRentalShifts: string;
}

interface AluguelMesa {
  idDeskRentals: number;
  startPeriodDeskRentals: string;
  endPeriodDeskRentals: string;
  totalPriceDeskRentals: number;
  desk: Mesa;
  customer: Cliente;
  rentalPlan: PlanoAluguel;
}

interface ApiResponse {
  data: any[];
  success: boolean;
  count: number;
  message: string;
}

interface Notification {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
  visible: boolean;
}

@Component({
  selector: 'app-mesas',
  templateUrl: './mesas.component.html',
  styleUrls: ['./mesas.component.scss'],
  imports: [CommonModule, FormsModule, DateFormatDirective],
})
export class MesasComponent implements OnInit {
  // Arrays de dados
  mesas: Mesa[] = [];
  clientes: Cliente[] = [];
  planosAluguel: PlanoAluguel[] = [];
  turnos: Turno[] = [];
  alugueisAtivos: AluguelMesa[] = [];

  // Estados de loading
  loading: boolean = false;
  salvando: boolean = false;
  salvandoAluguel: boolean = false;

  // Estados dos modais
  abrirModalCadastroMesa: boolean = false;
  abrirModalAluguelMesa: boolean = false;
  mesaEditando: Mesa | null = null;
  mesaSelecionadaAluguel: Mesa | null = null;

  // Calendario
  abrirModalCalendario: boolean = false;
  mesaSelecionadaCalendario: Mesa | null = null;
  mesaCalendarioAtual: Mesa | null = null;
  alugueisMesa: any[] = [];
  mesAtualCalendario: Date = new Date();
  loadingCalendario: boolean = false;

  // Dados dos formulários
  mesaFormData: any = {
    numberDesks: null,
    nameDesks: ''
  };

  aluguelFormData: any = {
    idDesks: '',
    idCustomers: '',
    idRentalPlans: '',
    startPeriodDeskRentals: '',
    endPeriodDeskRentals: '',
    totalPriceDeskRentals: 0
  };

  // Para exibição no template
  horarioInicio: string = '';
  horarioFim: string = '';
  dataTermino: string = '';
  dataInicioDisplay: string = '';

  // Notificações
  notifications: Notification[] = [];
  private notificationId: number = 0;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.buscarMesas();
    this.buscarClientes();
    this.buscarPlanosAluguel();
    this.buscarTurnos();
  }

  // ========== MÉTODOS DE NOTIFICAÇÃO ==========

  showNotification(type: 'success' | 'error' | 'info', message: string) {
    const notification: Notification = {
      id: this.notificationId++,
      type,
      message,
      visible: true
    };

    this.notifications.push(notification);

    // Auto-remover após 5 segundos
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, 5000);
  }

  removeNotification(id: number) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.visible = false;
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n.id !== id);
      }, 300);
    }
  }

  // ========== MÉTODOS PARA BUSCAR DADOS ==========

  async buscarMesas() {
    this.loading = true;
    try {
      const response = await this.http.get<ApiResponse>('http://localhost:8080/api/desks').toPromise();
      if (response) {
        this.mesas = response.data || [];
        await this.buscarStatusMesas();
      }
    } catch (error: any) {
      console.error('Erro ao buscar mesas:', error);
      this.showNotification('error', 'Erro ao carregar mesas: ' + (error.error?.message || error.message));
    } finally {
      this.loading = false;
    }
  }

  async buscarClientes() {
    try {
      const response = await this.http.get<ApiResponse>('http://localhost:8080/api/customers').toPromise();
      if (response) {
        this.clientes = response.data || [];
      }
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error);
    }
  }

  async buscarPlanosAluguel() {
    try {
      const response = await this.http.get<ApiResponse>('http://localhost:8080/api/rental-plans').toPromise();
      if (response) {
        this.planosAluguel = response.data || [];
      }
    } catch (error: any) {
      console.error('Erro ao buscar planos de aluguel:', error);
    }
  }

  async buscarTurnos() {
    try {
      const response = await this.http.get<ApiResponse>('http://localhost:8080/api/rental-shifts').toPromise();
      if (response) {
        this.turnos = response.data || [];
      }
    } catch (error: any) {
      console.error('Erro ao buscar turnos:', error);
    }
  }

  // ========== MÉTODOS DE STATUS DAS MESAS ==========

  async buscarStatusMesas() {
    try {
      const response = await this.http.get<ApiResponse>('http://localhost:8080/api/desk-rentals').toPromise();

      if (response && response.data) {
        this.alugueisAtivos = response.data;
        const agora = new Date();

        this.mesas.forEach(mesa => {
          const alugueisMesa = this.alugueisAtivos.filter(aluguel =>
            aluguel.desk?.idDesks === mesa.idDesks
          );

          const aluguelAtivo = alugueisMesa.find(aluguel => {
            const inicio = new Date(aluguel.startPeriodDeskRentals);
            const fim = new Date(aluguel.endPeriodDeskRentals);
            return inicio <= agora && fim >= agora;
          });

          if (aluguelAtivo) {
            mesa.status = 'occupied';
            mesa.currentRental = aluguelAtivo;
            mesa.nextAvailableDate = aluguelAtivo.endPeriodDeskRentals;
          } else {
            mesa.status = 'available';
            mesa.currentRental = null;

            const alugueisFuturos = alugueisMesa.filter(aluguel =>
              new Date(aluguel.startPeriodDeskRentals) > agora
            );

            if (alugueisFuturos.length > 0) {
              const proximoAluguel = alugueisFuturos.sort((a, b) =>
                new Date(a.startPeriodDeskRentals).getTime() - new Date(b.startPeriodDeskRentals).getTime()
              )[0];
              mesa.nextAvailableDate = proximoAluguel.startPeriodDeskRentals;
            } else {
              mesa.nextAvailableDate = undefined;
            }
          }
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar status das mesas:', error);
      this.mesas.forEach(mesa => {
        mesa.status = 'available';
        mesa.nextAvailableDate = undefined;
      });
    }
  }

  estaDisponivel(mesa: Mesa): boolean {
    return mesa.status === 'available';
  }

  getStatusClass(mesa: Mesa): string {
    switch (mesa.status) {
      case 'available':
        return 'status-disponivel';
      case 'occupied':
        return 'status-ocupado';
      default:
        return 'status-indisponivel';
    }
  }

  getStatusText(mesa: Mesa): string {
    switch (mesa.status) {
      case 'available':
        return 'Disponível';
      case 'occupied':
        return 'Ocupada';
      default:
        return 'Indisponível';
    }
  }

  getProximaDisponibilidade(mesa: Mesa): string {
    if (mesa.status === 'available') {
      return 'Agora';
    }

    if (mesa.nextAvailableDate) {
      const data = new Date(mesa.nextAvailableDate);
      return this.formatarDataParaDisplay(data);
    }

    return 'Indisponível';
  }

  getMesasDisponiveis(): number {
    return this.mesas.filter(mesa => this.estaDisponivel(mesa)).length;
  }

  getMesasOcupadas(): number {
    return this.mesas.filter(mesa => mesa.status === 'occupied').length;
  }

  get mesasDisponiveis(): Mesa[] {
    return this.mesas; // REMOVIDO: .filter(mesa => this.estaDisponivel(mesa)) - agora mostra todas as mesas
  }

  // ========== MÉTODOS DOS MODAIS ==========

  abrirModalCadastro() {
    this.mesaEditando = null;
    this.mesaFormData = {
      numberDesks: null,
      nameDesks: ''
    };
    this.abrirModalCadastroMesa = true;
  }

  abrirModalEdicao(mesa: Mesa) {
    this.mesaEditando = { ...mesa };
    this.mesaFormData = {
      numberDesks: mesa.numberDesks,
      nameDesks: mesa.nameDesks || ''
    };
    this.abrirModalCadastroMesa = true;
  }

  fecharModalCadastro() {
    this.abrirModalCadastroMesa = false;
    this.mesaEditando = null;
    this.mesaFormData = {
      numberDesks: null,
      nameDesks: ''
    };
    this.salvando = false;
  }

  abrirModalAluguel(mesa: Mesa) {
    // REMOVIDO: Verificação de disponibilidade - sempre permite abrir o modal
    this.mesaSelecionadaAluguel = { ...mesa };
    this.inicializarFormAluguel();
    this.abrirModalAluguelMesa = true;
  }

  abrirModalAluguelGeral() {
    this.mesaSelecionadaAluguel = null;
    this.inicializarFormAluguel();
    this.abrirModalAluguelMesa = true;
  }

  inicializarFormAluguel() {
    const hoje = new Date();
    this.dataInicioDisplay = this.formatarDataParaDisplay(hoje);

    this.aluguelFormData = {
      idDesks: this.mesaSelecionadaAluguel?.idDesks?.toString() || '',
      idCustomers: '',
      idRentalPlans: '',
      startPeriodDeskRentals: this.formatarDataParaBackend(hoje),
      endPeriodDeskRentals: '',
      totalPriceDeskRentals: 0
    };

    this.horarioInicio = '';
    this.horarioFim = '';
    this.dataTermino = '';
  }

  fecharModalAluguel() {
    this.abrirModalAluguelMesa = false;
    this.mesaSelecionadaAluguel = null;
    this.aluguelFormData = {
      idDesks: '',
      idCustomers: '',
      idRentalPlans: '',
      startPeriodDeskRentals: '',
      endPeriodDeskRentals: '',
      totalPriceDeskRentals: 0
    };
    this.horarioInicio = '';
    this.horarioFim = '';
    this.dataTermino = '';
    this.dataInicioDisplay = '';
    this.salvandoAluguel = false;
  }

  // ========== MÉTODOS DE FORMULÁRIO ==========

  async salvarMesa() {
    if (this.salvando) return;

    this.salvando = true;

    try {
      let response: any;

      if (this.mesaEditando) {
        response = await this.http.put(`http://localhost:8080/api/desks/${this.mesaEditando.idDesks}`, this.mesaFormData).toPromise();
        const message = response?.message || 'Mesa atualizada com sucesso!';
        this.showNotification('success', message);
      } else {
        response = await this.http.post('http://localhost:8080/api/desks', this.mesaFormData).toPromise();
        const message = response?.message || 'Mesa cadastrada com sucesso!';
        this.showNotification('success', message);
      }

      this.fecharModalCadastro();
      this.buscarMesas();

    } catch (error: any) {
      console.error('Erro ao salvar mesa:', error);
      const errorMessage = error.error?.message || error.message || 'Erro ao salvar mesa';
      this.showNotification('error', errorMessage);
    } finally {
      this.salvando = false;
    }
  }

  onPlanoChange() {
    this.calcularDatasETotal();
  }

  onDataInicioChange(event: any) {
    const dataSelecionada = event.target.value;

    if (this.validarData(dataSelecionada)) {
      this.dataInicioDisplay = dataSelecionada;
      const dataObj = this.parseDataDisplay(dataSelecionada);
      this.aluguelFormData.startPeriodDeskRentals = this.formatarDataParaBackend(dataObj);
      this.calcularDatasETotal();
    } else {
      event.target.value = this.dataInicioDisplay;
    }
  }

  validarData(data: string): boolean {
    if (!data || data === '') return true;

    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(data)) return false;

    const [, dia, mes, ano] = data.match(regex) || [];
    const diaNum = parseInt(dia, 10);
    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt(ano, 10);

    if (diaNum < 1 || diaNum > 31) return false;
    if (mesNum < 1 || mesNum > 12) return false;
    if (anoNum < 1900 || anoNum > 2100) return false;

    const dataObj = new Date(anoNum, mesNum - 1, diaNum);
    return dataObj.getDate() === diaNum &&
      dataObj.getMonth() === mesNum - 1 &&
      dataObj.getFullYear() === anoNum;
  }

  parseDataDisplay(data: string): Date {
    const [dia, mes, ano] = data.split('/').map(Number);
    return new Date(ano, mes - 1, dia);
  }

  calcularDatasETotal() {
    const idRentalPlans = this.aluguelFormData.idRentalPlans ? Number(this.aluguelFormData.idRentalPlans) : null;

    if (idRentalPlans && this.aluguelFormData.startPeriodDeskRentals) {
      const planoSelecionado = this.planosAluguel.find(p => p.idRentalPlans == idRentalPlans);

      if (planoSelecionado) {
        this.horarioInicio = planoSelecionado.rentalShift.startTimeRentalShifts;
        this.horarioFim = planoSelecionado.rentalShift.endTimeRentalShifts;

        const dataInicio = new Date(this.aluguelFormData.startPeriodDeskRentals);
        const duracaoDias = planoSelecionado.rentalCategory.baseDurationInDaysRentalCategories - 1;
        const dataTermino = new Date(dataInicio);
        dataTermino.setDate(dataTermino.getDate() + duracaoDias);

        this.dataTermino = this.formatarDataParaDisplay(dataTermino);

        this.aluguelFormData.startPeriodDeskRentals = `${this.aluguelFormData.startPeriodDeskRentals.split('T')[0]}T${this.horarioInicio}`;
        this.aluguelFormData.endPeriodDeskRentals = `${dataTermino.toISOString().split('T')[0]}T${this.horarioFim}`;

        this.aluguelFormData.totalPriceDeskRentals = planoSelecionado.priceRentalPlans;
      }
    } else {
      this.horarioInicio = '';
      this.horarioFim = '';
      this.dataTermino = '';
      this.aluguelFormData.totalPriceDeskRentals = 0;
    }
  }

  async salvarAluguel() {
    if (this.salvandoAluguel) return;

    this.salvandoAluguel = true;

    try {
      const idDesks = this.mesaSelecionadaAluguel ?
        this.mesaSelecionadaAluguel.idDesks :
        Number(this.aluguelFormData.idDesks);

      // Converter data do formato brasileiro para o formato da API
      const dataInicioAPI = this.converterDataParaAPI(this.dataInicioDisplay);
      
      // Combinar data com horário de início
      const startPeriodCompleto = `${dataInicioAPI}T${this.horarioInicio}`;
      const endPeriodCompleto = this.aluguelFormData.endPeriodDeskRentals;

      const dadosAluguel = {
        idDesks: idDesks,
        idCustomers: Number(this.aluguelFormData.idCustomers),
        idRentalPlans: Number(this.aluguelFormData.idRentalPlans),
        startPeriodDeskRentals: startPeriodCompleto,
        endPeriodDeskRentals: endPeriodCompleto,
        totalPriceDeskRentals: this.aluguelFormData.totalPriceDeskRentals
      };

      console.log('Dados enviados para API:', dadosAluguel); // Para debug

      const response = await this.http.post('http://localhost:8080/api/desk-rentals', dadosAluguel).toPromise();

      const message = (response as any)?.message || 'Aluguel realizado com sucesso!';
      this.showNotification('success', message);

      this.fecharModalAluguel();
      await this.buscarMesas();

    } catch (error: any) {
      console.error('Erro ao realizar aluguel:', error);
      const errorMessage = error.error?.message || error.message || 'Erro ao realizar aluguel';
      this.showNotification('error', errorMessage);
    } finally {
      this.salvandoAluguel = false;
    }
  }

  converterDataParaAPI(dataBR: string): string {
    if (!dataBR) return '';
    
    const [dia, mes, ano] = dataBR.split('/');
    return `${ano}-${mes}-${dia}`;
  }

  abrirModalCliente() {
    this.showNotification('info', 'Funcionalidade de cadastro de cliente será implementada em breve');
  }

  async confirmarExclusao(mesa: Mesa) {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: `Deseja excluir a mesa "${mesa.numberDesks} - ${mesa.nameDesks || 'Mesa sem nome'}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      await this.excluirMesa(mesa);
    }
  }

  async excluirMesa(mesa: Mesa) {
    try {
      const alugueisResponse = await this.http.get<ApiResponse>(`http://localhost:8080/api/desk-rentals?deskId=${mesa.idDesks}`).toPromise();

      if (alugueisResponse && alugueisResponse.data && alugueisResponse.data.length > 0) {
        this.showNotification('error', 'Esta mesa possui aluguéis vinculados e não pode ser removida. Exclua os aluguéis primeiro.');
        return;
      }

      const response = await this.http.delete(`http://localhost:8080/api/desks/${mesa.idDesks}`).toPromise();
      const message = (response as any)?.message || 'Mesa excluída com sucesso!';
      this.showNotification('success', message);
      this.buscarMesas();

    } catch (error: any) {
      console.error('Erro ao excluir mesa:', error);
      const errorMessage = error.error?.message || error.message || 'Erro ao excluir mesa';
      this.showNotification('error', errorMessage);
    }
  }

  formatarDataParaDisplay(data: Date): string {
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  formatarDataParaBackend(data: Date): string {
    return data.toISOString().split('T')[0];
  }

  // ========== MÉTODOS DO CALENDÁRIO ==========

  abrirModalCalendarioMesa(mesa: Mesa) {
    this.mesaSelecionadaCalendario = mesa;
    this.mesaCalendarioAtual = mesa;
    this.abrirModalCalendario = true;
    this.carregarAlugueisMesa(mesa.idDesks);
    this.mesAtualCalendario = new Date();
  }

  fecharModalCalendario() {
    this.abrirModalCalendario = false;
    this.mesaSelecionadaCalendario = null;
    this.mesaCalendarioAtual = null;
    this.alugueisMesa = [];
    this.mesAtualCalendario = new Date();
  }

  async carregarAlugueisMesa(idDesks: number) {
    this.loadingCalendario = true;
    try {
      const response = await this.http.get<ApiResponse>(`http://localhost:8080/api/desk-rentals?deskId=${idDesks}`).toPromise();
      if (response) {
        this.alugueisMesa = response.data || [];
      }
    } catch (error: any) {
      console.error('Erro ao buscar aluguéis da mesa:', error);
      this.showNotification('error', 'Erro ao carregar calendário: ' + (error.error?.message || error.message));
    } finally {
      this.loadingCalendario = false;
    }
  }

  mudarMesaCalendario(event: any) {
    const idMesa = Number(event.target.value);
    const mesa = this.mesas.find(m => m.idDesks === idMesa);
    if (mesa) {
      this.mesaCalendarioAtual = mesa;
      this.carregarAlugueisMesa(mesa.idDesks);
    }
  }

  mesAnterior() {
    this.mesAtualCalendario = new Date(
      this.mesAtualCalendario.getFullYear(),
      this.mesAtualCalendario.getMonth() - 1,
      1
    );
  }

  mesProximo() {
    this.mesAtualCalendario = new Date(
      this.mesAtualCalendario.getFullYear(),
      this.mesAtualCalendario.getMonth() + 1,
      1
    );
  }

  getDiasDoMes(): (Date | null)[] {
    const year = this.mesAtualCalendario.getFullYear();
    const month = this.mesAtualCalendario.getMonth();

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
    return this.mesAtualCalendario.toLocaleDateString('pt-BR', options);
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