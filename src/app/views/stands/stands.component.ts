import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateFormatDirective } from '../../shared/directives/date-format.directive';
import Swal from 'sweetalert2';

interface Stand {
  idStands: number;
  numberStands: number;
  nameStands: string;
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

interface AluguelStand {
  idStandRentals: number;
  startPeriodStandRentals: string;
  endPeriodStandRentals: string;
  totalPriceStandRentals: number;
  stand: Stand;
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
  selector: 'app-stands',
  templateUrl: './stands.component.html',
  styleUrls: ['./stands.component.scss'],
  imports: [CommonModule, FormsModule, DateFormatDirective],
})
export class StandsComponent implements OnInit {
  // Arrays de dados
  stands: Stand[] = [];
  clientes: Cliente[] = [];
  planosAluguel: PlanoAluguel[] = [];
  turnos: Turno[] = [];
  alugueisAtivos: AluguelStand[] = [];

  // Estados de loading
  loading: boolean = false;
  salvando: boolean = false;
  salvandoAluguel: boolean = false;

  // Estados dos modais
  abrirModalCadastroStand: boolean = false;
  abrirModalAluguelStand: boolean = false;
  standEditando: Stand | null = null;
  standSelecionadoAluguel: Stand | null = null;

  // Calendário
  abrirModalCalendario: boolean = false;
  standSelecionadoCalendario: Stand | null = null;
  standCalendarioAtual: Stand | null = null;
  alugueisStand: any[] = [];
  mesAtualCalendario: Date = new Date();
  loadingCalendario: boolean = false;

  // Dados dos formulários
  standFormData: any = {
    numberStands: null,
    nameStands: ''
  };

