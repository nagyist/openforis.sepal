import {Form} from 'widget/form/form'
import {Layout} from 'widget/layout'
import {Panel} from 'widget/panel/panel'
import {RecipeFormPanel, recipeFormPanel} from 'app/home/body/process/recipeFormPanel'
import {compose} from 'compose'
import {msg} from 'translate'
import {selectFrom} from 'stateUtils'
import React from 'react'
import _ from 'lodash'
import styles from './opticalPreprocess.module.css'

const fields = {
    corrections: new Form.Field(),
    histogramMatching: new Form.Field(),
    cloudDetection: new Form.Field(),
    cloudMasking: new Form.Field(),
    shadowMasking: new Form.Field(),
    snowMasking: new Form.Field()
}

const mapRecipeToProps = recipe => ({
    sources: selectFrom(recipe, 'model.sources.dataSets'),
    dataSetType: selectFrom(recipe, 'model.sources.dataSetType'),
})

class OpticalPreprocess extends React.Component {
    render() {
        return (
            <RecipeFormPanel
                className={styles.panel}
                placement='bottom-right'>
                <Panel.Header
                    icon='cog'
                    title={msg('process.ccdc.panel.preprocess.title')}/>
                <Panel.Content>
                    <Layout>
                        {this.renderCorrectionsOptions()}
                        {this.renderHistogramMatching()}
                        {this.renderCloudDetectionOptions()}
                        {this.renderCloudMaskingOptions()}
                        {this.renderShadowMaskingOptions()}
                        {this.renderSnowMaskingOptions()}
                    </Layout>
                </Panel.Content>
                <Form.PanelButtons/>
            </RecipeFormPanel>
        )
    }

    renderCorrectionsOptions() {
        const {dataSetType, inputs: {corrections}} = this.props
        if (dataSetType === 'PLANET') {
            return null
        }
        return (
            <Form.Buttons
                label={msg('process.ccdc.panel.preprocess.form.corrections.label')}
                input={corrections}
                multiple={true}
                options={[{
                    value: 'SR',
                    label: msg('process.ccdc.panel.preprocess.form.corrections.surfaceReflectance.label'),
                    tooltip: msg('process.ccdc.panel.preprocess.form.corrections.surfaceReflectance.tooltip')
                }, {
                    value: 'BRDF',
                    label: msg('process.ccdc.panel.preprocess.form.corrections.brdf.label'),
                    tooltip: msg('process.ccdc.panel.preprocess.form.corrections.brdf.tooltip')
                }]}
            />
        )
    }

    renderHistogramMatching() {
        const {dataSetType, inputs: {histogramMatching}} = this.props
        if (dataSetType !== 'PLANET') {
            return null
        }
        const options = [
            {value: 'ENABLED', label: msg('process.planetMosaic.panel.options.form.histogramMatching.options.ENABLED')},
            {value: 'DISABLED', label: msg('process.planetMosaic.panel.options.form.histogramMatching.options.DISABLED')},
        ]
        return (
            <Form.Buttons
                label={msg('process.planetMosaic.panel.options.form.histogramMatching.label')}
                tooltip={msg('process.planetMosaic.panel.options.form.histogramMatching.tooltip')}
                input={histogramMatching}
                options={options}
            />
        )
    }

    renderCloudDetectionOptions() {
        const {sources, inputs: {corrections, cloudDetection}} = this.props
        const pino26Disabled = corrections.value.includes('SR') || !_.isEqual(Object.keys(sources), ['SENTINEL_2'])
        return (
            <Form.Buttons
                label={msg('process.ccdc.panel.preprocess.form.cloudDetection.label')}
                input={cloudDetection}
                multiple
                options={[
                    {
                        value: 'QA',
                        label: msg('process.ccdc.panel.preprocess.form.cloudDetection.qa.label'),
                        tooltip: msg('process.ccdc.panel.preprocess.form.cloudDetection.qa.tooltip')
                    },
                    {
                        value: 'CLOUD_SCORE',
                        label: msg('process.ccdc.panel.preprocess.form.cloudDetection.cloudScore.label'),
                        tooltip: msg('process.ccdc.panel.preprocess.form.cloudDetection.cloudScore.tooltip')
                    },
                    {
                        value: 'PINO_26',
                        label: msg('process.ccdc.panel.preprocess.form.cloudDetection.pino26.label'),
                        tooltip: msg('process.ccdc.panel.preprocess.form.cloudDetection.pino26.tooltip'),
                        neverSelected: pino26Disabled
                    }
                ]}
                type='horizontal'
                disabled={this.noProcessing()}
            />
        )
    }

