import { action, computed, observable } from "mobx";
import { Construct, Program } from "environment/Program";
import { Field } from "environment/Field";
import { Coordinates, Environment } from "environment/Execution";


export default class UIState {
    @observable program: Program = new Program();
    @observable srcfield: Field = new Field();
    @observable srcrobot?: Coordinates
    @observable menuOpen: boolean = false
    @observable stepping: boolean = false

    @observable env?: Environment

    runInterval?: number

    @computed
    get running() { return !!this.env }

    @computed
    get field(): Field {
        if (this.running) {
            return this.env!.field
        }
        return this.srcfield
    }

    @computed
    get robot(): Coordinates | undefined {
        if (this.running) {
            return this.env!.robot
        }
        return this.srcrobot
    }

    @computed
    get current(): Construct | undefined {
        return this.env?.current
    }

    @computed
    get goodToGo(): boolean {
        return this.program.goodToGo() && !!this.srcrobot
    }

    @action.bound
    setMenuOpen(open: boolean) {
        this.menuOpen = open
    }

    @action.bound
    setRobot(coords?: Coordinates) {
        this.srcrobot = coords
    }

    prepExecution() {
        this.env = new Environment()
        this.env.field = this.srcfield.clone()
        this.env.program = this.program
        this.env.robot = { x: this.srcrobot!.x, y: this.srcrobot!.y }
        this.env.start()
    }

    @action.bound
    startStepping() {
        this.prepExecution()
        this.stepping = true
    }

    @action.bound
    start() {
        this.prepExecution()
        this.stepping = false
        this.runInterval = window.setInterval(() => {
            this.step()
        }, 400);
    }

    @action.bound
    stop() {
        this.env = undefined
        if (!this.stepping) {
            clearInterval(this.runInterval)
        }
        this.stepping = false
    }

    @action.bound
    step() {
        this.env!.step()
    }
}