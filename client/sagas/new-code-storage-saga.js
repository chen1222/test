import { Observable } from 'rx';
import store from 'store';

import { removeCodeUri, getCodeUri } from '../utils/code-uri';
import { ofType } from '../../common/utils/get-actions-of-type';
import { updateContents } from '../../common/utils/polyvinyl';
import combineSagas from '../../common/utils/combine-sagas';

import { userSelector } from '../../common/app/redux/selectors';
import { makeToast } from '../../common/app/toasts/redux/actions';
import types from '../../common/app/routes/challenges/redux/types';
import {
  savedCodeFound,
  updateMain,
  lockUntrustedCode
} from '../../common/app/routes/challenges/redux/actions';
import {
  challengeSelector
} from '../../common/app/routes/challenges/redux/selectors';

const legacyPrefixes = [
  'Bonfire: ',
  'Waypoint: ',
  'Zipline: ',
  'Basejump: ',
  'Checkpoint: '
];
const legacyPostfix = 'Val';

function getCode(id) {
  if (store.has(id)) {
    return store.get(id);
  }
  return null;
}

function getLegacyCode(legacy) {
  const key = legacy + legacyPostfix;
  let code = null;
  if (store.has(key)) {
    code = '' + store.get(key);
    store.remove(key);
    return code;
  }
  return legacyPrefixes.reduce((code, prefix) => {
    if (code) {
      return code;
    }
    return store.get(prefix + key);
  }, null);
}

function legacyToFile(code, files, key) {
  return { [key]: updateContents(code, files[key]) };
}

export function clearCodeSaga(actions, getState) {
  return actions
    ::ofType(types.clearSavedCode)
    .map(() => {
      const { challengesApp: { id = '' } } = getState();
      store.remove(id);
      return null;
    });
}
export function saveCodeSaga(actions, getState) {
  return actions
    ::ofType(types.saveCode)
    // do not save challenge if code is locked
    .filter(() => !getState().challengesApp.isCodeLocked)
    .map(() => {
      const { challengesApp: { id = '', files = {} } } = getState();
      store.set(id, files);
      return null;
    });
}

export function loadCodeSaga(actions, getState, { window, location }) {
  return actions
    ::ofType(types.loadCode)
    .flatMap(() => {
      return Observable.empty();
    });
}

export default combineSagas(saveCodeSaga, loadCodeSaga, clearCodeSaga);
