import {AssetInput} from 'widget/assetInput'
import {msg} from 'translate'
import PropTypes from 'prop-types'
import React from 'react'
import style from './inputImage.module.css'

export default class AssetSection extends React.Component {
    render() {
        const {input, onLoading} = this.props
        return (
            <AssetInput
                className={style.inputComponent}
                input={input}
                label={msg('process.indexChange.panel.inputImage.asset.label')}
                placeholder={msg('process.indexChange.panel.inputImage.asset.placeholder')}
                autoFocus
                onLoading={onLoading}
                onLoaded={({asset, metadata, visualizations}) => {
                    this.onLoaded({asset, metadata, visualizations})
                }}
            />
        )
    }

    onLoaded({asset, metadata, visualizations}) {
        const {onLoaded} = this.props
        const bands = metadata.bands
        onLoaded({id: asset, bands, metadata, visualizations})
        onLoaded({id: asset, bands, metadata, visualizations})
    }
}

AssetSection.propTypes = {
    input: PropTypes.object.isRequired,
    onLoaded: PropTypes.func.isRequired,
    onLoading: PropTypes.func.isRequired
}
