import classNames from "classnames";
import { Construct } from "environment/Program";
import { inject, observer } from "mobx-react";
import React from "react";
import UIState from "UIState";

export type LineProps = {
    state?: UIState
    highlightFor?: Construct
    unfinished?: boolean
    children: React.ReactNode
}

@inject('state')
@observer
export class Line extends React.Component<LineProps, {}> {
    render() {
        const { state, highlightFor, unfinished, children } = this.props;
        const current = state!.running && !state!.env!.exception && state!.env!.current && state!.env!.current === highlightFor
        const error = state!.running && state!.env!.exception && state!.env!.current && state!.env!.current === highlightFor
        return <div className={classNames("line", { current, error, 'unfinished-call': unfinished })}>
            {children}
        </div>
    }
}

