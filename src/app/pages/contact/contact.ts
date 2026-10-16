import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Reveal } from '../../motion/reveal';
import { Icon } from '../../shared/icon';

type Field = 'name' | 'email' | 'message';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, Icon, Reveal],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly topics = ['Setting up a monitor', 'Understanding my readings', 'Feedback', 'Something else'];
  protected readonly sent = signal(false);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    topic: [this.topics[0]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected showError(field: Field): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // TODO: send this.form.getRawValue() to a backend or email service.
    this.sent.set(true);
    this.form.reset();
  }
}
