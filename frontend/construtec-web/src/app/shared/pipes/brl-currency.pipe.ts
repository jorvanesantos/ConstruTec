import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'brl',
  standalone: true
})
export class BrlCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    const num = Number(value ?? 0);
    if (!Number.isFinite(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}
