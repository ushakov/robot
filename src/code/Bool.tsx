import React from "react";
import { observer } from "mobx-react";

import { ActiveBlock, MenuAction } from "code/Menus";
import { BoolExpr, BoolOp, BoolOp_arity } from "environment/Machine";
import { Keyword } from "code/common";


type BoolExprSetter = (exp?: BoolExpr) => void

const getBoolMenu = (f) => {
    let ret: MenuAction[] = []
    Object.keys(BoolOp).forEach((op) => {
        ret.push({
            title: BoolOp[op],
            action: () => f(new BoolExpr({ op: BoolOp[op] }))
        })
    })
    ret[4].divider = true
    return ret
}

@observer
export class EmptyBoolExprD extends React.Component<{ onSet: BoolExprSetter }, any> {
    onClick = (exp?: BoolExpr) => {
        this.props.onSet(exp)
    }

    render() {
        const items = getBoolMenu(this.onClick);
        return <ActiveBlock inline items={items}>[...]</ActiveBlock>;
    }
}


@observer
export class BoolExprD extends React.Component<{ expr?: BoolExpr, onSet: BoolExprSetter }, any> {
    render() {
        const { expr, onSet } = this.props;
        if (!expr) {
            return <EmptyBoolExprD onSet={onSet} />
        }
        const arity = BoolOp_arity(expr.op);
        return <>
            {arity === 2 && <BoolExprD key={0} expr={expr.left} onSet={expr.setLeft} />}
            <BoolOpD op={expr.op} onSet={onSet} />
            {arity !== 0 && <BoolExprD key={1} expr={expr.right} onSet={expr.setRight} />}
        </>;
    }
}

@observer
export class BoolOpD extends React.Component<{ op: BoolOp, onSet: BoolExprSetter }, {}> {
    onClick = (exp: BoolExpr) => {
        this.props.onSet(exp)
    }

    render() {
        const { op, onSet } = this.props;
        const items = getBoolMenu(this.onClick);
        items[items.length - 1].divider = true
        items.push({
            title: 'Удалить',
            action: () => onSet(undefined)
        })
        if (BoolOp_arity(op) !== 0) {
            return <ActiveBlock inline items={items}> <Keyword word={op} /> </ActiveBlock>;
        }
        return <ActiveBlock inline items={items}>{op}</ActiveBlock>;
    }
}
