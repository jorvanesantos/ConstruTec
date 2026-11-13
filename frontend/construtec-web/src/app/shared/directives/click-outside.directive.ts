import { Directive, ElementRef, EventEmitter, HostListener, Output, inject } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  private readonly elementRef = inject(ElementRef);
  @Output() appClickOutside = new EventEmitter<void>();

  @HostListener('document:click', ['$event.target'])
  onClick(targetElement: EventTarget | null): void {
    if (!targetElement) return;
    const clickedInside = this.elementRef.nativeElement.contains(targetElement as Node);
    if (!clickedInside) {
      this.appClickOutside.emit();
    }
  }
}
