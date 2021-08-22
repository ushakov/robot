import React from "react";
import { inject, observer } from "mobx-react";

import UIState from "UIState";

@inject('state')
@observer
export class FieldD extends React.Component<{ state?: UIState }, {}>{
    render() {
        return <div> field </div>
    }
}