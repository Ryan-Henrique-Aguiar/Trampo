import { $, browser, expect } from '@wdio/globals'
import Page from '../pageobjects/page.js'
import HomePage from '../pageobjects/home.page.js'
import LoginPage from '../pageobjects/login.page.js'
import TicketPage from '../pageobjects/ticket.page.js'

const cliente = { email: 'trampo.e2e.client@example.com', senha: 'TrampoTest!2026' }

async function autenticarCliente () {
    await LoginPage.open()
    await LoginPage.login(cliente.email, cliente.senha)
    await expect(browser).toHaveUrl(/\/home$/)
}

async function abrirTicketComDadosBasicos () {
    await TicketPage.openHome()
    await TicketPage.openForNewTicket()
    const title = await TicketPage.fillBasic()
    await TicketPage.continueToAddress()
    return title
}

async function chegarAosDetalhes () {
    const title = await abrirTicketComDadosBasicos()
    await TicketPage.fillAddressManually()
    await TicketPage.continueToDetails()
    await expect(TicketPage.priceInput).toBeDisplayed()
    return title
}

describe('TRAMPO - solicitação de serviço', () => {
    beforeEach(async () => {
        await browser.setWindowSize(1365, 1100)
        await Page.clearSession()
        await autenticarCliente()
    })

    it('CT-FE-007 cria um ticket de serviço pela página inicial', async () => {
        const title = await chegarAosDetalhes()
        await TicketPage.fillDetails()
        await TicketPage.continueToPhotos()
        await expect(TicketPage.submitButton).toBeEnabled()
        await TicketPage.submit()

        await expect($('body')).toHaveText(/Serviço criado com sucesso/)
        await expect(TicketPage.modal).not.toBeDisplayed()
        await expect(HomePage.publishedServicesHeading).toBeDisplayed()
        expect(await HomePage.countServicesWithTitle(title)).toBe(1)
    })

    it('CT-FE-008 valida os campos básicos do ticket', async () => {
        await TicketPage.openHome()
        await TicketPage.openForNewTicket()
        await TicketPage.waitForCategories()
        await TicketPage.continueToAddress()

        await expect(TicketPage.titleInput).toBeDisplayed()
        const errors = await TicketPage.errorTexts()
        expect(errors).toContain('Título é obrigatório.')
        expect(errors).toContain('Descrição é obrigatória.')
        expect(errors).toContain('Selecione uma categoria.')
        await expect(TicketPage.stepLabel).toHaveText('Básico')
    })

    it('CT-FE-009 valida CEP e preenchimento do endereço do ticket', async () => {
        await abrirTicketComDadosBasicos()
        await TicketPage.waitForStates()
        await expect(TicketPage.citySelect).toBeDisabled()

        await TicketPage.zipCodeInput.setValue('123')
        await TicketPage.stateSelect.click()
        await expect(TicketPage.zipCodeError).toHaveText('CEP deve ter 8 dígitos')

        await TicketPage.fillValidCep()
        await expect(TicketPage.zipCodeInput).toHaveValue('37540-000')
        await browser.waitUntil(async () => !(await TicketPage.cepLoadingHint.isDisplayed().catch(() => false)))
        await TicketPage.fillAddressFieldsManually()
        await expect(TicketPage.streetInput).toHaveValue('Rua de Teste')
        await expect(TicketPage.neighborhoodInput).toHaveValue('Centro')
        await expect(TicketPage.numberInput).toHaveValue('123')
        await TicketPage.continueToDetails()
        await expect(TicketPage.priceInput).toBeDisplayed()
    })

    it('CT-FE-010 valida orçamento e disponibilidade do serviço', async () => {
        await chegarAosDetalhes()
        await TicketPage.continueToPhotos()
        await TicketPage.submit()
        await expect(TicketPage.modal).toBeDisplayed()
        await TicketPage.backButton.click()
        await TicketPage.priceInput.waitForDisplayed()
        await expect(TicketPage.basicErrors).toBeElementsArrayOfSize(4)

        const errors = await TicketPage.errorTexts()
        expect(errors).toContain('Orçamento máximo é obrigatório.')
        expect(errors).toContain('Selecione pelo menos uma forma de pagamento.')
        expect(errors).toContain('Selecione pelo menos um dia.')
        expect(errors).toContain('Selecione pelo menos um horário.')

        await TicketPage.fillDetails()
        await TicketPage.continueToPhotos()
        await expect($('label.select-images')).toBeDisplayed()
    })

    it('CT-FE-011 anexa imagens respeitando o limite de cinco arquivos', async () => {
        await chegarAosDetalhes()
        await TicketPage.fillDetails()
        await TicketPage.continueToPhotos()
        const fixtures = Array.from({ length: 5 }, (_, index) => `${process.cwd()}\\test\\fixtures\\imagem-${index + 1}.png`)
        const sixFixtures = [...fixtures, `${process.cwd()}\\test\\fixtures\\imagem-6.png`]

        await TicketPage.revealImageInput()
        await TicketPage.imageInput.setValue(sixFixtures.join('\n'))
        await expect($('body')).toHaveText(/Você pode selecionar no máximo 5 imagens\./)
        await expect(TicketPage.selectedImages).toBeElementsArrayOfSize(0)

        await TicketPage.imageInput.setValue(fixtures.join('\n'))
        await expect(TicketPage.selectedImages).toBeElementsArrayOfSize(5)
        await expect(TicketPage.submitButton).toBeEnabled()
    })

    it('CT-FE-012 mantém os dados preenchidos ao navegar entre as etapas', async () => {
        const title = await chegarAosDetalhes()
        await TicketPage.fillDetails()
        await TicketPage.continueToPhotos()
        await expect(TicketPage.modal).toBeDisplayed()
        await TicketPage.backButton.click()
        await TicketPage.backButton.click()
        await TicketPage.backButton.click()
        await expect(TicketPage.titleInput).toHaveValue(title)
        await expect(TicketPage.descriptionInput).toHaveValue('Descrição detalhada para validar a solicitação de serviço pelo fluxo automatizado.')
    })
})
