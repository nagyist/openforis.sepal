export const getPreSetVisualizations = recipe => {
    const visualizations = recipe.model.imageToMask?.visualizations
    return visualizations || []
}
