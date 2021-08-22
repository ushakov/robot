import { BoolExpr, Action, BoolOp } from "environment/Machine";
import { observable, action } from "mobx";
import { AssertionError } from "assert";


class ErrIncomplete implements Error {
    name: string;
    message: string;
    stack?: string | undefined;

    constructor(line: number) {
        this.name = 'Incomplete program';
        this.message = `at line ${line}`;
    }
}

export interface CompOp {
    srcLine: number;

    do(environment: Environment): number;
}

export class Environment {
    @observable program: CompOp[] = [];
    @observable current: number = 0;

    stack: number[] = [];

    evaluate(expr: BoolExpr): boolean {
        switch (expr.op) {
            case BoolOp.CAN_N:
            case BoolOp.CAN_S:
            case BoolOp.CAN_E:
            case BoolOp.CAN_W:
            case BoolOp.PAINTED:
                return this.evaluateOp(expr.op);
            case BoolOp.NOT:
                if (expr.left === undefined) {
                    throw new ErrIncomplete(this.program[this.current].srcLine);
                }
                return !this.evaluate(expr.left);
            case BoolOp.AND:
                if (expr.left === undefined || expr.right === undefined) {
                    throw new ErrIncomplete(this.program[this.current].srcLine);
                }
                return this.evaluate(expr.left) && this.evaluate(expr.right);
            case BoolOp.OR:
                if (expr.left === undefined || expr.right === undefined) {
                    throw new ErrIncomplete(this.program[this.current].srcLine);
                }
                return this.evaluate(expr.left) || this.evaluate(expr.right);
            case undefined:
                throw new ErrIncomplete(this.program[this.current].srcLine);

        }
    }

    evaluateOp(op: BoolOp): boolean {
        return true;
    }

    push() {
        this.stack.push(this.current + 1);
    }

    pop(): number {
        if (this.stack.length === 0) {
            throw new AssertionError();
        }
        return this.stack.pop()!;
    }

    @action
    execute(act: Action) {
        throw new Error("not implemented");
    }

    @action
    step() {
        if (this.current < 0 || this.current >= this.program.length) {
            throw new AssertionError();
        }

        const ret = this.program[this.current].do(this);
        if (ret !== -1) {
            this.current = ret;
        } else {
            this.current++;
        }
    }
}

const Continue = -1;

export class IfOp implements CompOp {
    srcLine: number = -1;
    cond?: BoolExpr = undefined;
    where: number = -1;

    constructor(init: { srcLine: number, cond: BoolExpr, where?: number }) {
        Object.assign(this, init);
    }

    do(environment: Environment): number {
        if (!this.cond) {
            throw new ErrIncomplete(0);
        }
        if (environment.evaluate(this.cond)) {
            return this.where;
        }
        return Continue;
    }
}

export class JumpOp implements CompOp {
    srcLine: number = -1;
    where: number = -1;

    constructor(init: { srcLine: number, cond: BoolExpr, where?: number }) {
        Object.assign(this, init);
    }

    do(environment: Environment): number {
        return this.where;
    }
}

export class ActionOp implements CompOp {
    srcLine: number = -1;
    act: Action = Action.MOVE_E;

    constructor(init: { srcLine: number, act: Action }) {
        Object.assign(this, init);
    }

    do(environment: Environment): number {
        environment.execute(this.act);
        return Continue;
    }
}

export class CallOp implements CompOp {
    srcLine: number = -1;
    where: number = -1;

    constructor(init: { srcLine: number, where: number }) {
        Object.assign(this, init);
    }

    do(environment: Environment): number {
        environment.push();
        return this.where;
    }
}

export class ReturnOp implements CompOp {
    srcLine: number = -1;
    constructor(init: { srcLine: number }) {
        Object.assign(this, init);
    }

    do(environment: Environment): number {
        return environment.pop();
    }
}