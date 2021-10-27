import {Layout} from './layout'
import Label from './label'
import PropTypes from 'prop-types'
import React from 'react'
import _ from 'lodash'
import styles from './buttonGroup.module.css'

const classNames = layout =>
    layout.split('-').map(className => styles[className])

export const ButtonGroup = ({className, layout, alignment, spacing, label, disabled, children}) => {
    const mapChild = (child, index, childrenCount) =>
        React.cloneElement(child, {
            joinLeft: index !== 0,
            joinRight: index !== childrenCount - 1
        })

    const mapChildren = children =>
        React.Children.map(children, (child, index) =>
            mapChild(child, index, children.length)
        )

    const buttons = (
        <div className={[
            styles.container,
            className
        ].join(' ')}>
            <div className={[
                styles.buttonGroup,
                ...classNames(layout),
                styles[`alignment-${alignment}`],
                styles[`spacing-${spacing}`]
            ].join(' ')}>
                {spacing === 'tight' ? mapChildren(children) : children}
            </div>
        </div>
    )

    return label
        ? (
            <Layout spacing={spacing}>
                <div>
                    <Label disabled={disabled}>{label}</Label>
                    {buttons}
                </div>
            </Layout>
        )
        : buttons
}

ButtonGroup.propTypes = {
    alignment: PropTypes.oneOf(['left', 'center', 'right', 'spaced', 'fill', 'distribute']),
    children: PropTypes.any,
    className: PropTypes.string,
    disabled: PropTypes.any,
    label: PropTypes.any,
    layout: PropTypes.oneOf(['horizontal-wrap', 'horizontal-nowrap', 'horizontal-nowrap-scroll', 'vertical']),
    spacing: PropTypes.oneOf(['normal', 'tight', 'loose'])
}

ButtonGroup.defaultProps = {
    alignment: 'left',
    layout: 'horizontal-wrap',
    spacing: 'normal'
}
