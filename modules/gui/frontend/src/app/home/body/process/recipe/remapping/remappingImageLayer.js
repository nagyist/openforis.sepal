import {MapAreaLayout} from 'app/home/map/mapAreaLayout'
import {VisualizationSelector} from 'app/home/map/imageLayerSource/visualizationSelector'
import {compose} from 'compose'
import {getAvailableBands} from './bands'
import {getPreSetVisualizations} from './visualizations'
import {hasTrainingData} from './remappingRecipe'
import {msg} from 'translate'
import {selectFrom} from 'stateUtils'
import PropTypes from 'prop-types'
import React from 'react'
import _ from 'lodash'

const defaultLayerConfig = {
    panSharpen: false
}

class _RemappingImageLayer extends React.Component {
    render() {
        const {layer, map} = this.props
        return (
            <MapAreaLayout
                layer={this.canRender() ? layer : null}
                form={this.renderImageLayerForm()}
                map={map}
            />
        )
    }

    renderImageLayerForm() {
        const {recipe, source, layerConfig = {}} = this.props
        const availableBands = getAvailableBands(recipe)
        const preSetOptions = getPreSetVisualizations(recipe)
            .filter(({bands}) => availableBands[bands[0]])
            .map(visParams => {
                const band = visParams.bands[0]
                return {...availableBands[band], value: band, visParams}
            })
        const options = this.hasLegend()
            ? [{
                label: msg('process.remapping.layers.imageLayer.preSets'),
                options: preSetOptions
            }]
            : []
        return (
            <VisualizationSelector
                source={source}
                recipe={recipe}
                presetOptions={options}
                selectedVisParams={layerConfig.visParams}
            />
        )
    }

    hasLegend() {
        const {recipe} = this.props
        return !_.isEmpty(selectFrom(recipe, 'model.legend.entries'))
    }

    canRender() {
        const {recipe} = this.props
        const inputImagery = selectFrom(recipe, ['model.inputImagery.images']) || []
        return inputImagery.length && hasTrainingData(recipe)
    }
}

export const RemappingImageLayer = compose(
    _RemappingImageLayer
)

RemappingImageLayer.defaultProps = {
    layerConfig: defaultLayerConfig
}

RemappingImageLayer.propTypes = {
    recipe: PropTypes.object.isRequired,
    source: PropTypes.object.isRequired,
    layer: PropTypes.object,
    layerConfig: PropTypes.object,
    map: PropTypes.object
}
