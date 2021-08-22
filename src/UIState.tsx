import { action, observable } from "mobx";
import { Construct, Program } from "environment/Program";
import { Field } from "environment/Field";

export default class UIState {
    @observable program: Program = new Program();
    @observable field: Field = new Field();
    @observable current?: Construct
    @observable menuOpen: boolean = false

    @action.bound
    setMenuOpen(open: boolean) {
        this.menuOpen = open
    }
}