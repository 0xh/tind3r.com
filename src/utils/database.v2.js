// @flow

import ForerunnerDB from 'forerunnerdb';
import { first } from 'lodash';

import { get } from './api';

import { parseMatch, parsePerson } from '../utils/parsers';

import type { MessageType } from '../types/message';
import type { MatchType } from '../types/match';
import type { PersonType } from '../types/person';

const fdb = new ForerunnerDB();
let db;

let matches;

export function load() {
  let loaded = 0;
  db = fdb.db('tind3r');

  window.db = db;

  return new Promise((resolve, reject) => {
    const checkIfLoaded = () => loaded === 4 ? resolve() : null;
    const loadedCallback = name => {
      loaded++;
      checkIfLoaded();
    }

    db.collection('matches').load(loadedCallback);
    db.collection('persons').load(loadedCallback);
    db.collection('messages').load(loadedCallback);
    db.collection('actions').load(loadedCallback);
  })
}

function create() {
  if (!db) {
    db = fdb.db('tind3r');
  }

  window.db = db;

  return db
}

export function matchCollection(): Array<MatchType> {
  const matches: Array<MatchType> = db.collection('matches').find({}, {
    $join: [{
      persons: {
        _id: 'person_id',
        $as: 'person',
        $require: false,
        $multi: false,
      }
    }]
  });

  matches.forEach(match => {
    const lastMessage: MessageType = db.collection('messages').find({
      match_id: match._id,
    }, {
      $limit: 1,
      $orderBy: {
        date: -1,
      },
    })[0];

    match.last_msg_from_db = lastMessage || {};
  });

  return matches;
}

export function getMessages(matchId: string): Array<MessageType> {
  const messages = db.collection('messages').find({
    match_id: matchId,
  });

  return messages;
}

export function getMatch(matchId: string): MatchType {
  return db.collection('matches').find({
    _id: matchId,
  })[0];
}

export function getPerson(personId: string): PersonType {
  return db.collection('persons').find({
    _id: personId,
  })[0];
}

export function createAction(payload: { person_id: string, action_type: string, date: string }) {
  db.collection('actions').insert(payload);
  db.collection('actions').save();
}

export function createMatch(match: Object) {
  const parsedMatch: MatchType = parseMatch(match, true);
  const parsedPerson: PersonType = parseMatch(match.person);

  createMatches([parsedMatch]);
  createPersons([parsedPerson]);
}

export function createPersons(persons: Array<PersonType>) {
  const collection = db.collection('persons');
  collection.insert(persons);
  collection.save();
}

export function createMatches(data: Array<MatchType>) {
  const collection = db.collection('matches');
  collection.insert(data);
  collection.save();
}

export function updateMatch(matchId: string, payload: Object) {
  console.log('update', matchId, payload)
  db.collection('matches').updateById(matchId, payload);
  db.collection('matches').save();
}

export function removeMessage(_id: string) {
  db.collection('messages').remove({ _id: _id });
  db.collection('messages').save();
}

export function removeMatch(_id: string) {
  const removedMatch = db.collection('matches').remove({ _id });
  db.collection('messages').remove({ match_id: _id });
  db.collection('persons').remove({ _id: removedMatch.person_id });

  db.collection('matches').save();
  db.collection('messages').save();
  db.collection('persons').save();
}

export default create;