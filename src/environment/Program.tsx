import { observable, action } from 'mobx';
import { Action, BoolOp } from 'environment/Machine';
import { BlockSharp } from '@material-ui/icons';

export class Construct {
    goodToGo = () => false
}

export class Block {
    @observable cmds: (Construct | undefined)[]

    constructor() {
        this.cmds = [undefined]
    }

    @action.bound
    add(n: number) {
        this.cmds = this.cmds.slice(0, n).concat(undefined, this.cmds.slice(n))
    }

    @action.bound
    remove(n: number) {
        this.cmds = this.cmds.slice(0, n).concat(this.cmds.slice(n + 1))
        if (this.cmds.length === 0) {
            this.cmds.push(undefined)
        }
    }

    @action.bound
    set(n: number, cmd?: Construct) {
        this.cmds[n] = cmd
    }

    setter = (n: number) => (cmd?: Construct) => this.set(n, cmd)

    goodToGo = () => {
        return this.cmds.every(cmd => cmd?.goodToGo())
    }
}

export class ActionStatement extends Construct {
    @observable action: Action;

    constructor(action: Action) {
        super();
        this.action = action;
    }

    goodToGo = () => true
}

export class CallStatement extends Construct {
    @observable.ref sub?: Def
    @observable unfinished: number;

    constructor() {
        super();
        this.unfinished = 0;
    }

    @action.bound
    setSub(s?: Def) {
        this.sub = s
    }

    @action.bound
    setUnfinished(u: boolean) {
        if (u) {
            this.unfinished++
        } else {
            this.unfinished--
        }
    }

    goodToGo = () => !!this.sub
}

export class IfPart extends Construct {
    @observable cond?: BoolExpr
    @observable block: Block

    constructor() {
        super()
        this.block = new Block()
    }

    @action.bound
    setCond(c?: BoolExpr) {
        this.cond = c
    }

    goodToGo = () => !!this.cond?.goodToGo() && this.block.goodToGo()
}

export class IfStatement extends Construct {
    @observable parts: IfPart[]
    @observable else?: Block

    constructor() {
        super()
        this.parts = [new IfPart()]
    }

    @action.bound
    add(n: number) {
        this.parts = this.parts.slice(0, n).concat(new IfPart(), this.parts.slice(n))
    }

    @action.bound
    remove(n: number) {
        this.parts = this.parts.slice(0, n).concat(this.parts.slice(n + 1))
        if (this.parts.length === 0) {
            this.parts.push(new IfPart())
        }
    }

    @action.bound
    setElse(block?: Block) {
        this.else = block
    }

    goodToGo = () => this.parts.every(part => part.goodToGo()) && (this.else === undefined || this.else.goodToGo())
}

export class LoopStatement extends Construct {
    @observable cond?: BoolExpr;
    @observable body: Block

    constructor() {
        super();
        this.body = new Block()
    }

    @action.bound
    setCond(e?: BoolExpr) {
        this.cond = e
    }

    goodToGo = () => !!this.cond?.goodToGo() && this.body.goodToGo()
}

export class Def extends Construct {
    @observable name?: string
    @observable body: Block

    constructor() {
        super();
        this.body = new Block()
    }

    @action.bound
    setName(s: string): void {
        this.name = s
    }

    goodToGo = () => !!this.name && this.body.goodToGo()
}

export class Program {
    @observable defs: Def[] = []
    @observable main: Def

    constructor() {
        this.main = new Def()
        this.main.name = 'программа'
    }

    @action.bound
    removeDef(n: number): void {
        this.defs = this.defs.slice(0, n).concat(this.defs.slice(n + 1))
    }

    @action.bound
    addDef(n: number): void {
        this.defs = this.defs.slice(0, n).concat(new Def(), this.defs.slice(n))
    }

    goodToGo = () => this.defs.every(d => d.goodToGo()) && this.main.goodToGo()
}

export class BoolExpr {
    @observable op: BoolOp;
    @observable left?: BoolExpr;
    @observable right?: BoolExpr;

    constructor(init: { op: BoolOp, left?: BoolExpr, right?: BoolExpr }) {
        this.op = BoolOp.PAINTED; // to make compiler happy; would be definitely overriden on the next line
        Object.assign(this, init);
    }

    @action.bound
    setLeft(e?: BoolExpr) {
        this.left = e
    }

    @action.bound
    setRight(e?: BoolExpr) {
        this.right = e
    }
    goodToGo = () => {
        switch (this.op) {
            case BoolOp.CAN_E:
            case BoolOp.CAN_S:
            case BoolOp.CAN_N:
            case BoolOp.CAN_W:
            case BoolOp.PAINTED:
                return true
            case BoolOp.AND:
            case BoolOp.OR:
                return !!this.left?.goodToGo() && !!this.right?.goodToGo()
            case BoolOp.NOT:
                return !!this.right?.goodToGo()
        }
    }
}