  aluguelFormData: any = {
    idStands: '',
    idCustomers: '',
    idRentalPlans: '',
    startPeriodStandRentals: '',
    endPeriodStandRentals: '',
    totalPriceStandRentals: 0
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
    this.buscarStands();
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

  async buscarStands() {
    this.loading = true;
    try {
      const response = await this.http.get<ApiResponse>('http://localhost:8080/api/stands').toPromise();
      if (response) {
        this.stands = response.data || [];
        await this.buscarStatusStands();
      }
    } catch (error: any) {
      console.error('Erro ao buscar stands:', error);
      this.showNotification('error', 'Erro ao carregar stands: ' + (error.error?.message || error.message));
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

  // ========== MÉTODOS DE STATUS DOS STANDS ==========

  async buscarStatusStands() {
    try {
      const response = await this.http.get<ApiResponse>('http://localhost:8080/api/stand-rentals').toPromise();

      if (response && response.data) {
        this.alugueisAtivos = response.data;
        const agora = new Date();

        this.stands.forEach(stand => {
          const alugueisStand = this.alugueisAtivos.filter(aluguel =>
            aluguel.stand?.idStands === stand.idStands
          );

          const aluguelAtivo = alugueisStand.find(aluguel => {
            const inicio = new Date(aluguel.startPeriodStandRentals);
            const fim = new Date(aluguel.endPeriodStandRentals);
            return inicio <= agora && fim >= agora;
          });

          if (aluguelAtivo) {
            stand.status = 'occupied';
            stand.currentRental = aluguelAtivo;
            stand.nextAvailableDate = aluguelAtivo.endPeriodStandRentals;
          } else {
            stand.status = 'available';
            stand.currentRental = null;

            const alugueisFuturos = alugueisStand.filter(aluguel =>
              new Date(aluguel.startPeriodStandRentals) > agora
            );

            if (alugueisFuturos.length > 0) {
              const proximoAluguel = alugueisFuturos.sort((a, b) =>
                new Date(a.startPeriodStandRentals).getTime() - new Date(b.startPeriodStandRentals).getTime()
              )[0];
              stand.nextAvailableDate = proximoAluguel.startPeriodStandRentals;
            } else {
              stand.nextAvailableDate = undefined;
            }
          }
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar status dos stands:', error);
      this.stands.forEach(stand => {
        stand.status = 'available';
        stand.nextAvailableDate = undefined;
      });
    }
  }

  estaDisponivel(stand: Stand): boolean {
    return stand.status === 'available';
  }

  getStatusClass(stand: Stand): string {
    switch (stand.status) {
      case 'available':
        return 'status-disponivel';
      case 'occupied':
        return 'status-ocupado';
      default:
        return 'status-indisponivel';
    }
  }

  getStatusText(stand: Stand): string {
    switch (stand.status) {
      case 'available':
        return 'Disponível';
      case 'occupied':
        return 'Ocupada';
      default:
        return 'Indisponível';
    }
  }

  getProximaDisponibilidade(stand: Stand): string {
    if (stand.status === 'available') {
      return 'Agora';
    }

    if (stand.nextAvailableDate) {
      const data = new Date(stand.nextAvailableDate);
      return this.formatarDataParaDisplay(data);
    }

    return 'Indisponível';
  }

  getStandsDisponiveis(): number {
    return this.stands.filter(stand => this.estaDisponivel(stand)).length;
  }

  getStandsOcupados(): number {
    return this.stands.filter(stand => stand.status === 'occupied').length;
  }

  get standsDisponiveis(): Stand[] {
    return this.stands.filter(stand => this.estaDisponivel(stand));
  }

  // ========== MÉTODOS DO MODAL DE CADASTRO/EDIÇÃO ==========

  abrirModalCadastro() {
    this.standEditando = null;
    this.standFormData = {
      numberStands: null,
      nameStands: ''
    };
    this.abrirModalCadastroStand = true;
  }

  abrirModalEdicao(stand: Stand) {
    this.standEditando = { ...stand };
    this.standFormData = {
      numberStands: stand.numberStands,
      nameStands: stand.nameStands || ''
    };
    this.abrirModalCadastroStand = true;
  }

  fecharModalCadastro() {
    this.abrirModalCadastroStand = false;
    this.standEditando = null;
    this.standFormData = {
      numberStands: null,
      nameStands: ''
    };
    this.salvando = false;
  }

  async salvarStand() {
    if (this.salvando) return;

    this.salvando = true;

    try {
      let response: any;

      if (this.standEditando) {
        response = await this.http.put(`http://localhost:8080/api/stands/${this.standEditando.idStands}`, this.standFormData).toPromise();
        const message = response?.message || 'Stand atualizado com sucesso!';
        this.showNotification('success', message);
      } else {
        response = await this.http.post('http://localhost:8080/api/stands', this.standFormData).toPromise();
        const message = response?.message || 'Stand cadastrado com sucesso!';
        this.showNotification('success', message);
      }

      this.fecharModalCadastro();
      this.buscarStands();

    } catch (error: any) {
      console.error('Erro ao salvar stand:', error);
      const errorMessage = error.error?.message || error.message || 'Erro ao salvar stand';
      this.showNotification('error', errorMessage);
    } finally {
      this.salvando = false;
    }
  }

  // ========== MÉTODOS DO MODAL DE ALUGUEL ==========

  abrirModalAluguel(stand: Stand) {
    this.standSelecionadoAluguel = { ...stand };
    this.inicializarFormAluguel();
    this.abrirModalAluguelStand = true;
  }

  abrirModalAluguelGeral() {
    this.standSelecionadoAluguel = null;
    this.inicializarFormAluguel();
    this.abrirModalAluguelStand = true;
  }

  inicializarFormAluguel() {
    const hoje = new Date();
    this.dataInicioDisplay = this.formatarDataParaDisplay(hoje);

    this.aluguelFormData = {
      idStands: this.standSelecionadoAluguel?.idStands?.toString() || '',
      idCustomers: '',
      idRentalPlans: '',
      startPeriodStandRentals: this.formatarDataParaBackend(hoje),
      endPeriodStandRentals: '',
      totalPriceStandRentals: 0
    };

    this.horarioInicio = '';
    this.horarioFim = '';
    this.dataTermino = '';
  }

  fecharModalAluguel() {
    this.abrirModalAluguelStand = false;
    this.standSelecionadoAluguel = null;
    this.aluguelFormData = {
      idStands: '',
      idCustomers: '',
      idRentalPlans: '',
      startPeriodStandRentals: '',
      endPeriodStandRentals: '',
      totalPriceStandRentals: 0
    };
    this.horarioInicio = '';
    this.horarioFim = '';
    this.dataTermino = '';
    this.dataInicioDisplay = '';
    this.salvandoAluguel = false;
  }

  onPlanoChange() {
    this.calcularDatasETotal();
  }

  onDataInicioChange(event: any) {
    const dataSelecionada = event.target.value;

    if (this.validarData(dataSelecionada)) {
      this.dataInicioDisplay = dataSelecionada;
      const dataObj = this.parseDataDisplay(dataSelecionada);
      this.aluguelFormData.startPeriodStandRentals = this.formatarDataParaBackend(dataObj);
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

    if (idRentalPlans && this.aluguelFormData.startPeriodStandRentals) {
      const planoSelecionado = this.planosAluguel.find(p => p.idRentalPlans == idRentalPlans);

      if (planoSelecionado) {
        this.horarioInicio = planoSelecionado.rentalShift.startTimeRentalShifts;
        this.horarioFim = planoSelecionado.rentalShift.endTimeRentalShifts;

        const dataInicio = new Date(this.aluguelFormData.startPeriodStandRentals);
        const duracaoDias = planoSelecionado.rentalCategory.baseDurationInDaysRentalCategories - 1;
        const dataTermino = new Date(dataInicio);
        dataTermino.setDate(dataTermino.getDate() + duracaoDias);

        this.dataTermino = this.formatarDataParaDisplay(dataTermino);

        this.aluguelFormData.startPeriodStandRentals = `${this.aluguelFormData.startPeriodStandRentals.split('T')[0]}T${this.horarioInicio}`;
        this.aluguelFormData.endPeriodStandRentals = `${dataTermino.toISOString().split('T')[0]}T${this.horarioFim}`;

        this.aluguelFormData.totalPriceStandRentals = planoSelecionado.priceRentalPlans;
      }
    } else {
      this.horarioInicio = '';
      this.horarioFim = '';
      this.dataTermino = '';
      this.aluguelFormData.totalPriceStandRentals = 0;
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

  async salvarAluguel() {
    if (this.salvandoAluguel) return;

    this.salvandoAluguel = true;

    try {
      const idStands = this.standSelecionadoAluguel ?
        this.standSelecionadoAluguel.idStands :
        Number(this.aluguelFormData.idStands);

      const idCustomers = Number(this.aluguelFormData.idCustomers);
      const idRentalPlans = Number(this.aluguelFormData.idRentalPlans);

      const standSelecionado = this.stands.find(s => s.idStands === idStands);
      const clienteSelecionado = this.clientes.find(c => c.idCustomers === idCustomers);
      const planoSelecionado = this.planosAluguel.find(p => p.idRentalPlans === idRentalPlans);

      if (!standSelecionado) {
        throw new Error('Stand não encontrado');
      }
      if (!clienteSelecionado) {
        throw new Error('Cliente não encontrado');
      }
      if (!planoSelecionado) {
        throw new Error('Plano de aluguel não encontrado');
      }

      const dadosAluguel = {
        stand: standSelecionado,
        customer: clienteSelecionado,
        rentalPlan: planoSelecionado,
        startPeriodStandRentals: this.aluguelFormData.startPeriodStandRentals,
        endPeriodStandRentals: this.aluguelFormData.endPeriodStandRentals,
        totalPriceStandRentals: this.aluguelFormData.totalPriceStandRentals
      };

      console.log('Enviando dados para o backend:', dadosAluguel);

      const response = await this.http.post('http://localhost:8080/api/stand-rentals', dadosAluguel).toPromise();

      const message = (response as any)?.message || 'Aluguel realizado com sucesso!';
      this.showNotification('success', message);

      this.fecharModalAluguel();
      await this.buscarStands();

    } catch (error: any) {
      console.error('Erro ao realizar aluguel:', error);
      const errorMessage = error.error?.message || error.message || 'Erro ao realizar aluguel';
      this.showNotification('error', errorMessage);
    } finally {
      this.salvandoAluguel = false;
    }
  }

  // ========== MÉTODOS AUXILIARES ==========

  abrirModalCliente() {
    this.showNotification('info', 'Funcionalidade de cadastro de cliente será implementada em breve');
  }

  async confirmarExclusao(stand: Stand) {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: `Deseja excluir o stand "${stand.numberStands} - ${stand.nameStands || 'Stand sem nome'}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      await this.excluirStand(stand);
    }
  }

  async excluirStand(stand: Stand) {
    try {
      const alugueisResponse = await this.http.get<ApiResponse>(`http://localhost:8080/api/stand-rentals?standId=${stand.idStands}`).toPromise();

      if (alugueisResponse && alugueisResponse.data && alugueisResponse.data.length > 0) {
        this.showNotification('error', 'Este stand possui aluguéis vinculados e não pode ser removido. Exclua os aluguéis primeiro.');
        return;
      }

      const response = await this.http.delete(`http://localhost:8080/api/stands/${stand.idStands}`).toPromise();
      const message = (response as any)?.message || 'Stand excluído com sucesso!';
      this.showNotification('success', message);
      this.buscarStands();

    } catch (error: any) {
      console.error('Erro ao excluir stand:', error);
      const errorMessage = error.error?.message || error.message || 'Erro ao excluir stand';
      this.showNotification('error', errorMessage);
    }
  }

  // ========== MÉTODOS DO CALENDÁRIO ==========

  abrirModalCalendarioStand(stand: Stand) {
    this.standSelecionadoCalendario = stand;
    this.standCalendarioAtual = stand;
    this.abrirModalCalendario = true;
    this.carregarAlugueisStand(stand.idStands);
    this.mesAtualCalendario = new Date();
  }

  fecharModalCalendario() {
    this.abrirModalCalendario = false;
    this.standSelecionadoCalendario = null;
    this.standCalendarioAtual = null;
    this.alugueisStand = [];
    this.mesAtualCalendario = new Date();
  }

  async carregarAlugueisStand(idStands: number) {
    this.loadingCalendario = true;
    try {
      const response = await this.http.get<ApiResponse>(`http://localhost:8080/api/stand-rentals?standId=${idStands}`).toPromise();
      if (response) {
        this.alugueisStand = response.data || [];
      }
    } catch (error: any) {
      console.error('Erro ao buscar aluguéis do stand:', error);
      this.showNotification('error', 'Erro ao carregar calendário: ' + (error.error?.message || error.message));
    } finally {
      this.loadingCalendario = false;
    }
  }

  mudarStandCalendario(event: any) {
    const idStand = Number(event.target.value);
    const stand = this.stands.find(s => s.idStands === idStand);
    if (stand) {
      this.standCalendarioAtual = stand;
      this.carregarAlugueisStand(stand.idStands);
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

    return this.alugueisStand.some(aluguel => {
      const inicio = new Date(aluguel.startPeriodStandRentals);
      const fim = new Date(aluguel.endPeriodStandRentals);

      return data >= new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate()) &&
        data <= new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
    });
  }

  getTurnosOcupados(data: Date): string[] {
    if (!data) return [];

    const turnosOcupados: string[] = [];

    this.alugueisStand.forEach(aluguel => {
      const inicio = new Date(aluguel.startPeriodStandRentals);
      const fim = new Date(aluguel.endPeriodStandRentals);

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