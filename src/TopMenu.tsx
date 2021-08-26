import React from 'react';
import { inject, observer } from 'mobx-react';
import UIState from 'UIState';
import { Box, Button, ButtonProps } from '@material-ui/core';

const MenuButton = (props: ButtonProps) => {
    return <Box mx={1}>
        <Button {...props} />
    </Box>
}

@inject('state')
@observer
export class TopMenu extends React.Component<{ state?: UIState }, {}> {
    render() {
        const { start, stop, running } = this.props.state!
        return <Box display="flex" flexDirection="row">
            {!running && <MenuButton
                key="1"
                onClick={start}
                variant="contained"
                color="primary"
                disabled={!this.props.state!.goodToGo}>
                Старт!
            </MenuButton>}
            {running && <MenuButton
                key="2"
                onClick={stop}
                variant="contained">
                Стоп
            </MenuButton>}
        </Box>
    }
}