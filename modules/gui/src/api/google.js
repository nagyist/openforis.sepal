import {get$} from 'http-client'

const SUBDOMAIN = 'mt0'

const formatTileUrl = ({x, y, zoom}) => `https://${SUBDOMAIN}.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${zoom}`

export default {
    loadTile$: ({x, y, zoom}) =>
        get$(formatTileUrl({x, y, zoom}), {
            maxRetries: 0,
            responseType: 'blob',
            crossDomain: true
        })
}
