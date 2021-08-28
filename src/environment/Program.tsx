import { observable, action } from 'mobx';
import { Action, BoolOp } from 'environment/Machine';

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
