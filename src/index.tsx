import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import createBrowserHistory from 'history/createBrowserHistory';
import { RouterStore, syncHistoryWithStore } from 'mobx-react-router';
import { Router } from 'react-router';
import App from './App';

const browserHistory = createBrowserHistory({
  basename: '/',
});
const routingStore = new RouterStore();
const history = syncHistoryWithStore(browserHistory, routingStore);

ReactDOM.render(
  <Provider routing={routingStore}>
    <Router history={history}>
      <App />
    </Router>
  </Provider>,
  document.getElementById('root')
);
