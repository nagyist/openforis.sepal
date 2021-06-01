import {MapInfo} from 'app/home/map/mapInfo'
import {RecipeActions} from './timeSeriesRecipe'
import {compose} from 'compose'
import {defaultModel} from './timeSeriesRecipe'
import {msg} from 'translate'
import {recipe} from 'app/home/body/process/recipeContext'
import {recipeAccess} from '../../recipeAccess'
import {selectFrom} from 'stateUtils'
import {setAoiLayer} from 'app/home/map/aoiLayer'
import MapToolbar from 'app/home/map/mapToolbar'
import Notifications from 'widget/notifications'
import React from 'react'
import TimeSeriesToolbar from './panels/timeSeriesToolbar'
import styles from './timeSeries.module.css'

const mapRecipeToProps = recipe => ({
    aoi: selectFrom(recipe, 'model.aoi'),
    classificationRecipeId: selectFrom(recipe, 'model.sources.classification'),
    classificationLegend: selectFrom(recipe, 'ui.classification.classificationLegend'),
})

class _TimeSeries extends React.Component {
    constructor(props) {
        super(props)
        this.recipeActions = RecipeActions(props.recipeId)
    }

    render() {
        const {recipeContext: {statePath}} = this.props
        return (
            <div className={styles.timeSeries}>
                <MapToolbar statePath={[statePath, 'ui']} labelLayerIndex={2}/>
                <MapInfo/>
                <TimeSeriesToolbar/>
            </div>
        )
    }

    componentDidMount() {
        const {map, aoi, componentWillUnmount$} = this.props
        setAoiLayer({
            map,
            aoi,
            destroy$: componentWillUnmount$,
            onInitialized: () => map.fitLayer('aoi'),
            layerIndex: 1
        })
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

export default () => ({
    id: 'TIME_SERIES',
    labels: {
        name: msg('process.timeSeries.create'),
        creationDescription: msg('process.timeSeries.description'),
        tabPlaceholder: msg('process.timeSeries.tabPlaceholder')
    },
    components: {
        recipe: TimeSeries
    }
})
