import moment from 'moment'
import React from 'react'

import {Aoi} from '~/app/home/body/process/recipe/aoi'
import {initializeLayers} from '~/app/home/body/process/recipe/recipeImageLayerSource'
import {recipe} from '~/app/home/body/process/recipeContext'
import {Map} from '~/app/home/map/map'
import {compose} from '~/compose'
import {selectFrom} from '~/stateUtils'
import {msg} from '~/translate'

import {getAvailableBands} from './bands'
import {defaultModel} from './baytsHistoricalRecipe'
import {BaytsHistoricalToolbar} from './panels/baytsHistoricalToolbar'
import {getPreSetVisualizations} from './visualizations'

const mapRecipeToProps = recipe => ({
    aoi: selectFrom(recipe, 'model.aoi'),
    savedLayers: selectFrom(recipe, 'layers')
})

class _BaytsHistorical extends React.Component {
    constructor(props) {
        super(props)
        const {savedLayers, recipeId} = props
        initializeLayers({recipeId, savedLayers})
    }

    render() {
        const {aoi} = this.props
        return (
            <Map>
                <BaytsHistoricalToolbar/>
                <Aoi value={aoi}/>
            </Map>
        )
    }
}

const BaytsHistorical = compose(
    _BaytsHistorical,
    recipe({defaultModel, mapRecipeToProps})
)

const getDateRange = recipe => {
    const {fromDate, toDate} = recipe.model.dates
    return [moment.utc(fromDate, 'YYYY-MM-DD'), moment.utc(toDate, 'YYYY-MM-DD')]
}

export default () => ({
    id: 'BAYTS_HISTORICAL',
    labels: {
        name: msg('process.baytsHistorical.create'),
        creationDescription: msg('process.baytsHistorical.description'),
        tabPlaceholder: msg('process.baytsHistorical.tabPlaceholder'),
    },
    tags: ['CHANGE', 'ALERTS'],
    components: {
        recipe: BaytsHistorical
    },
    getDependentRecipeIds: _recipe => [],
    getDateRange,
    getAvailableBands,
    getPreSetVisualizations,
    beta: true
})
