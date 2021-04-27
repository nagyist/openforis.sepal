import {ElementResizeDetector} from 'widget/elementResizeDetector'
import {Graph} from 'widget/graph'
import {animationFrameScheduler, fromEvent, interval, merge} from 'rxjs'
import {compose} from 'compose'
import {distinctUntilChanged, filter, map, mapTo, scan, switchMap} from 'rxjs/operators'
import Hammer from 'hammerjs'
import Icon from 'widget/icon'
import Portal from 'widget/portal'
import React from 'react'
import _ from 'lodash'
import styles from './histogram.module.css'
import withSubscriptions from 'subscription'

const DEFAULT_STRETCH = 99.99

export class Histogram extends React.Component {
    state = {
        width: null,
        dragging: false
    }

    constructor(params) {
        super(params)
        this.onDragging = this.onDragging.bind(this)
    }

    render() {
        const {loading, histogram} = this.props
        if (loading) {
            return this.renderLoading()
        } else if (histogram) {
            return this.renderHistogram()
        } else {
            return <div className={styles.histogram}/>
        }
    }

    renderLoading() {
        return (
            <div className={styles.histogram}>
                <Icon name='spinner' className={styles.spinner}/>
            </div>
        )
    }

    renderHistogram() {
        const {histogram, min, max, onMinMaxChange} = this.props
        const {width} = this.state
        return (
            <div className={styles.histogram}>
                <ElementResizeDetector onResize={({width}) => this.setState({width})}>
                    <div className={styles.graph}>
                        {width
                            ? (
                                <Graph
                                    data={histogram}
                                    drawGrid={false}
                                    axes={{
                                        x: {drawAxis: false},
                                        y: {drawAxis: false}
                                    }}
                                    legend='never'
                                    highlightCircleSize={0}
                                    fillGraph={true}
                                />
                            )
                            : null
                        }
                    </div>
                </ElementResizeDetector>
                <Handles
                    histogram={histogram}
                    min={min}
                    max={max}
                    width={width}
                    onMinMaxChange={onMinMaxChange}
                    onDragging={this.onDragging}
                />
                {this.renderOverlay()}
            </div>
        )
    }

    onDragging(dragging) {
        this.setState({dragging})
    }

    renderOverlay() {
        const {dragging} = this.state
        return dragging
            ? (
                <Portal type='global'>
                    <div className={styles.cursorOverlay}/>
                </Portal>
            ) : null
    }

    componentDidUpdate(prevProps) {
        const {histogram: prevHistogram} = prevProps
        const {histogram, min, max, onMinMaxChange} = this.props
        if (histogram && (!_.isFinite(min) || !_.isFinite(max) || prevHistogram !== histogram)) {
            onMinMaxChange(stretch(histogram, DEFAULT_STRETCH))
        }
    }
}

class Handles extends React.Component {
    state = {
        histogramMin: undefined,
        histogramMax: undefined
    }

    constructor(props) {
        super(props)
        this.onMinPosition = this.onMinPosition.bind(this)
        this.onMaxPosition = this.onMaxPosition.bind(this)
    }

    render() {
        return (

            <div className={styles.handles}>
                {this.renderHandles()}
            </div>
        )
    }

    renderHandles() {
        const {min, max, width, onDragging} = this.props
        const {histogramMin, histogramMax} = this.state
        const widthFactor = width / (histogramMax - histogramMin)
        const leftWidth = Math.max(0, min - histogramMin) * widthFactor
        const rightWidth = Math.max(0, histogramMax - max) * widthFactor
        const leftPosition = leftWidth
        const rightPosition = width - rightWidth
        // Handle width - adjust based on space between left and right
        if (width) {
            return <React.Fragment>
                <div className={[styles.cropArea, styles.leftCropArea].join(' ')}>
                    <div className={styles.spacer} style={{'--width': `${leftWidth}px`}}/>
                    <Handle
                        position={leftPosition}
                        width={width}
                        onDragging={onDragging}
                        onPosition={this.onMinPosition}
                    />
                </div>
                <div className={[styles.cropArea, styles.rightCropArea].join(' ')}>
                    <Handle
                        position={rightPosition}
                        width={width}
                        onDragging={onDragging}
                        onPosition={this.onMaxPosition}
                    />
                    <div className={styles.spacer} style={{'--width': `${rightWidth}px`}}/>
                </div>
            </React.Fragment>
        } else {
            return null
        }
    }

    componentDidUpdate() {
        const {histogram} = this.props
        const {histogramMin, histogramMax} = histogramMinMax(histogram)
        this.setState(({histogramMin: prevMin, histogramMax: prevMax}) =>
            prevMin !== histogramMin || prevMax !== histogramMax
                ? {histogramMin, histogramMax}
                : null
        )
    }

