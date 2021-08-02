import {catchError, tap} from 'rxjs/operators'
import {of, throwError} from 'rxjs'
import TileLayer from '../tileLayer'
import _ from 'lodash'

export default class EarthEngineLayer extends TileLayer {
    constructor({
        map,
        progress$,
        layerIndex,
        mapId$,
        watchedProps,
        onInitialize,
        onInitialized,
        onError
    }) {
        super({map, progress$, layerIndex})
        this.mapId$ = mapId$
        this.watchedProps = watchedProps
        this.onInitialize = onInitialize
        this.onInitialized = onInitialized
        this.onError = onError
        this.token = null
        this.mapId = null
        this.urlTemplate = null
    }

    equals(o) {
        return _.isEqual(o && o.watchedProps, this.watchedProps)
    }

    createTileProvider() {
        throw new Error('Subclass should implement createTileProvider')
    }

    initialize$() {
        this.onInitialize && this.onInitialize()
        return this.token
            ? of(true)
            : this.mapId$.pipe(
                tap(({token, mapId, urlTemplate}) => {
                    this.token = token
                    this.mapId = mapId
                    this.urlTemplate = urlTemplate
                    this.onInitialized && this.onInitialized()
                }),
                // mapTo(this),
                catchError(error => {
                    this.onError && this.onError(error)
                    return throwError(error)
                })
            )
    }
}
