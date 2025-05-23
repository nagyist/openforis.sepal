const {Subject, finalize, startWith, takeUntil} = require('rxjs')
const _ = require('lodash')
const {createAssetManager} = require('./assetManager')
const {userTag, subscriptionTag} = require('./tag')
const log = require('#sepal/log').getLogger('ws')

const ws$ = in$ => {
    log.info('Connected')

    const out$ = new Subject()
    const stop$ = new Subject()

    const assetManager = createAssetManager({out$, stop$})

    const onUserUp = ({user}) => {
        log.debug(`${userTag(user.username)} up`)
        assetManager.userUp(user)
    }

    const onUserDown = ({user}) => {
        log.debug(`${userTag(user.username)} down`)
        assetManager.userDown(user)
    }

    const onGoogleAccessTokenAdded = ({user}) => {
        log.debug(`${userTag(user.username)} Google access token added`)
        assetManager.googleAccessToken({user, added: true})
    }

    const onGoogleAccessTokenUpdated = ({user}) => {
        log.debug(`${userTag(user.username)} Google access token updated`)
        assetManager.googleAccessToken({user, updated: true})
    }

    const onGoogleAccessTokenRemoved = ({user}) => {
        log.debug(`${userTag(user.username)} Google access token removed`)
        assetManager.googleAccessToken({user, removed: true})
    }

    const onSubscriptionUp = ({username, clientId, subscriptionId}) => {
        log.debug(`${subscriptionTag({username, clientId, subscriptionId})} up`)
        assetManager.subscriptionUp({username, clientId, subscriptionId})
    }

    const onSubscriptionDown = ({username, clientId, subscriptionId}) => {
        log.debug(`${subscriptionTag({username, clientId, subscriptionId})} down`)
        assetManager.subscriptionDown({username, clientId, subscriptionId})
    }

    const onReload = ({username, clientId, subscriptionId}) => {
        log.debug(`${subscriptionTag({username, clientId, subscriptionId})} reload`)
        assetManager.reload({username, clientId, subscriptionId})
    }

    const onCancelReload = ({username, clientId, subscriptionId}) => {
        log.debug(`${subscriptionTag({username, clientId, subscriptionId})} cancel reload`)
        assetManager.cancelReload({username, clientId, subscriptionId})
    }

    const onRemove = ({username, clientId, subscriptionId, paths}) => {
        log.debug(`${subscriptionTag({username, clientId, subscriptionId})} remove ${paths}`)
        assetManager.remove({username, clientId, subscriptionId, paths})
    }

    const onCreateFolder = ({username, clientId, subscriptionId, path}) => {
        log.debug(`${subscriptionTag({username, clientId, subscriptionId})} create folder ${path}`)
        assetManager.createFolder({username, clientId, subscriptionId, path})
    }

    const EVENT_HANDLERS = {
        'userUp': onUserUp,
        'userDown': onUserDown,
        'googleAccessTokenAdded': onGoogleAccessTokenAdded,
        'googleAccessTokenUpdated': onGoogleAccessTokenUpdated,
        'googleAccessTokenRemoved': onGoogleAccessTokenRemoved,
        'subscriptionUp': onSubscriptionUp,
        'subscriptionDown': onSubscriptionDown
    }

    const processMessage = message => {
        const {hb, event, username, user, data, clientId, subscriptionId} = message
        if (hb) {
            out$.next({hb})
        } else if (event) {
            const handler = EVENT_HANDLERS[event]
            if (handler) {
                handler({username, user, clientId, subscriptionId})
            }
        } else if (data) {
            const {reload, cancelReload, remove, createFolder} = data
            if (reload) {
                onReload({username, clientId, subscriptionId})
            } else if (cancelReload) {
                onCancelReload({username, clientId, subscriptionId})
            } else if (remove) {
                onRemove({username, clientId, subscriptionId, paths: remove})
            } else if (createFolder) {
                onCreateFolder({username, clientId, subscriptionId, path: createFolder})
            } else {
                log.warn('Unsupported message data:', data)
            }
        } else {
            log.warn('Unsupported message:', message)
        }
    }
    
    in$.pipe(
        takeUntil(stop$)
    ).subscribe({
        next: msg => processMessage(msg),
        error: error => log.error('Connection error (unexpected)', error),
        complete: () => log.info('Disconnected')
    })

    return out$.pipe(
        startWith({ready: true}),
        finalize(() => stop$.next())
    )
}

module.exports = ctx => ws$(ctx.arg$)
