import classNames from "classnames";
import { observer } from "mobx-react";
import React from "react";

export type LineProps = {
    cur?: boolean
    unfinished?: boolean
    children: React.ReactNode
}

@observer
export class Line extends React.Component<LineProps, {}> {
    render() {
        const { cur, unfinished, children } = this.props;
        return <div className={classNames("line", { current: cur, 'unfinished-call': unfinished })}>
            {children}
        </div>
    }
}

