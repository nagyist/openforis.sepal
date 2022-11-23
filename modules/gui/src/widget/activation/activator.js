import {activationAllowed} from './activationPolicy'
import {cloneDeep, isEqual} from 'hash'
import {collectActivatables} from './activation'
import {compose} from 'compose'
import {connect} from 'store'
import {withActivationContext} from './activationContext'
import PropTypes from 'prop-types'
import React from 'react'
import _ from 'lodash'
import actionBuilder from 'action-builder'
import diff from 'deep-diff'

const mapStateToProps = (state, ownProps) => {
    const {activationContext: {pathList}} = ownProps
    const activatables = collectActivatables(state, pathList)
    return {activatables}
}

class _Activator extends React.Component {
    shouldComponentUpdate({activatables: prevActivatables}) {
        const {activatables} = this.props
        if (isEqual(activatables, prevActivatables)) {
            if (this.props.id === 'mapInfo') {
                console.log('Activator skipped rerendering:', this.props.id || this.props.ids)
            }
            return false
        } else {
            if (this.props.id === 'mapInfo') {
                console.log('Activator rerendering:', this.props.id || this.props.ids, diff(prevActivatables, activatables))
            }
            return true
        }
    }

    render() {
        const {children} = this.props
        return children(this.getActivatorProps())
    }

    getActivatorProps() {
        const {id, ids, activatables, activationContext: {pathList}} = this.props
        if (id && ids) {
            throw Error('Cannot provide both id and ids props.')
        }

        const activatablePath = id => activatables[id].path

        const activate = (id, activationProps) =>
            actionBuilder('ACTIVATE', {id, pathList})
                .assign(activatablePath(id), {
                    active: true,
                    justActivated: true,
                    activationProps
                })
                .dispatch()

        const deactivate = id =>
            actionBuilder('DEACTIVATE', {id, pathList})
                .assign(activatablePath(id), {
                    active: false,
                    justActivated: false
                })
                .dispatch()

        const isActive = id => activatables[id]?.active

        const canActivate = id => activationAllowed(id, activatables)

        const updateActivatables = updates => {
            const updatedActivatables = _.transform(updates, (activatables, {id, active}) => {
                const activatable = activatables[id]
                if (!activatable || activatable.active !== active) {
                    const updatedActive = active && activationAllowed(id, activatables)
                    activatable.active = updatedActive
                    activatable.justActivated = updatedActive
                }
            }, cloneDeep(activatables))
            if (!isEqual(updatedActivatables, activatables)) {
                actionBuilder('UPDATE_ACTIVATABLES', {pathList})
                    .set([pathList, 'activatables'], updatedActivatables)
                    .dispatch()
            }
        }

        const props = id => ({
            active: isActive(id),
            canActivate: canActivate(id),
            activate: activationProps => canActivate(id) && activate(id, activationProps),
            deactivate: () => isActive(id) && deactivate(id)
        })

        return id
            ? props(id)
            : {
                activatables: _(activatables)
                    .keys()
                    .filter(activatableId => _.isEmpty(ids) || ids.includes(activatableId))
                    .transform((acc, id) => acc[id] = props(id), {})
                    .value(),
                updateActivatables
            }
    }
}

export const Activator = compose(
    _Activator,
    connect(mapStateToProps),
    withActivationContext()
)

Activator.propTypes = {
    children: PropTypes.func.isRequired,
    id: PropTypes.string,
    ids: PropTypes.array
}

export const activator = (...ids) =>
    WrappedComponent =>
        class ActivatorHoc extends React.Component {
            constructor() {
                super()
                this.renderActivator = this.renderActivator.bind(this)
            }

            render() {
                return (
                    <Activator ids={ids}>
                        {this.renderActivator}
                    </Activator>
                )
            }

            renderActivator(activator) {
                return React.createElement(WrappedComponent, {activator, ...this.props})
            }
        }
