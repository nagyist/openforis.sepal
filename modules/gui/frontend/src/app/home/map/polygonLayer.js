import {fromGoogleBounds, polygonOptions} from './map'
import {of} from 'rxjs'

export const setPolygonLayer = ({
    mapContext,
    layerSpec: {id, path},
    _fill,
    destroy$,
    onInitialized
}) => {
    const layer = path ? new PolygonLayer(mapContext, path) : null
    mapContext.sepalMap.setLayer({id, layer, destroy$, onInitialized})
    return layer
}

class PolygonLayer {
    constructor({mapContext: {google, googleMaps}, path, fill}) {
        this.googleMap = googleMaps
        this.type = 'PolygonLayer'
        this.polygonPath = path
        this.fill = fill
        this.layer = new google.maps.Polygon({
            paths: path.map(([lng, lat]) =>
                new google.maps.LatLng(lat, lng)), ...polygonOptions(fill)
        })
        const googleBounds = new google.maps.LatLngBounds()
        this.layer.getPaths().getArray().forEach(path =>
            path.getArray().forEach(latLng =>
                googleBounds.extend(latLng)
            ))
        this.bounds = fromGoogleBounds(googleBounds)
    }

    equals(o) {
        return o === this || (
            o instanceof PolygonLayer &&
            o.polygonPath.toString() === this.polygonPath.toString() &&
            o.fill === this.fill
        )
    }

    addToMap() {
        this.layer.setMap(this.googleMap)
    }

    removeFromMap() {
        this.layer.setMap(null)
    }

    initialize$() {
        return of(this)
    }
}
