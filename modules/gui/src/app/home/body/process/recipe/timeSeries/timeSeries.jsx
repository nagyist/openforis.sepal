import moment from 'moment'
import React from 'react'

import {recipe} from '~/app/home/body/process/recipeContext'
import {compose} from '~/compose'
import {selectFrom} from '~/stateUtils'
import {msg} from '~/translate'
import {Notifications} from '~/widget/notifications'

import {Map} from '../../../../map/map'
import {recipeAccess} from '../../recipeAccess'
import {Aoi} from '../aoi'
import {initializeLayers} from '../recipeImageLayerSource'
import {getAvailableBands} from './bands'
import {TimeSeriesToolbar} from './panels/timeSeriesToolbar'
import {defaultModel, RecipeActions} from './timeSeriesRecipe'
import {getPreSetVisualizations} from './visualizations'

const mapRecipeToProps = recipe => ({
    aoi: selectFrom(recipe, 'model.aoi'),
    classificationRecipeId: selectFrom(recipe, 'model.sources.classification'),
    classificationLegend: selectFrom(recipe, 'ui.classification.classificationLegend'),
    savedLayers: selectFrom(recipe, 'layers')
})

class _TimeSeries extends React.Component {
    constructor(props) {
        super(props)
        const {savedLayers, recipeId} = props
        this.recipeActions = RecipeActions(recipeId)
        initializeLayers({recipeId, savedLayers, defaultGoogleSatellite: true})
    }

    render() {
        const {aoi} = this.props
        return (
            <Map>
                <TimeSeriesToolbar/>
                <Aoi value={aoi}/>
            </Map>
        )
    }

    componentDidMount() {
        this.initClassification()
    }

    componentDidUpdate() {
        this.initClassification()
    }

    initClassification() {
        const {stream, classificationLegend, classificationRecipeId, loadRecipe$} = this.props
        if (classificationRecipeId && !classificationLegend && !stream('LOAD_CLASSIFICATION_RECIPE').active) {
            stream('LOAD_CLASSIFICATION_RECIPE',
                loadRecipe$(classificationRecipeId),
                classification => {
                    this.recipeActions.setClassification({
                        classificationLegend: classification.model.legend,
                        classifierType: classification.model.classifier.type
                    })
                },
                error => Notifications.error({message: msg('process.timeSeries.panel.sources.classificationLoadError', {error}), error})
            )
        } else if (!classificationRecipeId && classificationLegend && !stream('LOAD_CLASSIFICATION_RECIPE').active) {
            this.recipeActions.setClassification({classificationLegend: null, classifierType: null})
        }
    }
}

const TimeSeries = compose(
    _TimeSeries,
    recipe({defaultModel, mapRecipeToProps}),
    recipeAccess()
)

const getDependentRecipeIds = recipe => {
    const classification = selectFrom(recipe, 'model.sources.classification')
    return classification ? [classification] : []
}

export default () => ({
    id: 'TIME_SERIES',
    labels: {
        name: msg('process.timeSeries.create'),
        creationDescription: msg('process.timeSeries.description'),
        tabPlaceholder: msg('process.timeSeries.tabPlaceholder')
    },
    tags: ['TIME_SERIES'],
    components: {
        recipe: TimeSeries
    },
    noImageOutput: true,
    getDependentRecipeIds,
    getDateRange: recipe => [
        moment.utc(recipe.model.dates.startDate, 'YYYY-MM-DD'),
        moment.utc(recipe.model.dates.endDate, 'YYYY-MM-DD')
    ],
    getAvailableBands,
    getPreSetVisualizations
})
