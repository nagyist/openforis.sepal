import {BottomBar, Content, SectionLayout} from 'widget/sectionLayout'
import {CreateRecipe} from './createRecipe'
import {RecipeList} from './recipeList/recipeList'
import {closeTab} from 'widget/tabs/tabs'
import {compose} from 'compose'
import {connect, select} from 'store'
import {duplicateRecipe$, initializeRecipe, isRecipeOpen, moveRecipes$, openRecipe, removeRecipes$, selectRecipe} from './recipe'
import {map, of, tap} from 'rxjs'
import {msg} from 'translate'
// import {publishEvent} from 'eventPublisher'
import Notifications from 'widget/notifications'
import PropTypes from 'prop-types'
import React from 'react'
import _ from 'lodash'
import actionBuilder from 'action-builder'
import api from 'api'
import styles from './recipeHome.module.css'

const mapStateToProps = () => {
    const recipes = select('process.recipes')
    return {
        recipes: recipes ? recipes : null,
        loadedRecipes: select('process.loadedRecipes') || {}
    }
}

class _RecipeHome extends React.Component {
    render() {
        const {recipeId, recipes} = this.props
        return (
            <RecipeList
                onRemove={recipeIds => this.removeRecipes(recipeIds)}
                onMove={(recipeIds, projectId) => this.moveRecipes(recipeIds, projectId)}>
                <SectionLayout>
                    <Content horizontalPadding verticalPadding menuPadding className={styles.container}>
                        <CreateRecipe
                            recipeId={recipeId}
                            trigger={recipes && !recipes.length}/>
                        <RecipeList.Data
                            onClick={recipeId => this.openRecipe(recipeId)}
                            onDuplicate={recipeId => this.duplicateRecipe(recipeId)}
                            onRemove={recipeId => this.removeRecipes(recipeId)}
                        />
                    </Content>
                    <BottomBar className={styles.bottomBar}>
                        {recipes && recipes.length
                            ? <RecipeList.Pagination/>
                            : !recipes
                                ? null
                                : <div>{msg('process.menu.noSavedRecipes')}</div>
                        }
                    </BottomBar>
                </SectionLayout>
            </RecipeList>
        )
    }

    openRecipe(recipeId) {
        const {stream} = this.props
        if (isRecipeOpen(recipeId)) {
            selectRecipe(recipeId)
        } else {
            stream('LOAD_RECIPE',
                this.loadRecipe$(recipeId),
                recipe => openRecipe(recipe)
            )
        }
    }

    loadRecipe$(recipeId) {
        const {loadedRecipes} = this.props
        return Object.keys(loadedRecipes).includes(recipeId)
            ? of(loadedRecipes[recipeId])
            : api.recipe.load$(recipeId).pipe(
                map(recipe => initializeRecipe(recipe)),
                tap(recipe =>
                    actionBuilder('CACHE_RECIPE', recipe)
                        .set(['process.loadedRecipes', recipe.id], recipe)
                        .dispatch()
                )
            )
    }

    duplicateRecipe(recipeIdToDuplicate) {
        const {stream} = this.props
        stream('DUPLICATE_RECIPE',
            duplicateRecipe$(recipeIdToDuplicate).pipe(
                tap(() => closeTab(this.props.recipeId, 'process'))
            )
        )
    }

    removeRecipes(recipeIdOrIds) {
        const recipeIds = _.castArray(recipeIdOrIds)
        const {stream} = this.props
        // publishEvent('remove_recipe', {recipe_type: type})
        stream('REMOVE_RECIPES',
            removeRecipes$(recipeIds),
            () => {
                recipeIds.forEach(recipeId => closeTab(recipeId, 'process'))
                Notifications.success({message: msg('process.recipe.remove.success')})
            }
        )
    }

    moveRecipes(recipeIds, projectId) {
        const {stream} = this.props
        stream('MOVE_RECIPES',
            moveRecipes$(recipeIds, projectId),
            () => {
                Notifications.success({message: msg('process.recipe.move.success')})
            }
        )
    }

    selectRecipe(recipe) {
        actionBuilder('SELECT_RECIPE', recipe.id)
            .assign(['process.recipes', {id: recipe.id}], {selected: !recipe.selected})
            .dispatch()
    }
}

export const RecipeHome = compose(
    _RecipeHome,
    connect(mapStateToProps)
)

RecipeHome.propTypes = {
    recipeId: PropTypes.string.isRequired
}
