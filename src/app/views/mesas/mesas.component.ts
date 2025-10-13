import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Mesa {
  idDesks: number;
  numberDesks: number;
  nameDesks: string;
}

@Component({
  selector: 'app-mesas',
  templateUrl: './mesas.component.html',
  styleUrls: ['./mesas.component.scss']
})
export class MesasComponent implements OnInit {
  mesas: Mesa[] = [];
  loading: boolean = false;
  
  // Para os modais (você vai implementar depois)
  abrirModalCadastroMesa: boolean = false;
  abrirModalAluguelMesa: boolean = false;
  mesaEditando: Mesa | null = null;
  mesaSelecionadaAluguel: Mesa | null = null;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.buscarMesas();
  }

  async buscarMesas() {
    this.loading = true;
    try {
      const response: any = await this.http.get('http://localhost:8080/api/desks').toPromise();
      this.mesas = response.data || response || [];
    } catch (error: any) {
      console.error('Erro ao buscar mesas:', error);
      this.mostrarErro('Erro ao carregar mesas: ' + (error.error?.message || error.message));
    } finally {
      this.loading = false;
    }
  }

  // Métodos de Status (simulados por enquanto)
  estaDisponivel(mesa: Mesa): boolean {
    // Por enquanto, vamos simular - na implementação real, você verificaria os aluguéis
    return Math.random() > 0.3; // 70% de chance de estar disponível
  }

  getStatusClass(mesa: Mesa): string {
    return this.estaDisponivel(mesa) ? 'status-disponivel' : 'status-ocupada';
  }

  getStatusText(mesa: Mesa): string {
    return this.estaDisponivel(mesa) ? 'Disponível' : 'Ocupada';
  }

  getProximaDisponibilidade(mesa: Mesa): string {
    // Simulação - na implementação real, você buscaria do backend
    return this.estaDisponivel(mesa) ? 'Agora' : '15:00';
  }

  getMesasDisponiveis(): number {
    return this.mesas.filter(mesa => this.estaDisponivel(mesa)).length;
  }

  getMesasOcupadas(): number {
    return this.mesas.filter(mesa => !this.estaDisponivel(mesa)).length;
  }

  // Métodos dos Modais (para implementar depois)
  abrirModalCadastro() {
    this.mesaEditando = null;
    this.abrirModalCadastroMesa = true;
  }

  abrirModalEdicao(mesa: Mesa) {
    this.mesaEditando = { ...mesa };
    this.abrirModalCadastroMesa = true;
  }

  abrirModalAluguel(mesa: Mesa) {
    this.mesaSelecionadaAluguel = { ...mesa };
    this.abrirModalAluguelMesa = true;
  }

  abrirModalAluguelGeral() {
    this.mesaSelecionadaAluguel = null;
    this.abrirModalAluguelMesa = true;
  }

  verCalendarioMesa(mesa: Mesa) {
    // Aqui você vai navegar para a página de calendário da mesa
    console.log('Ver calendário da mesa:', mesa);
    // this.router.navigate(['/mesas', mesa.idDesks, 'calendario']);
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
      
      // Mostrar mensagem de sucesso
      alert('Mesa excluída com sucesso!');
      
      this.buscarMesas();
    } catch (error: any) {
      console.error('Erro ao excluir mesa:', error);
      this.mostrarErro('Erro ao excluir mesa: ' + (error.error?.message || error.message));
    }
  }

  mostrarErro(mensagem: string) {
    // Implementar notificação - você pode usar um serviço de notificação
    alert(mensagem); // Temporário
  }
}