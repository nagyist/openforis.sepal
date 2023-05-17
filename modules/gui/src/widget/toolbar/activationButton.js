import {ToolbarButton} from './toolbarButton'
import {compose} from 'compose'
import {withActivators} from 'widget/activation/activator'
import PropTypes from 'prop-types'
import React from 'react'
import styles from './toolbar.module.css'

class _ActivationButton extends React.Component {
    render() {
        const {icon, label, tooltip, tooltipAllowedWhenDisabled, tooltipOnVisible, disabled, onClick, activator: {activatables: {button: {active, canActivate, toggle}}}} = this.props
        return (
            <ToolbarButton
                disabled={disabled || (!active && !canActivate)}
                selected={active}
                icon={icon}
                label={label}
                tooltip={active ? null : tooltip}
                tooltipAllowedWhenDisabled={tooltipAllowedWhenDisabled}
                tooltipOnVisible={tooltipOnVisible}
                className={[styles.activationButton, styles.panelButton, active ? styles.selected : null].join(' ')}
                onClick={e => {
                    toggle()
                    onClick && onClick(e)
                }}/>
        )
    }
}

export const ActivationButton = compose(
    _ActivationButton,
    withActivators({
        button: ({id}) => id
    })
)

ActivationButton.propTypes = {
    id: PropTypes.string.isRequired,
    disabled: PropTypes.any,
    icon: PropTypes.string,
    label: PropTypes.string,
    tooltip: PropTypes.any,
    tooltipAllowedWhenDisabled: PropTypes.any,
    tooltipOnVisible: PropTypes.func,
    onClick: PropTypes.func
}
