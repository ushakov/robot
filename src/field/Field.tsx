import React from "react";
import { inject, observer } from "mobx-react";

import UIState from "UIState";
import classnames from "classnames";
import { LocalTaxi } from "@material-ui/icons";

@inject('state')
@observer
export class FieldD extends React.Component<{ state?: UIState }, {}>{
    render() {
        const { field } = this.props.state!
        let rows: React.ReactNode[] = []
        for (let y = 0; y < field.ysize; y++) {
            rows.push(<FieldHWallRow key={`hw-${y}`} y={y} />)
            rows.push(<FieldRow key={`r-${y}`} y={y} />)
        }
        rows.push(<FieldHWallRow key={`hw-bottom`} y={field.ysize} />)
        return <div className="field-wrapper">
            <div className="field-container">
                {rows}
            </div>
        </div>

    }
}

@inject('state')
@observer
class FieldRow extends React.Component<{ state?: UIState, y: number }, {}> {
    render() {
        const { field } = this.props.state!
        const { y } = this.props
        let r: React.ReactNode[] = []
        for (let x = 0; x < field.xsize; x++) {
            r.push(<FieldVWall key={`ww-${x}-${y}`} x={x} y={y} />)
            r.push(<FieldCell key={`c-${x}-${y}`} x={x} y={y} />)
        }
        r.push(<div key={`ew-${y}`} className={classnames('field-vwall', 'wall-present')} />)
        return <div className="field-row">
            {r}
        </div>
    }
}

@inject('state')
@observer
class FieldVWall extends React.Component<{ state?: UIState, x: number, y: number }, {}> {
    onClick = (e: React.MouseEvent) => {
        const { field } = this.props.state!
        const { x, y } = this.props
        e.stopPropagation()
        field.setWallW(x, y, field.canW(x, y))
    }

    render() {
        const { field, running } = this.props.state!
        const { x, y } = this.props
        return <div
            className={classnames('field-vwall', { 'wall-present': !field.canW(x, y), 'f-active': !running })}
            onClick={running ? undefined : this.onClick}
        />
    }
}

@inject('state')
@observer
class FieldCell extends React.Component<{ state?: UIState, x: number, y: number }, {}> {
    onClick = (e: React.MouseEvent) => {
        const { field } = this.props.state!
        const { x, y } = this.props
        e.stopPropagation()
        field.setPainted(x, y, !field.painted[x][y])
    }

    setRobot = (e: React.MouseEvent) => {
        const { setRobot } = this.props.state!
        const { x, y } = this.props
        e.stopPropagation()
        e.preventDefault()
        setRobot({ x, y })
    }

    render() {
        const { field, robot, running } = this.props.state!
        const { x, y } = this.props
        const inner = robot?.x === x && robot?.y === y ? <LocalTaxi fontSize="medium" /> : null
        return <div
            key={`c-${x}-${y}`}
            className={classnames('field-cell', { 'field-cell-painted': field.painted[x][y], 'f-active': !running })}
            onClick={running ? undefined : this.onClick}
            onDoubleClick={running ? undefined : this.setRobot}>
            {inner}
        </div>
    }
}


@inject('state')
@observer
class FieldHWallRow extends React.Component<{ state?: UIState, y: number }, {}> {
    render() {
        const { field } = this.props.state!
        const { y } = this.props
        let r: React.ReactNode[] = []
        for (let x = 0; x < field.xsize; x++) {
            let knot = field.knot(x, y)
            r.push(<div key={`kn-${x}-${y}`} className={classnames('field-hwall-knot', { 'wall-present': knot })} />)
            r.push(<FieldHWall key={`nw-${x}-${y}`} x={x} y={y} />)
        }
        r.push(<div key={`knl-${y}`} className={classnames('field-hwall-knot', 'wall-present')} />)
        return <div className="field-hwall">
            {r}
        </div>
    }
}

@inject('state')
@observer
class FieldHWall extends React.Component<{ state?: UIState, x: number, y: number }, {}> {
    onClick = (e: React.MouseEvent) => {
        const { field } = this.props.state!
        const { x, y } = this.props
        e.stopPropagation()
        field.setWallN(x, y, field.canN(x, y))
    }
    render() {
        const { field, running } = this.props.state!
        const { x, y } = this.props
        return <div
            className={classnames('field-hwall-cell', { 'wall-present': !field.canN(x, y), 'f-active': !running })}
            onClick={running ? undefined : this.onClick}
        />
    }
}