import _ from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import {animationFrames, debounceTime, distinctUntilChanged, map, of, scan, Subject, switchMap} from 'rxjs'

import {withRecipe} from '~/app/home/body/process/recipeContext'
import {compose} from '~/compose'
import {connect} from '~/connect'
import {selectFrom} from '~/stateUtils'
import {withSubscriptions} from '~/subscription'
import {ElementResizeDetector} from '~/widget/elementResizeDetector'
import {Scrollable} from '~/widget/scrollable'
import {Tooltip} from '~/widget/tooltip'
import {isMobile} from '~/widget/userAgent'

import {withCursorValue} from './cursorValue'
import styles from './legendLayer.module.css'
import {withMapArea} from './mapAreaContext'

const mapRecipeToProps = recipe => ({
    areas: selectFrom(recipe, 'layers.areas') || {}
})

class _LegendLayer extends React.Component {
    state = {
        value: [],
        paletteWidth: null
    }

    constructor(props) {
        super(props)
        this.ref = React.createRef()
        const {cursorValue$, addSubscription} = props
        addSubscription(
            cursorValue$.subscribe(value => this.setState({value}))
        )
    }

    renderPalette({values, palette}) {
        return palette.map((color, i) =>
            <div
                key={values[i]}
                style={{'--color': color}}
                className={styles.color}
            />
        )
    }

    renderCursorValues({labels, values}) {
        const {value, paletteWidth} = this.state
        return _.isNil(value)
            ? null
            : value.map((v, i) =>
                <CursorValue
                    key={i}
                    value={v}
                    values={values}
                    labels={labels}
                    paletteWidth={paletteWidth}
                />
            )
    }

    render() {
        const {cursorValue$, mapArea: {area}, areas} = this.props
        const {labels, values, palette} = selectFrom(areas[area], 'imageLayer.layerConfig.visParams') || {}
        if (!cursorValue$ || !values || !palette) {
            return null
        }
        return (
            <div className={styles.container}>
                <Tooltip
                    msg={this.renderFullLegend()}
                    placement='top'
                    clickTrigger={isMobile()}>
                    <ElementResizeDetector targetRef={this.ref} onResize={({width}) => this.setState({paletteWidth: width})}>
                        <div ref={this.ref} className={styles.legend}>
                            {this.renderPalette({values, palette})}
                            {this.renderCursorValues({labels, values})}
                        </div>
                    </ElementResizeDetector>
                </Tooltip>
            </div>
        )
    }

    renderFullLegend() {
        const {mapArea: {area}, areas} = this.props
        const {labels, values, palette} = selectFrom(areas[area], 'imageLayer.layerConfig.visParams') || {}
        return (
            <Scrollable direction='y'>
                <div className={styles.fullLegend}>
                    {_.range(0, values.length).map(i =>
                        <React.Fragment key={values[i]}>
                            <div className={styles.fullLegendColor} style={{'--color': palette[i]}}/>
                            <div className={styles.fullLegendValue}>{values[i]}</div>
                            <div className={styles.fullLegendLabel}>{labels[i]}</div>
                        </React.Fragment>
                    )}
                </div>
            </Scrollable>
        )
    }
}

class _CursorValue extends React.Component {
    state = {
        position: null
    }
    targetPosition$ = new Subject()

    render() {
        const {value, values, labels} = this.props
        const {position} = this.state
        const label = labels[values.findIndex(v => v === value)]
        return (
            <div
                className={styles.cursorValue}
                style={{'--left': `${position}px`}}>
                <div className={styles.label}>{label}</div>
                <div className={styles.value}>({value})</div>
                <div className={styles.arrow}/>
            </div>
        )
    }

    componentDidMount() {
        const {addSubscription} = this.props

        addSubscription(
            this.targetPosition$.pipe(
                debounceTime(50),
                switchMap(targetPosition => {
                    const {position} = this.state
                    return position === null
                        ? of(targetPosition)
                        : animationFrames().pipe(
                            map(() => targetPosition),
                            scan(lerp(.2), position),
                            map(position => Math.round(position)),
                            distinctUntilChanged()
                        )
                })
            ).subscribe(position =>
                this.setPosition(position)
            )
        )
    }

    componentDidUpdate() {
        const {value, values, paletteWidth} = this.props
        const {position} = this.state
        const i = values.findIndex(v => v === value)
        const valueWidth = paletteWidth / values.length
        const nextPosition = Math.round(valueWidth * i + valueWidth / 2)
        if (position !== nextPosition) {
            this.targetPosition$.next(nextPosition)
        }
    }

    setPosition(position) {
        position = Math.round(position)
        if (position !== this.state.position) {
            this.setState({position})
        }
    }
}

const CursorValue = compose(
    _CursorValue,
    withSubscriptions()
)

CursorValue.propTypes = {
    labels: PropTypes.any,
    paletteWidth: PropTypes.any,
    value: PropTypes.any,
    values: PropTypes.any,
}

const lerp = (rate, speed = 1) => (value, target) => value + (target - value) * (rate * speed)

export const LegendLayer = compose(
    _LegendLayer,
    connect(),
    withMapArea(),
    withRecipe(mapRecipeToProps),
    withCursorValue(),
    withSubscriptions()
)

LegendLayer.propTypes = {}
