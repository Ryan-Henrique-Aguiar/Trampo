import { $, browser, expect } from '@wdio/globals'
import allureReporter from '@wdio/allure-reporter'
import Page from '../pageobjects/page.js'
import LoginPage from '../pageobjects/login.page.js'
import TicketPage from '../pageobjects/ticket.page.js'

const cliente = { email: 'trampo.e2e.client@example.com', senha: 'TrampoTest!2026' }

async function autenticarCliente () {
    await LoginPage.open()
    await LoginPage.login(cliente.email, cliente.senha)
    await expect(browser).toHaveUrl(/\/home$/)
}

describe('TRAMPO - solicitação de serviço urgente', () => {
    beforeEach(async () => {
        await browser.setWindowSize(1365, 1100)
        await Page.clearSession()
        await autenticarCliente()
    })

    it('CT-FE-013 cria um ticket urgente e aciona prestador disponível', async () => {
        await TicketPage.openHome()
        await $('button.action-card:nth-child(2)').click()
        await expect($('h2=Serviço urgente')).toBeDisplayed()

        await TicketPage.fillBasic(`Urgente automatizado ${Date.now()}`)
        await TicketPage.continueToAddress()

        // Usa o mesmo preenchimento já testado (MG / Abadia dos Dourados)
        await TicketPage.fillAddressFieldsManually()
        await TicketPage.nextButton.click() // "Buscar prestadores"

        await expect(TicketPage.stepLabel).toHaveText('Prestadores', { timeout: 15000 })

        const mainWindow = await browser.getWindowHandle()
        const whatsappBtn = $('button.btn-whatsapp')
        await whatsappBtn.waitForDisplayed({ timeout: 15000 })
        await whatsappBtn.click()

        const handles = await browser.getWindowHandles()
        if (handles.length > 1) {
            await browser.switchToWindow(mainWindow)
        }

        await expect($('body')).toHaveText(/Solicitação criada/, { timeout: 15000 })
        await expect(TicketPage.modal).not.toBeDisplayed({ timeout: 15000 })
    })
})