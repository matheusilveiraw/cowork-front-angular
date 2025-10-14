import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; 


interface Mesa {
  idDesks: number;
  numberDesks: number;
  nameDesks: string;
}

interface ApiResponse {
  data: Mesa[];
  success: boolean;
  count: number;
  message: string;
}

@Component({
  selector: 'app-mesas',
  templateUrl: './mesas.component.html',
  styleUrls: ['./mesas.component.scss'],
  imports: [CommonModule], 
})
export class MesasComponent implements OnInit {
  mesas: Mesa[] = [];
  loading: boolean = false;

  // Para os modais
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
      const response = await this.http.get<ApiResponse>('http://localhost:8080/api/desks').toPromise();

      if (response) {
        this.mesas = response.data || [];
        console.log('Mesas carregadas:', this.mesas);
      } else {
        throw new Error('Resposta vazia do servidor');
      }
    } catch (error: any) {
      console.error('Erro ao buscar mesas:', error);
      this.mostrarErro('Erro ao carregar mesas: ' + (error.error?.message || error.message));
    } finally {
      this.loading = false;
    }
  }

  // Métodos de Status (mantenha por enquanto)
  estaDisponivel(mesa: Mesa): boolean {
    return Math.random() > 0.3; // Simulação
  }

  getStatusClass(mesa: Mesa): string {
    return this.estaDisponivel(mesa) ? 'status-disponivel' : 'status-ocupada';
  }

  getStatusText(mesa: Mesa): string {
    return this.estaDisponivel(mesa) ? 'Disponível' : 'Ocupada';
  }

  getProximaDisponibilidade(mesa: Mesa): string {
    return this.estaDisponivel(mesa) ? 'Agora' : '15:00';
  }

  getMesasDisponiveis(): number {
    return this.mesas.filter(mesa => this.estaDisponivel(mesa)).length;
  }

  getMesasOcupadas(): number {
    return this.mesas.filter(mesa => !this.estaDisponivel(mesa)).length;
  }

  // Métodos dos Modais
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
    console.log('Ver calendário da mesa:', mesa);
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
}