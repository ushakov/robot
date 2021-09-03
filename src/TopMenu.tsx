import React from 'react';
import { inject, observer } from 'mobx-react';
import UIState from 'UIState';
import { AppBar, Avatar, Box, Button, ButtonProps, IconButton, Paper, Toolbar } from '@material-ui/core';
import { SerializeProgram } from 'environment/Program';
import { AuthStore } from 'Auth';
import { ArrowBack } from '@material-ui/icons';

const MenuButton = (props: ButtonProps) => {
    return <Box mx={1}>
        <Button {...props} />
    </Box>
}

@inject('state')
@observer
export class EditorButtons extends React.Component<{ state?: UIState }, {}> {
    render() {
        const {
            start,
            startStepping,
            stop,
            step,
            running,
            stepping,
            env } = this.props.state!
        return <>
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
            {running && env!.exception && <Box key="5" alignSelf="center" className="error" p={1}>Ошибка</Box>}
            {running && env!.finished && <Box key="6"  alignSelf="center" className="current" p={1}>Программа завершена</Box>}
        </>
    }
}

@inject('state', 'auth')
@observer
export class TopMenu extends React.Component<{ state?: UIState, auth?: AuthStore }, {}> {
    render() {
        const auth = this.props.auth!
        return <Box display="flex" flexDirection="row" padding={1} alignItems="center">
            <Button variant="contained" color="primary" startIcon={<ArrowBack/>}>Назад</Button>
            <EditorButtons />
            <Box flexGrow="1" />
            {auth.user!.picture && <Avatar src={auth.user!.picture} />}
            <Button onClick={auth.logout}>Выйти</Button>
        </Box>
    }
}