enum Types {
    Action = 'action',
    Cond = 'cond',
    Loop = 'loop',
    Call = 'call',
    Def = 'def',
    IfPart = 'ifpart',
}

const serializeConstruct = (cns: Construct): Object => {
    if (cns instanceof ActionStatement) {
        return {
            type: Types.Action,
            action: cns.action
        }
    }
    if (cns instanceof IfStatement) {
        return {
            type: Types.Cond,
            parts: cns.parts.map(part => serializeConstruct(part)),
            else: cns.else?.cmds.map(c => c && serializeConstruct(c))
        }
    }
    if (cns instanceof IfPart) {
        return {
            type: Types.IfPart,
            cond: cns.cond && serializeBoolExpr(cns.cond),
            block: cns.block.cmds.map(c => c && serializeConstruct(c))
        }
    }
    if (cns instanceof LoopStatement) {
        return {
            type: Types.Loop,
            cond: cns.cond && serializeBoolExpr(cns.cond),
            body: cns.body.cmds.map(c => c && serializeConstruct(c))
        }
    }
    if (cns instanceof CallStatement) {
        return {
            type: Types.Call,
            sub: cns.sub?.name
        }
    }
    if (cns instanceof Def) {
        return {
            type: Types.Def,
            name: cns.name,
            body: cns.body.cmds.map(c => c && serializeConstruct(c))
        }
    }
    throw new Error(`Unknown construct type ${cns.constructor.name}`)
}

export function SerializeProgram(p: Program): Object {
    return {
        main: serializeConstruct(p.main),
        defs: p.defs.map(d => serializeConstruct(d))
    }
}

const serializeBoolExpr = (exp: BoolExpr): Object => {
    return {
        op: exp.op,
        left: exp.left && serializeBoolExpr(exp.left),
        right: exp.right && serializeBoolExpr(exp.right)
    }
}

const deserializeBoolExpr = (a: any): BoolExpr => {
    return new BoolExpr({
        op: a.op,
        left: a.left && deserializeBoolExpr(a.left),
        right: a.right && deserializeBoolExpr(a.right)
    })
}

class UnresolvedCall extends Construct {
    name: string

    constructor(name: string) {
        super()
        this.name = name
    }
}

const deserializeConstruct = (ser: any): Construct | undefined => {
    if (!ser) return undefined
    switch (ser.type) {
        case Types.Action:
            return new ActionStatement(ser.action)
        case Types.Call:
            return new UnresolvedCall(ser.sub)
        case Types.Cond:
            {
                let cns = new IfStatement()
                cns.parts = ser.parts && ser.parts.map(p => deserializeConstruct(p))
                if (ser.else) {
                    cns.else = deserializeBlock(ser.else)
                }
                return cns
            }
        case Types.IfPart:
            {
                let cns = new IfPart()
                if (ser.cond) {
                    cns.cond = deserializeBoolExpr(ser.cond)
                }
                cns.block = deserializeBlock(ser.block)
                return cns
            }
        case Types.Def:
            {
                let cns = new Def()
                cns.name = ser.name
                cns.body = deserializeBlock(ser.body)
                return cns
            }
        case Types.Loop:
            {
                let cns = new LoopStatement()
                if (ser.cond) {
                    cns.cond = deserializeBoolExpr(ser.cond)
                }
                cns.body = deserializeBlock(ser.body)
                return cns
            }
    }
    throw new Error(`Unknown construct type ${ser.type}`)
}

function deserializeBlock(ser: any): Block {
    let b = new Block()
    b.cmds = ser.map(p => deserializeConstruct(p))
    return b
}

export function DeserializeProgram(ser: any): Program {
    let p = new Program()
    p.main = deserializeConstruct(ser.main) as Def
    p.defs = ser.defs.map(d => deserializeConstruct(d) as Def)

    let namemap = {}
    for (let i = 0; i < p.defs.length; i++) {
        const d = p.defs[i]
        if (!d.name) continue
        namemap[d.name] = d
    }

    [p.main, ...p.defs].forEach(d => resolveCalls(d.body, namemap))
    return p
}

function resolveCalls(blk: Block, namemap: Object) {
    for (let i = 0; i < blk.cmds.length; i++) {
        const cns = blk.cmds[i]
        if (cns instanceof UnresolvedCall) {
            const d = namemap[cns.name]
            const call = new CallStatement()
            call.sub = d
            blk.cmds[i] = call
        } else if (cns instanceof IfStatement) {
            cns.parts.forEach(p => resolveCalls(p.block, namemap))
            if (cns.else) {
                resolveCalls(cns.else, namemap)
            }
        } else if (cns instanceof LoopStatement) {
            resolveCalls(cns.body, namemap)
        }
    }
}
