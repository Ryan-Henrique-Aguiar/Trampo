import { $, browser } from '@wdio/globals'
import Page from './page.js'

class RegisterPage extends Page {
    get heading () {
        return $('h1=Criar conta')
    }

    get nameInput () {
        return $('input[placeholder="Nome"]')
    }

    get emailInput () {
        return $('input[placeholder="Email"]')
    }

    get phoneInput () {
        return $('input[placeholder="Telefone"]')
    }

    get cpfInput () {
        return $('input[placeholder="CPF"]')
    }

    get passwordInput () {
        return $('input[placeholder="Senha"]')
    }

    get passwordConfirmationInput () {
        return $('input[placeholder="Confirmar senha"]')
    }

    get nextStepButton () {
        return $('button=Próxima etapa')
    }

    get stateSelect () {
        return $('select[formcontrolname="state"]')
    }

    get citySelect () {
        return $('select[formcontrolname="city"]')
    }

    get providerCheckbox () {
        return $('#provider')
    }

    get providerToggle () {
        return $('label[for="provider"]')
    }

    get categorySelect () {
        return $('ng-select[formcontrolname="categoryIds"]')
    }

    get createAccountButton () {
        return $('button=Criar conta')
    }

    get passwordMismatchError () {
        return $('small=As senhas não coincidem.')
    }

    get nameRequiredError () {
        return $('small=Informe seu nome.')
    }

    get emailInvalidError () {
        return $('small=Email inválido.')
    }

    get phoneLengthError () {
        return $('small*=O telefone deve conter 11 dígitos.')
    }

    get cpfLengthError () {
        return $('small*=O CPF deve conter 11 dígitos.')
    }

    get passwordMinimumError () {
        return $('small*=Mínimo de 6 caracteres.')
    }

    get categoryRequiredError () {
        return $('small*=Selecione pelo menos uma categoria.')
    }

    open () {
        return browser.url('/register')
    }

    async fillPersonalData (data) {
        await this.nameInput.setValue(data.name)
        await this.emailInput.setValue(data.email)
        await this.phoneInput.setValue(data.phone)
        await this.cpfInput.setValue(data.cpf)
        await this.passwordInput.setValue(data.password)
        await this.passwordConfirmationInput.setValue(data.passwordConfirmation)
    }

    async continueToProfile () {
        await this.nextStepButton.click()
    }

    async setLocation (state, city) {
        await this.stateSelect.selectByAttribute('value', state)
        await this.citySelect.waitForEnabled()
        await this.citySelect.selectByVisibleText(city)
    }

    async enableProviderProfile () {
        await this.providerToggle.click()
    }

    async chooseProviderCategory (category) {
        await this.categorySelect.click()
        await $(`div.ng-option=${category}`).click()
        await browser.keys('Escape')
    }

    async createAccount () {
        await this.createAccountButton.click()
    }
}

export default new RegisterPage()
