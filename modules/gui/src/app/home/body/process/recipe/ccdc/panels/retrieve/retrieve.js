import PropTypes from 'prop-types'
import React from 'react'

import {compose} from '~/compose'
import {groupedBandOptions, toDataSetIds} from '~/sources'
import {selectFrom} from '~/stateUtils'

import {withRecipe} from '../../../../recipeContext'
import {MosaicRetrievePanel} from '../../../mosaic/panels/retrieve/retrievePanel'
import {RecipeActions} from '../../ccdcRecipe'

const mapRecipeToProps = recipe =>
    ({
        recipeId: recipe.id,
        sources: selectFrom(recipe, 'model.sources'),
        classificationLegend: selectFrom(recipe, 'ui.classification.classificationLegend'),
        classifierType: selectFrom(recipe, 'ui.classification.classifierType'),
        corrections: selectFrom(recipe, 'model.options.corrections')
    })

class _Retrieve extends React.Component {
    render() {
        return (
            <MosaicRetrievePanel
                bandOptions={this.bandOptions()}
                defaultScale={30}
                defaultAssetType='ImageCollection'
                defaultTileSize={0.5}
                toEE
                onRetrieve={retrieveOptions => this.retrieve(retrieveOptions)}
            />
        )
    }

    bandOptions() {
        const {classificationLegend, classifierType, corrections, sources: {dataSets}} = this.props
        return groupedBandOptions({
            dataSets: toDataSetIds(dataSets),
            corrections,
            classification: {classifierType, classificationLegend, include: ['regression', 'probabilities']}
        })
    }

    retrieve(retrieveOptions) {
        const {recipeId} = this.props
        return RecipeActions(recipeId).retrieve(retrieveOptions)
    }
}

export const Retrieve = compose(
    _Retrieve,
    withRecipe(mapRecipeToProps)
)

Retrieve.propTypes = {
    recipeId: PropTypes.string
}
