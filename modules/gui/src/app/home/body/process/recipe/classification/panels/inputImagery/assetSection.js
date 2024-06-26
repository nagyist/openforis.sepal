import PropTypes from 'prop-types'
import React from 'react'

import {msg} from '~/translate'
import {Form} from '~/widget/form'

import style from './inputImage.module.css'

export class AssetSection extends React.Component {
    render() {
        const {input, onLoading, onLoaded} = this.props
        return (
            <Form.AssetCombo
                className={style.inputComponent}
                input={input}
                label={msg('process.classification.panel.inputImagery.form.asset.label')}
                placeholder={msg('process.classification.panel.inputImagery.form.asset.placeholder')}
                autoFocus
                allowedTypes={['Image', 'ImageCollection']}
                onLoading={onLoading}
                onLoaded={({asset, metadata, visualizations}) => {
                    const bands = metadata.bands.map(({id}) => id)
                    onLoaded({id: asset, bands, metadata, visualizations})
                }}
            />
        )
    }
}

AssetSection.propTypes = {
    input: PropTypes.object.isRequired,
    onLoaded: PropTypes.func.isRequired,
    onLoading: PropTypes.func.isRequired
}
