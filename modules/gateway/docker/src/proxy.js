const {authMiddleware} = require('./auth')
const {createProxyMiddleware} = require('http-proxy-middleware')
const {rewriteLocation} = require('./rewrite')
const {endpoints} = require('./endpoints')
const {categories: {proxy: sepalLogLevel}} = require('./log.json')
const log = require('sepal/log').getLogger('proxy')

const proxyEndpoints = app => endpoints.map(proxy(app))

const logProvider = () => ({
    log: log.debug,
    debug: log.trace,
    info: log.info,
    warn: log.warn,
    error: log.error
})

const logLevel = sepalLogLevel === 'trace'
    ? 'debug'
    : sepalLogLevel

const proxy = app =>
    ({path, target, prefix, authenticate, cache, noCache, rewrite}) => {
        const proxyMiddleware = createProxyMiddleware(path, {
            target,
            logProvider,
            logLevel,
            proxyTimeout: 0,
            timeout: 0,
            pathRewrite: {[`^${path}`]: ''},
            ignorePath: !prefix,
            changeOrigin: true,
            onOpen: () => {
                log.trace('WebSocket opened')
            },
            onClose: () => {
                log.trace('WebSocket closed')
            },
            onProxyReqWs: (proxyReq, req) => {
                const user = req.session && req.session.user
                const username = user ? user.username : 'not-authenticated'
                log.debug(`[${username}] Requesting WebSocket upgrade for "${req.originalUrl}" to target "${target}"`)
            },
            onProxyReq: (proxyReq, req) => {
                const user = req.session && req.session.user
                const username = user ? user.username : 'not-authenticated'
                req.socket.on('close', () => {
                    log.trace(`[${username}] [${req.originalUrl}] Response closed`)
                    proxyReq.destroy()
                })
                if (authenticate && user) {
                    log.trace(`[${username}] [${req.originalUrl}] Setting sepal-user header`)
                    proxyReq.setHeader('sepal-user', JSON.stringify(user))
                }
                if (cache) {
                    log.trace(`[${username}] [${req.originalUrl}] Enabling caching`)
                    proxyReq.setHeader('Cache-Control', 'public, max-age=31536000')
                }
                if (noCache) {
                    log.trace(`[${username}] [${req.originalUrl}] Disabling caching`)
                    proxyReq.removeHeader('If-None-Match')
                    proxyReq.removeHeader('If-Modified-Since')
                    proxyReq.removeHeader('Cache-Control')
                    proxyReq.setHeader('Cache-Control', 'no-cache')
                    proxyReq.setHeader('Cache-Control', 'max-age=0')
                }
            },
            onProxyRes: proxyRes => {
                if (rewrite) {
                    const location = proxyRes.headers['location']
                    if (location) {
                        const rewritten = rewriteLocation({path, target, location})
                        log.debug(`Rewriting location header from "${location}" to "${rewritten}"`)
                        proxyRes.headers['location'] = rewritten
                    }
                }
            }
        })

        app.use(path, ...(authenticate
            ? [authMiddleware, proxyMiddleware]
            : [proxyMiddleware])
        )
        return {path, proxy: proxyMiddleware}
    }

module.exports = {proxyEndpoints}
