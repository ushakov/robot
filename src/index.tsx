import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import { createBrowserHistory } from 'history';
import { RouterStore, syncHistoryWithStore } from 'mobx-react-router';
import { Router } from 'react-router';
import App from './App';
import auth_config from './auth0_config.json'
import { AuthStore } from 'Auth';
import config from 'config.json';

const browserHistory = createBrowserHistory({
  basename: '/',
});
const routingStore = new RouterStore();
const history = syncHistoryWithStore(browserHistory, routingStore);

// A function that routes the user to the right place
// after login
const onRedirectCallback = appState => {
  history.push(
    appState && appState.targetUrl
      ? appState.targetUrl
      : window.location.pathname
  );
};

let authStore = new AuthStore({
  domain: auth_config.domain,
  client_id: auth_config.clientId,
  audience: auth_config.audience,
  redirect_uri: config.base,
}, onRedirectCallback)

authStore.initialize()


ReactDOM.render(
  <Provider routing={routingStore} auth={authStore}>
    <Router history={history}>
      <App />
    </Router>
  </Provider>,
  document.getElementById('root')
);
