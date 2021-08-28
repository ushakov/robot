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
        const {
             start,
             startStepping,
             stop,
             step,
             running,
             stepping,
             env } = this.props.state!
        return <Box display="flex" flexDirection="row">
            {!running && <MenuButton
                key="1"
                onClick={start}
                variant="contained"
                color="primary"
                disabled={!this.props.state!.goodToGo}>
                Старт!
            </MenuButton>}
            {!running && <MenuButton
                key="2"
                onClick={startStepping}
                variant="contained"
                color="primary"
                disabled={!this.props.state!.goodToGo}>
                Старт по шагам
            </MenuButton>}
            {running && stepping && <MenuButton
                key="3"
                onClick={step}
                variant="contained">
                Шаг
            </MenuButton>}
            {running && <MenuButton
                key="4"
                onClick={stop}
                variant="contained">
                Стоп
            </MenuButton>}
            { running && env!.exception && <p key="5">Ошибка</p>}
            { running && env!.finished && <p key="6">Программа завершена</p>}
        </Box>
    }
}
