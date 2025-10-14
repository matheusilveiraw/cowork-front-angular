import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, FormsModule],
})
export class MesasComponent implements OnInit {
  mesas: Mesa[] = [];
  loading: boolean = false;
  salvando: boolean = false;

  abrirModalCadastroMesa: boolean = false;
  abrirModalAluguelMesa: boolean = false;
  mesaEditando: Mesa | null = null;
  mesaSelecionadaAluguel: Mesa | null = null;

  mesaFormData: any = {
    numberDesks: null,
    nameDesks: ''
  };

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

  // Métodos de Status (fixo - todas disponíveis)
  estaDisponivel(mesa: Mesa): boolean {
    return true; // Todas as mesas estão disponíveis
  }

  getStatusClass(mesa: Mesa): string {
    return 'status-disponivel'; // Sempre retorna classe de disponível
  }

  getStatusText(mesa: Mesa): string {
    return 'Disponível'; // Sempre retorna texto "Disponível"
  }

  getProximaDisponibilidade(mesa: Mesa): string {
    return 'Agora'; // Sempre disponível
  }

  getMesasDisponiveis(): number {
    return this.mesas.length; // Todas estão disponíveis
  }

  getMesasOcupadas(): number {
    return 0; // Nenhuma ocupada
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

  // NOVOS MÉTODOS PARA O MODAL

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
}