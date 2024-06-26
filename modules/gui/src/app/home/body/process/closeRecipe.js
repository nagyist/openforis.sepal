import React from 'react'

import {compose} from '~/compose'
import {msg} from '~/translate'
import {withActivatable} from '~/widget/activation/activatable'
import {withActivators} from '~/widget/activation/activator'
import {Panel} from '~/widget/panel/panel'

import styles from './closeRecipe.module.css'
import {closeRecipe} from './recipe'

class _CloseRecipe extends React.Component {
    render() {
        const {activator: {activatables: {saveRecipeDialog}}, activatable} = this.props
        const recipe = activatable.recipe
        const title = recipe.title || recipe.placeholder
        const cancel = () => activatable.deactivate()
        const save = () => {
            activatable.deactivate()
            saveRecipeDialog.activate({recipe, closeTabOnSave: true})
        }
        const discard = () => {
            activatable.deactivate()
            closeRecipe(activatable.recipe.id)
        }
        return (
            <Panel
                className={styles.panel}
                type='modal'>
                <Panel.Header
                    icon='exclamation-triangle'
                    title={title}/>
                <Panel.Content>
                    <div className={styles.message}>
                        {msg('process.closeRecipe.message')}
                    </div>
                </Panel.Content>
                <Panel.Buttons>
                    <Panel.Buttons.Main>
                        <Panel.Buttons.Cancel
                            keybinding='Escape'
                            onClick={cancel}
                        />
                        <Panel.Buttons.Save
                            dots
                            keybinding='Enter'
                            onClick={save}
                        />
                    </Panel.Buttons.Main>
                    <Panel.Buttons.Extra>
                        <Panel.Buttons.Discard onClick={discard}/>
                    </Panel.Buttons.Extra>
                </Panel.Buttons>
            </Panel>
        )
    }
}

const policy = () => ({
    _: 'allow'
})

export const CloseRecipe = compose(
    _CloseRecipe,
    withActivators('saveRecipeDialog'),
    withActivatable({id: 'closeRecipeDialog', policy})
)

CloseRecipe.propTypes = {}
