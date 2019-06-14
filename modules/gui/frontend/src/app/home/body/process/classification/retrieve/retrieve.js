import {selectFrom} from 'stateUtils'
import {FormButtons as Buttons} from 'widget/buttons'
import {Field, FieldSet} from 'widget/form'
import {FormPanelButtons} from 'widget/formPanel'
import {PanelContent, PanelHeader} from 'widget/panel'
import Slider from 'widget/slider'
import {RecipeActions} from '../classificationRecipe'
import {RecipeFormPanel, recipeFormPanel} from 'app/home/body/process/recipeFormPanel'
import {compose} from 'compose'
import {currentUser} from 'widget/user'
import {msg} from 'translate'
import PropTypes from 'prop-types'
import React from 'react'
import styles from './retrieve.module.css'

const fields = {
    scale: new Field(),
    destination: new Field()
        .notEmpty('process.classification.panel.retrieve.form.destination.required')
}

const mapRecipeToProps = recipe => {
    const props = {}
    if (!selectFrom(recipe, 'ui.retrieve.scale')) {
        props.values = {scale: 30}
    }
    return props
}

class Retrieve extends React.Component {
    renderContent() {
        const {inputs: {scale, destination}} = this.props
        const user = currentUser()
        const destinationOptions = [
            {
                value: 'SEPAL',
                label: msg('process.mosaic.panel.retrieve.form.destination.SEPAL'),
                disabled: !user.googleTokens
            },
            {
                value: 'GEE',
                label: msg('process.mosaic.panel.retrieve.form.destination.GEE')
            }
        ].filter(({value}) => user.googleTokens || value !== 'GEE')

        return (
            <FieldSet>
                <Slider
                    label={msg('process.classification.panel.retrieve.form.scale.label')}
                    info={scale => msg('process.classification.panel.retrieve.form.scale.info', {scale})}
                    input={scale}
                    minValue={10}
                    maxValue={100}
                    scale={'log'}
                    ticks={[10, 15, 20, 30, 60, 100]}
                    snap
                    range='none'
                />
                <Buttons
                    label={msg('process.classification.panel.retrieve.form.destination.label')}
                    input={destination}
                    multiple={false}
                    options={destinationOptions}/>
            </FieldSet>
        )
    }

    render() {
        const {recipeId} = this.props
        return (
            <RecipeFormPanel
                className={styles.panel}
                isActionForm
                placement='top-right'
                onApply={values => RecipeActions(recipeId).retrieve(values).dispatch()}>
                <PanelHeader
                    icon='cloud-download-alt'
                    title={msg('process.classification.panel.retrieve.title')}/>

                <PanelContent>
                    {this.renderContent()}
                </PanelContent>

                <FormPanelButtons
                    applyLabel={msg('process.classification.panel.retrieve.apply')}/>
            </RecipeFormPanel>
        )
    }

    componentDidUpdate() {
        const {inputs: {destination}} = this.props
        const user = currentUser()
        if (!user.googleTokens && destination.value !== 'SEPAL')
            destination.set('SEPAL')
    }
}

Retrieve.propTypes = {
    recipeId: PropTypes.string,
    user: PropTypes.object
}

export default compose(
    Retrieve,
    recipeFormPanel({id: 'retrieve', fields, mapRecipeToProps})
)
