import { $, browser, expect } from '@wdio/globals'
import HomePage from '../pageobjects/home.page.js'
import LoginPage from '../pageobjects/login.page.js'
import Page from '../pageobjects/page.js'

const clienteValido = {
    email: 'trampo.e2e.client@example.com',
    senha: 'TrampoTest!2026'
}

async function loginRequestCount () {
    return browser.execute(() => performance.getEntriesByType('resource')
        .filter(entry => new URL(entry.name).pathname.endsWith('/auth/login')).length)
}

describe('TRAMPO - autenticação', () => {
    beforeEach(async () => {
        await Page.clearSession()
    })

    it('CT-FE-001 autentica um cliente com credenciais válidas', async () => {
        await LoginPage.open()
        await expect(LoginPage.heading).toBeDisplayed()
        await expect(LoginPage.emailInput).toBeDisplayed()
        await expect(LoginPage.passwordInput).toBeDisplayed()
        await expect(LoginPage.submitButton).toHaveText('Entrar')
        await LoginPage.emailInput.setValue(clienteValido.email)
        await LoginPage.passwordInput.setValue(clienteValido.senha)
        await browser.execute(() => {
            const button = document.querySelector('button[type="submit"]')
            window.__loginLoadingSeen = false
            const observer = new MutationObserver(() => {
                if (button.disabled && button.textContent.includes('Entrando...')) {
                    window.__loginLoadingSeen = true
                }
            })
            observer.observe(button, { attributes: true, childList: true, subtree: true })
        })
        await LoginPage.submit()

        await expect($('body')).toHaveText(/Login realizado com sucesso!/)
        expect(await browser.execute(() => window.__loginLoadingSeen)).toBe(true)
        await expect(browser).toHaveUrl(/\/home$/)
        await expect(HomePage.requestServiceButton).toBeDisplayed()
        await expect(HomePage.requestServiceButton).toHaveText(/Solicitar serviço/)
        expect(await loginRequestCount()).toBe(1)
    })

    it('CT-FE-002 valida campos obrigatórios e formato do e-mail', async () => {
        await LoginPage.open()
        const requestsBefore = await loginRequestCount()
        await LoginPage.submit()

        await expect(LoginPage.emailError).toHaveText('Informe um email válido.')
        await expect(LoginPage.passwordError).toHaveText('Informe sua senha.')
        expect(await loginRequestCount()).toBe(requestsBefore)

        await LoginPage.emailInput.setValue('usuario@')
        await LoginPage.passwordInput.setValue('senha-teste')
        await LoginPage.submit()

        await expect(LoginPage.emailError).toBeDisplayed()
        await expect(browser).toHaveUrl(/\/login$/)
        expect(await loginRequestCount()).toBe(requestsBefore)
    })

    it('CT-FE-003 mantém o visitante no login quando a senha está incorreta', async () => {
        await LoginPage.open()
        const requestsBefore = await loginRequestCount()
        await LoginPage.login(clienteValido.email, 'senha-incorreta')

        await expect($('body')).toHaveText(/Email ou senha inválidos/)
        await expect(browser).toHaveUrl(/\/login$/)
        await expect(LoginPage.submitButton).toBeEnabled()
        await expect(LoginPage.submitButton).toHaveText('Entrar')
        expect(await loginRequestCount()).toBe(requestsBefore + 1)
        expect(await browser.execute(() => localStorage.getItem('token'))).toBeNull()
    })

})
