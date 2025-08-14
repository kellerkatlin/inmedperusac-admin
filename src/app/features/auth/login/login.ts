import { AuthService } from '@/core/service/auth.service';
import { AppFloatingConfigurator } from '@/layout/component/app.floatingconfigurator';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';

@Component({
    selector: 'app-login',
    imports: [ButtonModule, CheckboxModule, ReactiveFormsModule, InputTextModule, InputNumberModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, ReactiveFormsModule],

    templateUrl: './login.html'
})
export class Login {
    private readonly _fb = inject(FormBuilder);
    private readonly _router = inject(Router);
    private readonly _authService = inject(AuthService);
    private readonly _messageService = inject(MessageService);

    loading: boolean = false;
    labelLogin: string = 'Iniciar Sesión';
    submitted: boolean = false;
    loginForm: FormGroup<{
        email: FormControl<string | null>;
        password: FormControl<string | null>;
    }> = this._fb.group({
        email: this._fb.control('arianjosafat67@gmail.com', [Validators.required, Validators.email]),
        password: this._fb.control('090901', [Validators.required])
    });

    onSubmit() {
        this.submitted = true;
        if (this.loginForm.invalid) return;

        this.loading = true;
        this.labelLogin = 'Cargando...';

        const { email, password } = this.loginForm.value;
        if (!email || !password) return;
        this._authService.login(email, password).subscribe({
            next: (res) => {
                this._messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Inicio de sesión exitoso',
                    life: 3000
                });

                this.loading = false;
                this.labelLogin = 'Iniciar Sesión';
                this.submitted = false;
                this._router.navigateByUrl('/');
            },
            error: (err) => {
                this._messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error.message,
                    life: 3000
                });
                this.loading = false;
                this.labelLogin = 'Iniciar Sesión';
                this.submitted = false;
            }
        });
    }

    usuario: string = '';
    password: string = '';
}
