import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Mesa {
  idDesks: number;
  numberDesks: number;
  nameDesks: string;
}

@Component({
  selector: 'app-mesa-cadastro-modal',
  templateUrl: './mesa-cadastro-modal.component.html',
  styleUrls: ['./mesa-cadastro-modal.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class MesaCadastroModalComponent {
  @Input() abrir: boolean = false;
  @Input() mesaEditando: Mesa | null = null;
  @Input() mesaFormData: any = {};
  @Input() salvando: boolean = false;

  @Output() fechar = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<void>();

  onFechar() {
    this.fechar.emit();
  }

  onSalvar() {
    this.salvar.emit();
  }
}