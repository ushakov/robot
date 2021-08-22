import React from "react";
import { observer } from "mobx-react";


@observer
export class Keyword extends React.Component<{ word: string }, any> {
    render() {
        const { word } = this.props;
        return <span className="keyword">{word}</span>;
    }
}
