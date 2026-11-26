import { browser } from '@wdio/globals'

export default class Page {
    open (path) {
        return browser.url(path)
    }

    static async clearSession () {
        await browser.url('/login')
        await browser.execute(() => localStorage.removeItem('token'))
        await browser.refresh()
    }

    static async observeHttpRequests () {
        await browser.execute(() => {
            sessionStorage.setItem('__observedHttpRequests', '[]')
            const originalOpen = XMLHttpRequest.prototype.open
            const originalSend = XMLHttpRequest.prototype.send

            const saveRequest = request => {
                const requests = JSON.parse(sessionStorage.getItem('__observedHttpRequests') ?? '[]')
                const index = requests.push(request) - 1
                sessionStorage.setItem('__observedHttpRequests', JSON.stringify(requests))
                return index
            }

            const updateRequest = (index, changes) => {
                const requests = JSON.parse(sessionStorage.getItem('__observedHttpRequests') ?? '[]')
                requests[index] = { ...requests[index], ...changes }
                sessionStorage.setItem('__observedHttpRequests', JSON.stringify(requests))
            }

            XMLHttpRequest.prototype.open = function (method, url, ...args) {
                this.__observedMethod = method
                this.__observedUrl = String(url)
                return originalOpen.call(this, method, url, ...args)
            }

            XMLHttpRequest.prototype.send = function (body) {
                const request = {
                    method: this.__observedMethod,
                    url: this.__observedUrl,
                    body: typeof body === 'string'
                        ? body
                        : body instanceof FormData
                            ? Array.from(body.entries()).map(([key, value]) => ({
                                key,
                                name: value instanceof File ? value.name : String(value),
                                type: value instanceof File ? value.type : null
                            }))
                            : null,
                    status: null,
                    response: null
                }
                const index = saveRequest(request)
                this.addEventListener('loadend', () => {
                    let response = null
                    try { response = this.response } catch {}
                    updateRequest(index, { status: this.status, response })
                }, { once: true })
                return originalSend.call(this, body)
            }

            const originalFetch = window.fetch.bind(window)
            window.fetch = async function (input, init = {}) {
                const url = typeof input === 'string' ? input : input.url
                const method = String(init.method ?? (typeof input === 'string' ? 'GET' : input.method)).toUpperCase()
                const body = typeof init.body === 'string' ? init.body : null
                const index = saveRequest({ method, url, body, status: null, response: null })

                try {
                    const response = await originalFetch(input, init)
                    let responseBody = null
                    try { responseBody = await response.clone().text() } catch {}
                    updateRequest(index, { status: response.status, response: responseBody })
                    return response
                } catch (error) {
                    updateRequest(index, { status: 0, response: String(error) })
                    throw error
                }
            }
        })
    }

    static async observedHttpRequests () {
        return browser.execute(() => JSON.parse(sessionStorage.getItem('__observedHttpRequests') ?? '[]'))
    }
}
