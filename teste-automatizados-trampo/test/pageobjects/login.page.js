import { $ } from '@wdio/globals'
import Page from './page.js';

/**
 * sub page containing specific selectors and methods for a specific page
 */
class LoginPage extends Page {
    /**
     * define selectors using getter methods
     */
    get heading () {
        return $('h1=Entrar')
    }

    get emailInput () {
        return $('input[placeholder="Email"]')
    }

    get passwordInput () {
        return $('input[placeholder="Senha"]')
    }

    get emailError () {
        return $('.ft-email-error')
    }

    get passwordError () {
        return $('.ft-password-error')
    }
    get submitButton () {
        return $('button[type="submit"]')
    }

    async login (email, password) {
        await this.emailInput.setValue(email)
        await this.passwordInput.setValue(password)
        await this.submit()
    }

    async submit () {
        await this.submitButton.click()
    }

    open () {
        return super.open('/login')
    }
}

export default new LoginPage();
