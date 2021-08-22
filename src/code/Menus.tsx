import React from "react";
import { Menu, MenuItem, Popover, TextField } from "@material-ui/core";
import classnames from "classnames";
import UIState from "UIState";
import { inject, observer } from "mobx-react";

export interface MenuAction {
    title: string
    action: () => void
    divider?: boolean
}

export interface ActiveBlockProps {
    name?: string
    inline?: boolean
    children: React.ReactNode
    items: MenuAction[]
    state?: UIState
}

export const ActiveBlock = inject('state')(observer(({ inline, children, items, name, state }: ActiveBlockProps) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const [active, setActive] = React.useState<boolean>(false);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        setAnchorEl(event.currentTarget)
        state!.setMenuOpen(true)
    };

    const handleClose = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        setAnchorEl(null)
        state!.setMenuOpen(false)
    };

    const handleSelect = (event: React.MouseEvent, item: MenuAction) => {
        event.stopPropagation()
        setAnchorEl(null)
        state!.setMenuOpen(false)
        item.action()
    }

    const mouseOver = (event: React.MouseEvent<HTMLSpanElement>) => {
        if (state!.menuOpen) {
            return
        }
        event.stopPropagation()
        setActive(true)
    }
    const mouseOut = (event: React.MouseEvent<HTMLSpanElement>) => {
        if (state!.menuOpen) {
            return
        }
        event.stopPropagation()
        setActive(false)
    }

    const open = Boolean(anchorEl);

    const menu = <Menu
        id="menu"
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
        }}
    >
        {items.map((item) => <MenuItem key={item.title} divider={item.divider} onClick={(event) => handleSelect(event, item)}>{item.title}</MenuItem>)}
    </Menu>

    if (inline) {
        return <>
            <span onClick={handleClick} onMouseOver={mouseOver} onMouseOut={mouseOut} className={classnames({ curconstruct: active })}>
                {children}
            </span>
            {menu}
        </>
    } else {
        return <>
            <div onClick={handleClick} onMouseOver={mouseOver} onMouseOut={mouseOut} className={classnames({ curconstruct: active })}>
                {children}
            </div>
            {menu}
        </>
    }
}))


export interface NameEditorProps {
    name: string
    onSet: (s: string) => void
}

export const NameEditor = ({ name, onSet }: NameEditorProps) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLSpanElement | null>(null);
    const [contents, setContents] = React.useState<string>(name)

    const handleClick = (event: React.MouseEvent<HTMLSpanElement>) => {
        event.stopPropagation()
        setAnchorEl(event.currentTarget)
    };

    const handleSet = () => {
        setAnchorEl(null);
        onSet(contents)
    }

    const handleClose = (event: any) => {
        event.stopPropagation()
        event.preventDefault()
        handleSet()
    }

    const open = Boolean(anchorEl);
    return <>
        <span onClick={handleClick} className="actionable">
            {name}
        </span>
        <Popover
            id="edit-name"
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <form onSubmit={handleClose}>
                <TextField autoFocus={true} onChange={(e) => setContents(e.target.value)} onSubmit={handleSet} value={contents} />
            </form>
        </Popover>
    </>
}