    onMinPosition(minPosition) {
        const {max, onMinMaxChange} = this.props
        const min = this.positionToValue(minPosition)
        onMinMaxChange({min, max: Math.max(min, max)})
    }

    onMaxPosition(maxPosition) {
        const {min, onMinMaxChange} = this.props
        const max = this.positionToValue(maxPosition)
        onMinMaxChange({min: Math.min(min, max), max})
    }

    positionToValue(position) {
        const {width} = this.props
        const {histogramMin, histogramMax} = this.state
        const widthFactor = (histogramMax - histogramMin) / width

        const value = _.toNumber((histogramMin + position * widthFactor).toPrecision(3))
        return histogramMax - histogramMin > 1000
            ? value.toFixed(0)
            : value
    }
}

const SMOOTHING_FACTOR = .2
const clamp = (value, {min, max}) => Math.max(min, Math.min(max, value))
const lerp = (value, target) => value + (target - value) * Math.min(SMOOTHING_FACTOR, 1)

class _Handle extends React.Component {
    ref = React.createRef()

    render() {
        return (
            <div ref={this.ref} className={styles.handle}/>
        )
    }

    componentDidMount() {
        this.initializeHandle()
    }

    initializeHandle() {
        const {onDragging, onPosition, addSubscription} = this.props
        const ref = this.ref.current
        if (!ref) {
            return
        }

        const handle = new Hammer(ref)

        handle.get('pan').set({
            direction: Hammer.DIRECTION_HORIZONTAL,
            threshold: 0
        })

        const dragLerp = (current, target) => {
            return lerp(current, target)
        }

        const hold$ = merge(
            fromEvent(ref, 'mousedown'),
            fromEvent(ref, 'touchstart')
        )
        const release$ = merge(
            fromEvent(ref, 'mouseup'),
            fromEvent(ref, 'touchend')
        )

        const pan$ = fromEvent(handle, 'panstart panmove panend')
        const panStart$ = pan$.pipe(filter(e => e.type === 'panstart'))
        const panMove$ = pan$.pipe(filter(e => e.type === 'panmove'))
        const panEnd$ = pan$.pipe(filter(e => e.type === 'panend'))
        const animationFrame$ = interval(0, animationFrameScheduler)

        const dragPosition$ =
            panStart$.pipe(
                switchMap(() => {
                    const {position} = this.props
                    return panMove$.pipe(
                        map(event => {
                            return this.clampPosition(position + event.deltaX)
                        }),
                        distinctUntilChanged(_.isEqual),
                    )
                })
            )

        const handlePosition$ = dragPosition$.pipe(
            switchMap(targetPosition => {
                const {position} = this.props
                return animationFrame$.pipe(
                    map(() => targetPosition),
                    scan(dragLerp, position),
                    map(position => Math.round(position)),
                    distinctUntilChanged(_.isEqual)
                )
            })
        )

        const dragging$ = merge(
            hold$.pipe(mapTo(true)),
            release$.pipe(mapTo(false)),
            panStart$.pipe(mapTo(true)),
            panEnd$.pipe(mapTo(false)),
        )

        addSubscription(
            handlePosition$.subscribe(position =>
                onPosition(position)
            ),
            dragging$.subscribe(dragging =>
                onDragging(dragging)
            )
        )
    }

    clampPosition(position) {
        const {width} = this.props
        const margin = 0
        return Math.round(
            clamp(position, {
                min: margin,
                max: width - margin
            })
        )
    }
}
const Handle = compose(
    _Handle,
    withSubscriptions()
)

const histogramMinMax = histogram => {
    const histogramMin = histogram[0][0]
    const histogramLastValue = histogram[histogram.length - 1][0]
    const bucketWidth = (histogramLastValue - histogramMin) / (histogram.length - 1)
    const histogramMax = histogramLastValue + bucketWidth
    return {histogramMin, histogramMax}
}

export const stretch = (histogram, percent) => {
    const total = histogram.reduce((acc, [_value, count]) => acc + count, 0)
    const threshold = total * (1 - (percent / 100)) / 2
    const inMinStretch = _.last(
        histogram
            .reduce((acc, [value, count]) => [...acc, [value, (acc.length ? acc[acc.length - 1][1] : 0) + count]], [])
            .filter(([_value, total]) => total < threshold)
    )
    const min = inMinStretch ? inMinStretch[0] : histogram[0][0]
    const inMaxStretch = _.last(
        histogram
            .slice().reverse() // Immutably reverse
            .reduce((acc, [value, count]) => [...acc, [value, (acc.length ? acc[acc.length - 1][1] : 0) + count]], [])
            .filter(([_value, total]) => total < threshold)
    )
    const max = inMaxStretch ? inMaxStretch[0] : histogram[histogram.length - 1][0]
    return {min, max}
}
