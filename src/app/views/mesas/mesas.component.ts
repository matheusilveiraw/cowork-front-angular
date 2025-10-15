import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateFormatDirective } from '../../shared/directives/date-format.directive';

interface Mesa {
  idDesks: number;
  numberDesks: number;
  nameDesks: string;
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
  startTimeRentalShifts: string;
  endTimeRentalShifts: string;
}

interface ApiResponse {
  data: any[];
  success: boolean;
  count: number;
  message: string;
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

  // Estados de loading
  loading: boolean = false;
  salvando: boolean = false;
  salvandoAluguel: boolean = false;

  // Estados dos modais
  abrirModalCadastroMesa: boolean = false;
  abrirModalAluguelMesa: boolean = false;
  mesaEditando: Mesa | null = null;
  mesaSelecionadaAluguel: Mesa | null = null;

  //calendario
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

  // USAR STRINGS VAZIAS EM VEZ DE NULL PARA OS SELECTS
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

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.buscarMesas();
    this.buscarClientes();
    this.buscarPlanosAluguel();
    this.buscarTurnos();
  }

  // ========== MÉTODOS PARA BUSCAR DADOS ==========

  async buscarMesas() {
    this.loading = true;
    try {
      const response = await this.http.get<ApiResponse>('http://localhost:8080/api/desks').toPromise();
      if (response) {
        this.mesas = response.data || [];
      }
    } catch (error: any) {
      console.error('Erro ao buscar mesas:', error);
      this.mostrarErro('Erro ao carregar mesas: ' + (error.error?.message || error.message));
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

  estaDisponivel(mesa: Mesa): boolean {
    return true;
  }

  getStatusClass(mesa: Mesa): string {
    return 'status-disponivel';
  }

  getStatusText(mesa: Mesa): string {
    return 'Disponível';
  }

  getProximaDisponibilidade(mesa: Mesa): string {
    return 'Agora';
  }

  getMesasDisponiveis(): number {
    return this.mesas.length;
  }

  getMesasOcupadas(): number {
    return 0;
  }

  get mesasDisponiveis(): Mesa[] {
    return this.mesas.filter(mesa => this.estaDisponivel(mesa));
  }

  // ========== MÉTODOS DO MODAL DE CADASTRO/EDIÇÃO ==========

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

  async salvarMesa() {
    if (this.salvando) return;

    this.salvando = true;

    try {
      if (this.mesaEditando) {
        await this.http.put(`http://localhost:8080/api/desks/${this.mesaEditando.idDesks}`, this.mesaFormData).toPromise();
        alert('Mesa atualizada com sucesso!');
      } else {
        await this.http.post('http://localhost:8080/api/desks', this.mesaFormData).toPromise();
        alert('Mesa cadastrada com sucesso!');
      }

      this.fecharModalCadastro();
      this.buscarMesas();

    } catch (error: any) {
      console.error('Erro ao salvar mesa:', error);
      this.mostrarErro('Erro ao salvar mesa: ' + (error.error?.message || error.message));
    } finally {
      this.salvando = false;
    }
  }

  // ========== MÉTODOS DO MODAL DE ALUGUEL ==========

  abrirModalAluguel(mesa: Mesa) {
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

    // USAR STRINGS VAZIAS PARA OS SELECTS
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
    // RESETAR PARA STRINGS VAZIAS
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
      // Se a data for inválida, manter a anterior
      event.target.value = this.dataInicioDisplay;
    }
  }

  validarData(data: string): boolean {
    // Permite campo vazio durante a digitação
    if (!data || data === '') return true;

    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(data)) return false;

    const [, dia, mes, ano] = data.match(regex) || [];
    const diaNum = parseInt(dia, 10);
    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt(ano, 10);

    // Validações básicas
    if (diaNum < 1 || diaNum > 31) return false;
    if (mesNum < 1 || mesNum > 12) return false;
    if (anoNum < 1900 || anoNum > 2100) return false;

    // Validação de fevereiro e meses com 30 dias
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
    // CONVERTER PARA NUMBER QUANDO FOR USAR
    const idRentalPlans = this.aluguelFormData.idRentalPlans ? Number(this.aluguelFormData.idRentalPlans) : null;

    if (idRentalPlans && this.aluguelFormData.startPeriodDeskRentals) {
      const planoSelecionado = this.planosAluguel.find(p => p.idRentalPlans == idRentalPlans);

      if (planoSelecionado) {
        // Definir horários baseados no turno
        this.horarioInicio = planoSelecionado.rentalShift.startTimeRentalShifts;
        this.horarioFim = planoSelecionado.rentalShift.endTimeRentalShifts;

        // Calcular data de término
        const dataInicio = new Date(this.aluguelFormData.startPeriodDeskRentals);
        const duracaoDias = planoSelecionado.rentalCategory.baseDurationInDaysRentalCategories - 1;
        const dataTermino = new Date(dataInicio);
        dataTermino.setDate(dataTermino.getDate() + duracaoDias);

        // Formatar para exibição
        this.dataTermino = this.formatarDataParaDisplay(dataTermino);

        // Montar datas completas para envio
        this.aluguelFormData.startPeriodDeskRentals = `${this.aluguelFormData.startPeriodDeskRentals.split('T')[0]}T${this.horarioInicio}`;
        this.aluguelFormData.endPeriodDeskRentals = `${dataTermino.toISOString().split('T')[0]}T${this.horarioFim}`;

        // Definir preço
        this.aluguelFormData.totalPriceDeskRentals = planoSelecionado.priceRentalPlans;
      }
    } else {
      this.horarioInicio = '';
      this.horarioFim = '';
      this.dataTermino = '';
      this.aluguelFormData.totalPriceDeskRentals = 0;
    }
  }

  formatarDataParaDisplay(data: Date): string {
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  formatarDataParaBackend(data: Date): string {
    return data.toISOString().split('T')[0]; // yyyy-MM-dd
  }

  async salvarAluguel() {
    if (this.salvandoAluguel) return;

    this.salvandoAluguel = true;

    try {
      // CONVERTER OS VALORES DE STRING PARA NUMBER ANTES DE ENVIAR
      const idDesks = this.mesaSelecionadaAluguel ?
        this.mesaSelecionadaAluguel.idDesks :
        Number(this.aluguelFormData.idDesks);

      const dadosAluguel = {
        idDesks: idDesks,
        idCustomers: Number(this.aluguelFormData.idCustomers),
        idRentalPlans: Number(this.aluguelFormData.idRentalPlans),
        startPeriodDeskRentals: this.aluguelFormData.startPeriodDeskRentals,
        endPeriodDeskRentals: this.aluguelFormData.endPeriodDeskRentals,
        totalPriceDeskRentals: this.aluguelFormData.totalPriceDeskRentals
      };

      await this.http.post('http://localhost:8080/api/desk-rentals', dadosAluguel).toPromise();

      alert('Aluguel realizado com sucesso!');
      this.fecharModalAluguel();
      this.buscarMesas();

    } catch (error: any) {
      console.error('Erro ao realizar aluguel:', error);
      this.mostrarErro('Erro ao realizar aluguel: ' + (error.error?.message || error.message));
    } finally {
      this.salvandoAluguel = false;
    }
  }

  // ========== MÉTODOS AUXILIARES ==========

  abrirModalCliente() {
    alert('Funcionalidade de cadastro de cliente será implementada em breve');
  }

  async confirmarExclusao(mesa: Mesa) {
    const confirmacao = confirm(`Tem certeza que deseja excluir a mesa "${mesa.numberDesks} - ${mesa.nameDesks || 'Mesa sem nome'}"?`);

    if (confirmacao) {
      await this.excluirMesa(mesa);
    }
  }

  async excluirMesa(mesa: Mesa) {
    try {
      await this.http.delete(`http://localhost:8080/api/desks/${mesa.idDesks}`).toPromise();
      alert('Mesa excluída com sucesso!');
      this.buscarMesas();
    } catch (error: any) {
      console.error('Erro ao excluir mesa:', error);
      this.mostrarErro('Erro ao excluir mesa: ' + (error.error?.message || error.message));
    }
  }

  mostrarErro(mensagem: string) {
    alert(mensagem);
  }

  // ========== MÉTODOS DO CALENDÁRIO CORRIGIDOS ==========

  abrirModalCalendarioMesa(mesa: Mesa) {
    this.mesaSelecionadaCalendario = mesa;
    this.mesaCalendarioAtual = mesa;
    this.abrirModalCalendario = true;
    this.carregarAlugueisMesa(mesa.idDesks);
    this.mesAtualCalendario = new Date(); // Resetar para mês atual
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
      this.mostrarErro('Erro ao carregar calendário: ' + (error.error?.message || error.message));
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

  // MÉTODO CORRIGIDO: Agora inclui dias vazios no início do mês
  getDiasDoMes(): (Date | null)[] {
    const year = this.mesAtualCalendario.getFullYear();
    const month = this.mesAtualCalendario.getMonth();
    
    const primeiroDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    
    // Dias vazios no início (para alinhar com os dias da semana)
    const diasVaziosInicio = primeiroDia.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    
    const dias: (Date | null)[] = [];
    
    // Adicionar dias vazios
    for (let i = 0; i < diasVaziosInicio; i++) {
      dias.push(null);
    }
    
    // Adicionar dias do mês
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

      // Verifica se a data está dentro do período de aluguel
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

      // Verifica se a data está dentro do período de aluguel
      if (data >= new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate()) &&
        data <= new Date(fim.getFullYear(), fim.getMonth(), fim.getDate())) {

        // Encontra o plano para obter informações do turno
        const plano = this.planosAluguel.find(p => p.idRentalPlans === aluguel.idRentalPlans);
        if (plano) {
          turnosOcupados.push(plano.rentalShift.nameRentalShifts);
        }
      }
    });

    return turnosOcupados;
  }

  getCorTurno(turno: string): string {
    const cores: { [key: string]: string } = {
      'Manhã': 'bg-warning',
      'Tarde': 'bg-info',
      'Dia Todo': 'bg-primary',
      'Noite': 'bg-dark'
    };
    return cores[turno] || 'bg-secondary';
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
    
    if (turnosOcupados.length === 0) {
      return `Dia ${dia.toLocaleDateString('pt-BR')} - Disponível`;
    } else {
      return `Dia ${dia.toLocaleDateString('pt-BR')} - Ocupado nos turnos: ${turnosOcupados.join(', ')}`;
    }
  }

  getAbreviacaoTurno(turno: string): string {
    const abreviacoes: { [key: string]: string } = {
      'Manhã': 'M',
      'Tarde': 'T',
      'Dia Todo': 'D',
      'Noite': 'N'
    };
    return abreviacoes[turno] || turno.charAt(0);
  }
}