# Testes automatizados - TRAMPO

Automação E2E com WebdriverIO, Mocha, Page Objects, Chrome e Allure.

## Cenários

- CT-FE-001 a CT-FE-003: autenticação e validações de login (`login.e2e.js`).
- CT-FE-004 a CT-FE-006: cadastro de cliente e prestador (`register.e2e.js`).
- CT-FE-007 a CT-FE-012: criação e validações de tickets (`ticket.e2e.js`).

Cada tela tem seu Page Object em `test/pageobjects/`; os specs ficam separados por fluxo e seguem a ordem dos casos de teste.

## Pré-requisitos

- Node.js compatível com o WebdriverIO instalado e Google Chrome.
- Frontend disponível em `http://localhost:4200` e API/backend em `http://localhost:8080/api/v1`.
- O cenário usa uma conta cliente local definida no próprio spec, no banco de desenvolvimento isolado.

## Executar a sequência completa

```powershell
npm run wdio
```

O WebdriverIO executa no Chrome e gerencia o driver durante a execução. Para rodar somente um fluxo, passe `--spec test/specs/login.e2e.js`, `register.e2e.js` ou `ticket.e2e.js`.

## Relatório Allure

```powershell
npm run allure:generate
npm run allure:open
```

A geração/abertura do relatório Allure também requer Java.
