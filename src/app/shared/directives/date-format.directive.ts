import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appDateFormat]',
  standalone: true
})
export class DateFormatDirective {

  constructor(private el: ElementRef, private control: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: any) {
    let value = event.target.value.replace(/\D/g, ''); // Remove não dígitos
    
    // Aplica a formatação
    if (value.length > 4) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4) + '/' + value.substring(4, 8);
    } else if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    // Atualiza o valor no input
    event.target.value = value;
    
    // Atualiza o ngModel
    if (this.control.control) {
      this.control.control.setValue(value);
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: any) {
    this.validateAndFormat(event.target.value);
  }

  @HostListener('focus', ['$event'])
  onFocus(event: any) {
    // Opcional: selecionar todo o texto ao focar
    event.target.select();
  }

  private validateAndFormat(value: string) {
    if (!value) return;

    const parts = value.split('/');
    if (parts.length !== 3) return;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Validação básica
    if (day > 0 && day <= 31 && month > 0 && month <= 12 && year >= 1900 && year <= 2100) {
      // Formata com zeros à esquerda
      const formattedDay = day.toString().padStart(2, '0');
      const formattedMonth = month.toString().padStart(2, '0');
      const formattedValue = `${formattedDay}/${formattedMonth}/${year}`;
      
      this.el.nativeElement.value = formattedValue;
      if (this.control.control) {
        this.control.control.setValue(formattedValue);
      }
    }
  }
}