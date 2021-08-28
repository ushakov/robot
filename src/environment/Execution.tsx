import { action, observable } from "mobx";
import { Field } from "./Field"
import { Action, BoolOp } from "./Machine"
import { ActionStatement, Block, BoolExpr, CallStatement, Construct, Def, IfStatement, LoopStatement, Program } from "./Program"

export interface Coordinates {
    x: number
    y: number
}

export class Environment {
    @observable.ref program: Program = new Program();
    @observable field: Field = new Field();
    @observable robot?: Coordinates
    @observable.ref current?: Construct
    @observable exception: boolean = false
    @observable finished: boolean = false

    @observable stack: Executor[] = []

    @action
    start() {
        const ex = makeExecutor(this.program.main)
        this.stack.push(ex)
        this.prepareNextStep()
    }

    @action
    step() {
        if (this.finished) {
            return
        }
        const success = this.stack[this.stack.length-1].doStep(this)
        if (!success) {
            this.exception = true
            return
        }
        this.prepareNextStep()
    }

    @action
    prepareNextStep() {
        let done = false
        while (!done) {
            const nxt = this.stack[this.stack.length-1].prepareNextStep()
            if (nxt.finished) {
                this.stack.pop()
                if (this.stack.length === 0) {
                    this.current = undefined
                    this.finished = true
                    return
                }
            } else if (nxt.sub) {
                this.stack.push(nxt.sub)
            } else {
                done = true
            }
        }
        this.current = this.stack[this.stack.length-1].cns
    }

}

// Executor.prepareNextStep can have one of three outcomes:
// - ready to execute
// - I'm done, no more steps
// - I have this sub-Executor, ask them
interface NextStepResult {
    ready?: boolean
    finished?: boolean
    sub?: Executor
}

// Executor manages execution a certain Construct
class Executor {
    cns: Construct
    constructor(cns: Construct) {
        this.cns = cns
    }

    prepareNextStep(): NextStepResult { throw new Error("not implemented") }

    // true: step succeded
    // false: step failed, stop program
    doStep(env: Environment): boolean { throw new Error("not implemented") }
}

const makeExecutor = (cns: Construct): Executor => {
    if (cns instanceof ActionStatement) {
        return new ActionExecutor(cns)
    }
    if (cns instanceof CallStatement) {
        return new CallExecutor(cns)
    }
    if (cns instanceof IfStatement) {
        return new IfExecutor(cns)
    }
    if (cns instanceof LoopStatement) {
        return new LoopExecutor(cns)
    }
    if (cns instanceof Def) {
        return new DefExecutor(cns)
    }
    throw new Error(`unknown construct in makeExecutor: ${cns.constructor.name}`)
}

const evaluateBoolExpr = (exp: BoolExpr, env: Environment): boolean => {
    const { x, y } = env.robot!
    switch (exp.op) {
        case BoolOp.CAN_E:
            return env.field.canE(x, y)
        case BoolOp.CAN_W:
            return env.field.canW(x, y)
        case BoolOp.CAN_N:
            return env.field.canN(x, y)
        case BoolOp.CAN_S:
            return env.field.canS(x, y)
        case BoolOp.PAINTED:
            return env.field.painted[x][y]
        case BoolOp.NOT:
            return !evaluateBoolExpr(exp.right!, env)
        case BoolOp.OR:
            return evaluateBoolExpr(exp.left!, env) || evaluateBoolExpr(exp.right!, env)
        case BoolOp.AND:
            return evaluateBoolExpr(exp.left!, env) && evaluateBoolExpr(exp.right!, env)
    }
}

class ActionExecutor extends Executor {
    completed: boolean = false

    prepareNextStep(): NextStepResult {
        if (this.completed) {
            return { finished: true }
        }
        return { ready: true }
    }

    doStep(env: Environment): boolean {
        const act = this.cns as ActionStatement
        const { x, y } = env.robot!

        const testsAndResults = {
            [Action.MOVE_E]: { test: env.field.canE(x, y), res: () => { env.robot!.x++ } },
            [Action.MOVE_W]: { test: env.field.canW(x, y), res: () => { env.robot!.x-- } },
            [Action.MOVE_N]: { test: env.field.canN(x, y), res: () => { env.robot!.y-- } },
            [Action.MOVE_S]: { test: env.field.canS(x, y), res: () => { env.robot!.y++ } },
            [Action.PAINT]: { test: true, res: () => { env.field.setPainted(x, y, true) } },
        }

        this.completed = true
        if (testsAndResults[act.action].test) {
            testsAndResults[act.action].res()
            return true
        } else {
            return false
        }
    }
}

class BlockExecutor {
    block: Block
    cur: number

    constructor(block: Block) {
        this.block = block
        this.cur = 0
    }

    prepareNextStep(): NextStepResult {
        if (this.cur === this.block.cmds.length) {
            return { finished: true }
        }
        const ex = makeExecutor(this.block.cmds[this.cur]!)
        this.cur++
        return { sub: ex }
    }
}

class DefExecutor extends Executor {
    blockExecutor: BlockExecutor
    constructor(d: Def) {
        super(d)
        this.blockExecutor = new BlockExecutor(d.body)
    }

    prepareNextStep(): NextStepResult {
        return this.blockExecutor.prepareNextStep()
    }

    doStep(env: Environment): boolean {
        // Never actually called
        return false
    }
}

class CallExecutor extends Executor {
    callStarted: boolean = false
    def?: DefExecutor

    prepareNextStep(): NextStepResult {
        if (!this.def) {
            return { ready: true }
        }
        if (!this.callStarted) {
            (this.cns as CallStatement).setUnfinished(true)
            this.callStarted = true
            return { sub: this.def }
        }
        (this.cns as CallStatement).setUnfinished(false)
        return { finished: true }
    }

    doStep(env: Environment): boolean {
        this.def = new DefExecutor((this.cns as CallStatement).sub!)
        return true
    }
}

class LoopExecutor extends Executor {
    initial: boolean = true
    lastConditionCheck?: boolean
    blockExecutor?: BlockExecutor

    prepareNextStep(): NextStepResult {
        if (this.initial) {
            this.initial = false
            return { ready: true }
        }
        if (!this.lastConditionCheck) {
            return { finished: true }
        }
        const blockres = this.blockExecutor!.prepareNextStep()
        if (blockres.finished) {
            // next step is check condition
            return { ready: true }
        }
        return blockres
    }

    doStep(env: Environment): boolean {
        const ls = this.cns as LoopStatement
        this.lastConditionCheck = evaluateBoolExpr(ls.cond!, env)
        this.blockExecutor = new BlockExecutor(ls.body)
        return true
    }
}

class IfExecutor extends Executor {
    conditionsChecked: boolean = false
    selectedBranch?: BlockExecutor

    prepareNextStep(): NextStepResult {
        if (!this.conditionsChecked) {
            return { ready: true}
        }
        if (!this.selectedBranch) {
            return { finished: true }
        }
        return this.selectedBranch.prepareNextStep()
    }

    doStep(env: Environment): boolean {
        const op = this.cns as IfStatement
        this.selectedBranch = undefined
        for (let i = 0; i < op.parts.length; i++) {
            if (evaluateBoolExpr(op.parts[i].cond!, env)) {
                this.selectedBranch = new BlockExecutor(op.parts[i].block)
                break
            }
        }
        if (!this.selectedBranch && op.else) {
            this.selectedBranch = new BlockExecutor(op.else)
        }
        this.conditionsChecked = true
        return true
    }
}
