import api from '~/apiRegistry'

import {TileProvider} from './tileProvider'

export class GoogleSatelliteTileProvider extends TileProvider {
    getType() {
        return 'Google Satellite'
    }

    getConcurrency() {
        return 10
    }

    loadTile$({x, y, zoom}) {
        return api.google.loadTile$({x, y, zoom})
    }
}
