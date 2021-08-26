import { action, computed, observable } from "mobx";
import { Construct, Program } from "environment/Program";
import { Field } from "environment/Field";

export interface Coordinates {
    x: number
    y: number
}

export class Environment {
    @observable.ref program: Program = new Program();
    @observable field: Field = new Field();
    @observable.ref current?: Construct
    @observable robot?: Coordinates
}

export default class UIState {
    @observable program: Program = new Program();
    @observable field: Field = new Field();
    @observable menuOpen: boolean = false
    @observable robot?: Coordinates

    @observable env?: Environment

    @computed
    get running() {return !!this.env}

    @computed
    get current() {
        return this.env?.current
    }

    @computed
    get goodToGo(): boolean {
        return this.program.goodToGo() && !!this.robot
    }

    @action.bound
    setMenuOpen(open: boolean) {
        this.menuOpen = open
    }

    @action.bound
    setRobot(coords?: Coordinates) {
        this.robot = coords
    }

    @action.bound
    start() {
        this.env = new Environment()
        this.env.field = this.field.clone()
        this.env.program = this.program
        this.env.robot = this.robot
    }

    @action.bound
    stop() {
        this.env = undefined
    }

}