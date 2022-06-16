import {RecipeInput} from 'widget/recipeInput'
import {Subject} from 'rxjs'
import {compose} from 'compose'
import {recipeAccess} from 'app/home/body/process/recipeAccess'
import PropTypes from 'prop-types'
import React from 'react'

class RecipeSection extends React.Component {
    constructor(props) {
        super(props)
        this.recipeChanged$ = new Subject()
    }

    render() {
        const {inputs: {recipe}} = this.props
        return (
            <RecipeInput
                filter={type => type.id === 'CCDC'}
                input={recipe}
                autoFocus
                errorMessage
            />
        )
    }
}

RecipeSection.propTypes = {
    inputs: PropTypes.object.isRequired
}

export default compose(
    RecipeSection,
    recipeAccess()
)
