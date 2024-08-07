import {ReplaySubject, takeUntil} from 'rxjs'

import {getLogger} from '~/log'
import {msg} from '~/translate'
import {Notifications} from '~/widget/notifications'

const log = getLogger('layer')

export class Layer {
    cancel$ = new ReplaySubject(1)

    addToMap$ = () => {
        throw new Error('Layer.addToMap$ needs to be implemented by subclass')
    }

    removeFromMap = () => {
        throw new Error('Layer.removeFromMap needs to be implemented by subclass')
    }

    setVisibility = () => undefined
    
    add = () => {
        log.debug('Add layer')
        this.addToMap$().pipe(
            takeUntil(this.cancel$)
        ).subscribe({
            next: () => {
                log.debug('Layer added')
            },
            error: error => {
                log.warn('Cannot add layer', error)
                const errorMessage = error?.response?.messageKey
                    ? msg(error.response.messageKey, error.response.messageArgs, error.response.defaultMessage)
                    : error
                Notifications.error({
                    message: msg('map.layer.error'),
                    error: errorMessage,
                    group: true,
                    timeout: 0
                })
            }
        })
    }

    remove = () => {
        log.debug('Remove layer')
        this.cancel$.next()
        this.removeFromMap()
    }
}