    renderCloudMaskingOptions() {
        const {inputs: {cloudMasking}} = this.props
        return (
            <Form.Buttons
                label={msg('process.ccdc.panel.preprocess.form.cloudMasking.label')}
                input={cloudMasking}
                options={[{
                    value: 'MODERATE',
                    label: msg('process.ccdc.panel.preprocess.form.cloudMasking.moderate.label'),
                    tooltip: msg('process.ccdc.panel.preprocess.form.cloudMasking.moderate.tooltip')
                }, {
                    value: 'AGGRESSIVE',
                    label: msg('process.ccdc.panel.preprocess.form.cloudMasking.aggressive.label'),
                    tooltip: msg('process.ccdc.panel.preprocess.form.cloudMasking.aggressive.tooltip')
                }]}
                type='horizontal'
                disabled={this.noProcessing()}
            />
        )
    }

    renderShadowMaskingOptions() {
        const {inputs: {shadowMasking}} = this.props
        return (
            <Form.Buttons
                label={msg('process.ccdc.panel.preprocess.form.shadowMasking.label')}
                input={shadowMasking}
                options={[{
                    value: 'OFF',
                    label: msg('process.ccdc.panel.preprocess.form.shadowMasking.off.label'),
                    tooltip: msg('process.ccdc.panel.preprocess.form.shadowMasking.off.tooltip')
                }, {
                    value: 'ON',
                    label: msg('process.ccdc.panel.preprocess.form.shadowMasking.on.label'),
                    tooltip: msg('process.ccdc.panel.preprocess.form.shadowMasking.on.tooltip')
                }]}
                type='horizontal-nowrap'
                disabled={this.noProcessing()}
            />
        )
    }

    renderSnowMaskingOptions() {
        const {inputs: {snowMasking}} = this.props
        return (
            <Form.Buttons
                label={msg('process.ccdc.panel.preprocess.form.snowMasking.label')}
                input={snowMasking}
                options={[{
                    value: 'OFF',
                    label: msg('process.ccdc.panel.preprocess.form.snowMasking.off.label'),
                    tooltip: msg('process.ccdc.panel.preprocess.form.snowMasking.off.tooltip')
                }, {
                    value: 'ON',
                    label: msg('process.ccdc.panel.preprocess.form.snowMasking.on.label'),
                    tooltip: msg('process.ccdc.panel.preprocess.form.snowMasking.on.tooltip')
                }]}
                type='horizontal-nowrap'
                disabled={this.noProcessing()}
            />
        )
    }

    componentDidMount() {
        const {inputs: {histogramMatching}} = this.props
        if (!histogramMatching.value) {
            histogramMatching.set('DISABLED')
        }
    }

    noProcessing() {
        const {sources, inputs: {histogramMatching}} = this.props
        return Object.values(sources).flat().includes('DAILY') && histogramMatching.value !== 'ENABLED'
    }
}

OpticalPreprocess.propTypes = {}

const valuesToModel = values => ({
    corrections: values.corrections,
    histogramMatching: values.histogramMatching,
    cloudDetection: values.cloudDetection,
    cloudMasking: values.cloudMasking,
    shadowMasking: values.shadowMasking,
    snowMasking: values.snowMasking,
})

const modelToValues = model => {
    return ({
        corrections: model.corrections,
        histogramMatching: model.histogramMatching,
        cloudDetection: model.cloudDetection,
        cloudMasking: model.cloudMasking,
        shadowMasking: model.shadowMasking,
        snowMasking: model.snowMasking
    })
}

export default compose(
    OpticalPreprocess,
    recipeFormPanel({id: 'options', fields, modelToValues, valuesToModel, mapRecipeToProps})
)