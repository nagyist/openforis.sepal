import {of, tap} from 'rxjs'

import {MAX_ZOOM} from '../maps'
import {Layer} from './layer'

export class GoogleLabelsLayer extends Layer {
    constructor({
        map,
        layerIndex = 0
    }) {
        super()
        this.map = map
        this.layerIndex = layerIndex
    }

    createOverlay = () => {
        const {map} = this
        const {google} = map.getGoogle()
        const styledMapType = new google.maps.StyledMapType(labelsLayerStyle, {name: 'labels'})
        styledMapType.maxZoom = MAX_ZOOM
        return styledMapType
    }

    addToMap = () => {
        this.overlay = this.createOverlay()
        const {map, layerIndex, overlay} = this
        const {googleMap} = map.getGoogle()
        if (overlay) {
            googleMap.overlayMapTypes.setAt(layerIndex, overlay)
        }
    }

    addToMap$ = () =>
        of(true).pipe(
            tap(() => this.addToMap())
        )

    removeFromMap = () => {
        const {map, layerIndex, overlay} = this
        const {googleMap} = map.getGoogle()
        if (overlay) {
            // googleMap.overlayMapTypes.removeAt(layerIndex)
            // [HACK] Prevent flashing of removed layers, which happens when just setting overlay to null.
            // [HACK] Prevent removal of already removed tileManager.
            googleMap.overlayMapTypes.insertAt(layerIndex, null)
            googleMap.overlayMapTypes.removeAt(layerIndex + 1)
        }
    }

    equals = other =>
        other === this
            || other instanceof GoogleLabelsLayer
}

const labelsLayerStyle = [
    {featureType: 'all', stylers: [{visibility: 'off'}]},
    {elementType: 'labels.text.fill', stylers: [{color: '#ebd1aa'}, {visibility: 'on'}]},
    {elementType: 'labels.text.stroke', stylers: [{color: '#000000'}, {visibility: 'on'}, {weight: 2}]},
    {elementType: 'geometry.stroke', stylers: [{color: '#000000'}, {visibility: 'on'}]},
    {featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{color: '#ebe5dd'}, {visibility: 'on'}]},
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{color: '#ebd9ca'}, {visibility: 'on'}]
    },
    {featureType: 'road', elementType: 'geometry', stylers: [{color: '#ebd1b1'}, {visibility: 'on'}]},
    {featureType: 'road', elementType: 'geometry.stroke', stylers: [{color: '#212a37'}, {visibility: 'on'}]},
    {featureType: 'road', elementType: 'labels.text.fill', stylers: [{color: '#ebe1db'}, {visibility: 'on'}]},
    {featureType: 'road.highway', elementType: 'geometry', stylers: [{color: '#ebbba2'}, {visibility: 'on'}]},
    {featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{color: '#1f2835'}, {visibility: 'on'}]}
]
