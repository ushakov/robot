import React, { Component } from 'react';
import { observer, Provider } from 'mobx-react';
import { configure } from 'mobx';
import UIState from 'UIState';
import { MainProgram } from 'code/Code';
import 'styles.scss';
import { Grid, Paper } from '@material-ui/core';
import { ActionStatement, CallStatement, Def, LoopStatement } from 'environment/Program';
import { runInAction } from 'mobx';
import { Action, BoolExpr, BoolOp } from 'environment/Machine';
import { FieldD } from 'field/Field';

configure({ enforceActions: 'observed' });

let state = new UIState();

runInAction(() => {
  const main = [
    new CallStatement(),
    new ActionStatement(Action.PAINT),
  ];
  (main[0] as CallStatement).sub = 'идти на север'
  state.program.main.body.cmds = main

  const def = new Def()
  def.name = 'идти на север'
  state.program.defs.push(def)

  const loop = new LoopStatement()
  loop.cond = new BoolExpr({
    op: BoolOp.AND,
    left: new BoolExpr({
      op: BoolOp.CAN_N
    }),
    right: new BoolExpr({
      op: BoolOp.NOT,
      right: new BoolExpr({
        op: BoolOp.PAINTED
      })
    })
  });

  loop.body.cmds[0] = new ActionStatement(Action.MOVE_N)

  state.program.defs[0].body.cmds[0] = loop

})

@observer
export default class App extends Component<any, any> {
  render() {
    return <Provider state={state}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Paper className="program">
            <MainProgram />
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Paper className="field">
            <p>По клику строятся и разрушаются стены, а также закрашивается и очищается клетка. По двойному клику устанавливается позиция робота</p>
            <FieldD/>
          </Paper>
        </Grid>
      </Grid>
    </Provider>;
  }
}
