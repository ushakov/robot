import React from "react";
import { observer, inject } from "mobx-react";

import { Def, Construct, ActionStatement, IfStatement, CallStatement, LoopStatement, IfPart, Block } from "environment/Program";
import { Action } from "environment/Machine";
import UIState from "UIState";
import { ActiveBlock, MenuAction, NameEditor } from "code/Menus";
import { Keyword } from "code/common";
import { BoolExprD } from "code/Bool";
import { Line } from "code/Line";

@inject('state')
@observer
export class MainProgram extends React.Component<{ state?: UIState }, any> {
    render() {
        const { program } = this.props.state!;
        return <>
            <DefD def={program.main} main={true} onAddAfter={() => program.addDef(0)} />
            {program.defs.map((def, n) => {
                return <DefD key={def.name || n} def={def} main={false} onDel={() => program.removeDef(n)} onAddAfter={() => program.addDef(n + 1)} />
            })}
        </>;
    }
}

@observer
export class DefD extends React.Component<{ def: Def, main: boolean, onDel?: () => void, onAddAfter: () => void }, any> {
    render() {
        const { def, main, onAddAfter } = this.props;
        const name = def.name ?? '[...]'
        const header = main ? 'программа' : 'подпрограмма'
        const onDel = main ? undefined : this.props.onDel!

        const actions: MenuAction[] = [];
        actions.push({ title: 'Добавить подпрограмму', action: onAddAfter })
        if (onDel) {
            actions.push({ title: 'Удалить подпрограмму', action: onDel })
        }

        return <ActiveBlock items={actions} name={`def ${name}`}>
            <Line><span className="keyword">{header}</span> <NameEditor name={name} onSet={def.setName} /></Line>
            <BlockD block={def.body} />
            <Line><span className="keyword">конец</span></Line>
        </ActiveBlock>
    }
}

@observer
export class BlockD extends React.Component<{ block: Block }, any> {
    render() {
        const { block } = this.props;

        const makeActions = (i: number) => {
            const actions: MenuAction[] = [
                { title: 'Добавить команду до', action: () => { block.add(i) } },
                { title: 'Добавить команду после', action: () => { block.add(i + 1) } },
                { title: 'Удалить команду', action: () => { block.remove(i) } }
            ]
            return actions
        }

        return <div className="indented">
            {block.cmds.map((cns, i) =>
                cns ?
                    <ActiveBlock key={i} items={makeActions(i)} name={cns.constructor.name}>
                        <ConstructD cns={cns} />
                    </ActiveBlock>
                    :
                    <EmptyStatementD key={i} onSet={block.setter(i)} onDel={() => block.remove(i)} />
            )}
        </div>;
    }
}

@inject('state')
@observer
class ConstructD extends React.Component<{ state?: UIState, cns: Construct }, {}> {
    render() {
        const { state, cns } = this.props
        const cur = state!.current === cns

        return <>
            {cns instanceof ActionStatement && <ActionStatementD current={cur} cns={cns} />}
            {cns instanceof CallStatement && <CallStatementD current={cur} cns={cns} />}
            {cns instanceof LoopStatement && <LoopStatementD current={cur} cns={cns} />}
            {cns instanceof IfStatement && <IfStatementD current={cur} cns={cns} />}
        </>
    }
}

@observer
class ActionStatementD extends React.Component<{ current: boolean, cns: ActionStatement }, {}> {
    render() {
        const { current, cns } = this.props;
        return <Line cur={current}>{cns.action}</Line>;
    }
}

@inject('state')
@observer
class CallStatementD extends React.Component<{ state?: UIState, current: boolean, cns: CallStatement }, {}> {
    render() {
        const alldefs = this.props.state!.program.defs
        let items: MenuAction[] = alldefs.filter((def) => !!def.name).map((def) => ({
            title: def.name!,
            action: () => { cns.setSub(def) }
        }))

        const { current, cns } = this.props;
        return <Line cur={current} unfinished={cns.unfinished}><Keyword word="выз" /> <ActiveBlock inline items={items}>{cns.sub?.name ?? '[...]'}</ActiveBlock></Line>;
    }
}

@observer
class LoopStatementD extends React.Component<{ current: boolean, cns: LoopStatement }, {}> {
    render() {
        const { current, cns } = this.props;
        return <>
            <Line cur={current} key={0}><Keyword word="пока" /> <BoolExprD expr={cns.cond} onSet={cns.setCond} /></Line>
            <BlockD block={cns.body} key={1} />
            <Line key={2}><Keyword word="кц" /></Line>
        </>;
    }
}

@observer
class IfPartD extends React.Component<{ part: IfPart, current: boolean }, {}> {
    render() {
        const { part, current } = this.props
        return <>
            <Line cur={current}><Keyword word="при условии" /> <BoolExprD expr={part.cond} onSet={part.setCond} /></Line>
            <BlockD block={part.block} />
            <Line><Keyword word="конец" /></Line>
        </>;
    }
}

@observer
class ElsePartD extends React.Component<{ part: Block }, {}> {
    render() {
        const { part } = this.props
        return <>
            <Line><Keyword word="иначе" /></Line>
            <BlockD block={part} />
            <Line><Keyword word="конец" /></Line>
        </>;
    }
}

@observer
class IfStatementD extends React.Component<{ current: boolean, cns: IfStatement }, {}> {
    render() {
        const { cns } = this.props;

        const makeActions = (i: number) => {
            const actions: MenuAction[] = [
                { title: 'Добавить условие до', action: () => { cns.add(i) } },
                { title: 'Добавить условие после', action: () => { cns.add(i + 1) } }
            ]
            if (!cns.else) {
                actions.push({ title: 'Добавить "иначе"', action: () => { cns.setElse(new Block()) } })
            }
            actions.push({ title: 'Удалить', action: () => { cns.remove(i) } })
            return actions
        }

        const elseActions: MenuAction[] = [
            { title: 'Удалить', action: () => { cns.setElse(undefined) } }
        ]

        let k = 0
        return <>
            <Line key={k++}><Keyword word="выбор" /></Line>
            <div className="indented">
                {cns.parts.map((part, i) => <ActiveBlock key={k++} items={makeActions(i)}>
                    <IfPartD part={part} current={false} />
                </ActiveBlock>
                )}
                {cns.else && <ActiveBlock items={elseActions}><ElsePartD key={k++} part={cns.else} /></ActiveBlock>}
            </div>
            <Line key={k++}><Keyword word="конец" /></Line>
        </>;
    }
}

@observer
export class EmptyStatementD extends React.Component<{ onSet: (cns?: Construct) => void, onDel: () => void }, any> {
    render() {
        const { onSet, onDel } = this.props
        let items: MenuAction[] = []
        Object.keys(Action).forEach((act) => {
            items.push({ title: Action[act], action: () => onSet(new ActionStatement(Action[act])) })
        })
        items[items.length - 1].divider = true
        items.push({ title: 'Команда выбора', action: () => onSet(new IfStatement()) })
        items.push({ title: 'Команда цикла', action: () => onSet(new LoopStatement()) })
        items.push({ title: 'Вызов подпрограммы', action: () => onSet(new CallStatement()), divider: true })
        items.push({ title: 'Удалить', action: onDel })

        return <ActiveBlock items={items} name={'empty'}><Line>[команда]</Line></ActiveBlock>
    }
}

