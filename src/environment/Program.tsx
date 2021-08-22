import { observable, action } from 'mobx';
import { Action, BoolExpr } from './Machine';

export class Construct {
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
}

export class ActionStatement extends Construct {
    @observable action: Action;

    constructor(action: Action) {
        super();
        this.action = action;
    }

}

export class CallStatement extends Construct {
    @observable sub?: string
    @observable unfinished: boolean;

    constructor() {
        super();
        this.unfinished = false;
    }

    @action.bound
    setName(s?: string) {
        this.sub = s
    }
}

export class IfPart {
    @observable cond?: BoolExpr
    @observable block: Block

    constructor() {
        this.block = new Block()
    }

    @action.bound
    setCond(c?: BoolExpr) {
        this.cond = c
    }
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
}
