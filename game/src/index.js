import React from 'react';
import ReactDOM from 'react-dom';
import Button from 'react-bootstrap/Button'
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import Setup from './components/Setup';
import Join from './components/Join';
import GameScreen from './GameScreen';
import Home from './components/Home';
import { Route, Link, BrowserRouter as Router } from 'react-router-dom';

const routing = (
    <Router>
      <div>
        <Route exact path="/" component={Home} />
        <Route path="/newgame" component={Setup} />
        <Route path="/joingame" component={Join} />
        <Route path="/game" component={GameScreen} />
      </div>
    </Router>
  )
  ReactDOM.render(routing, document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
