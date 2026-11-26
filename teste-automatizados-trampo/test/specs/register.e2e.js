import { $, browser, expect } from '@wdio/globals'
import Page from '../pageobjects/page.js'
import RegisterPage from '../pageobjects/register.page.js'

function createRegistrationData(name) {
    const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`
    const baseCpf = String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0')
    const calculateDigit = (value, length) => {
        const sum = value.slice(0, length)
            .split('')
            .reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0)
        const result = 11 - (sum % 11)
        return result >= 10 ? 0 : result
    }
    const firstDigit = calculateDigit(baseCpf, 9)
    const cpf = `${baseCpf}${firstDigit}${calculateDigit(`${baseCpf}${firstDigit}`, 10)}`

    return {
        name,
        email: `trampo.e2e.${unique}@example.com`,
        phone: `119${unique.slice(-8)}`,
        cpf: `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`,
        password: 'TrampoTeste2026',
        passwordConfirmation: 'TrampoTeste2026'
    }
}

async function registrationRequests () {
    return (await Page.observedHttpRequests()).filter(request =>
        request.method === 'POST' && request.url.includes('/auth/register'))
}

describe('TRAMPO - cadastro', () => {
    beforeEach(async () => {
        await Page.clearSession()
    })

    it('CT-FE-004 cadastra uma conta de cliente com dados válidos', async () => {
        const cliente = createRegistrationData('Cliente de teste TRAMPO')

        await RegisterPage.open()
        await Page.observeHttpRequests()
        await expect(RegisterPage.heading).toBeDisplayed()
        await RegisterPage.fillPersonalData(cliente)
        await expect(RegisterPage.phoneInput).toHaveValue(/\(\d{2}\) 9\d{4}-\d{4}/)
        await expect(RegisterPage.cpfInput).toHaveValue(/\d{3}\.\d{3}\.\d{3}-\d{2}/)
        await RegisterPage.continueToProfile()
        await RegisterPage.setLocation('MG', 'SANTA RITA DO SAPUCAÍ')
        await RegisterPage.createAccount()

        await expect($('body')).toHaveText(/Usuário criado com sucesso!/)
        await expect(browser).toHaveUrl(/\/login$/)
        const requests = await registrationRequests()
        expect(requests).toHaveLength(1)
        const payload = JSON.parse(requests[0].body)
        expect(payload.provider).toBe(false)
        expect(payload.categoryIds).toEqual([])
    })

    it('CT-FE-005 impede avançar o cadastro com dados inválidos', async () => {
        const dadosInvalidos = createRegistrationData('Cadastro inválido TRAMPO')

        await RegisterPage.open()
        await Page.observeHttpRequests()
        await RegisterPage.continueToProfile()
        await expect(RegisterPage.heading).toBeDisplayed()
        await expect(RegisterPage.nameRequiredError).toBeDisplayed()

        await RegisterPage.nameInput.setValue('Cadastro inválido TRAMPO')
        await RegisterPage.emailInput.setValue('usuario@')
        await RegisterPage.phoneInput.setValue('119')
        await RegisterPage.cpfInput.setValue('1234')
        await RegisterPage.passwordInput.setValue('12345')
        await RegisterPage.passwordConfirmationInput.setValue('12345')
        await RegisterPage.continueToProfile()

        await expect(RegisterPage.emailInvalidError).toHaveText('Email inválido.')
        await expect(RegisterPage.phoneLengthError).toHaveText('O telefone deve conter 11 dígitos.')
        await expect(RegisterPage.cpfLengthError).toHaveText('O CPF deve conter 11 dígitos.')
        await expect(RegisterPage.passwordMinimumError).toHaveText('Mínimo de 6 caracteres.')
        await expect(RegisterPage.heading).toBeDisplayed()

        await RegisterPage.fillPersonalData({
            ...dadosInvalidos,
            password: 'SenhaValida2026',
            passwordConfirmation: 'SenhaDiferente2026'
        })
        await RegisterPage.continueToProfile()

        await expect(RegisterPage.passwordMismatchError).toHaveText('As senhas não coincidem.')
        await expect(RegisterPage.heading).toBeDisplayed()
        await expect(browser).toHaveUrl(/\/register$/)
        expect(await registrationRequests()).toHaveLength(0)
    })

    it('CT-FE-006 exige uma categoria para concluir cadastro como prestador', async () => {
        const prestador = createRegistrationData('Prestador de teste TRAMPO')

        await RegisterPage.open()
        await Page.observeHttpRequests()
        await RegisterPage.fillPersonalData(prestador)
        await RegisterPage.continueToProfile()
        await RegisterPage.setLocation('MG', 'SANTA RITA DO SAPUCAÍ')
        await RegisterPage.enableProviderProfile()

        await RegisterPage.createAccount()
        await expect(RegisterPage.categoryRequiredError).toHaveText('Selecione pelo menos uma categoria.')
        await expect(browser).toHaveUrl(/\/register$/)
        expect(await registrationRequests()).toHaveLength(0)

        await RegisterPage.chooseProviderCategory('Alvenaria')
        await RegisterPage.createAccount()

        await expect($('body')).toHaveText(/Usuário criado com sucesso!/)
        await expect(browser).toHaveUrl(/\/login$/)
        const requests = await registrationRequests()
        expect(requests).toHaveLength(1)
        const payload = JSON.parse(requests[0].body)
        expect(payload.provider).toBe(true)
        expect(payload.categoryIds.length).toBeGreaterThan(0)
    })
})
