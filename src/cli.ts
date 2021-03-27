#!/usr/bin/env node

import arg from 'arg';
import { flatten, uniqBy } from 'lodash';

export function cli(args) {
  const options = parseArgumentsIntoOptions(args);
  const debug = options.debug || false;
  if (debug) console.log(args);
  const homedir = require('os').homedir();
  const bcupFile = options.bcupPath || `${homedir}/.bcup-cli/vault.bcup`;

  const { Vault, FileDatasource, Credentials, init, Search } = require('buttercup');
  const clipboardy = require('clipboardy');
  const prompt = require('prompt-sync')();
  const password = prompt('Vault password: ', { echo: '*' })

  init();
  const datasourceCredentials = Credentials.fromDatasource({
    path: bcupFile
  }, password)
  const fileDatasource = new FileDatasource(datasourceCredentials);

  const credentials = Credentials.fromPassword(password);

  let num;
  let entries;
  try {
    fileDatasource
      .load(credentials)
      .then(({ format, history }) => Vault.createFromHistory(history, format))
      .then(vault => {
        do {
          console.log("\n");
          const titleSearch = prompt('Search text in folder or title. You can use RegExp: ')
          const re = new RegExp(titleSearch, 'ig');
          entries = vault.findEntriesByProperty('title', re);
          const groups = vault.findGroupsByTitle(re);
          const groupEntries = groups.map(group => group.getEntries());
          entries = flatten(groupEntries).concat(entries);
          if (debug) console.log(entries);
          entries = uniqBy(entries, entry => entry.id);
          console.log('0 exit');
          entries.forEach((entry, idx) => {
              const title = emphSearch(entry.getProperty('title'), re);
              const username = entry.getProperty('username');
              const url = entry.getProperty('URL');
              const group = emphSearch(entry.getGroup().getTitle(), re);
              console.log(`${idx + 1} ${group} / ${title} | url: ${url} | username: ${username}`);
          });

          console.log("\n");
          num = prompt('Select entry to copy or enter for search again: ')
          if (debug) console.log('num: "'+ num + '"');
          if (num === '0') return;
          if (num === '') continue;
          const pass = entries[num - 1].getProperty('password');
          clipboardy.writeSync(pass);
        } while (true)
      });
    }
    catch(error) {
      console.error(error);
    }
}

function emphSearch(string, re) {
  const chalk = require('chalk');

  let res;
  let newString = string;
  while ((res = re.exec(string)) !== null) {
    newString = newString.slice(0, res.index) + chalk.red(res[0]) + newString.slice(res.index + res[0].length)
  }
  return newString;
}

function parseArgumentsIntoOptions(rawArgs) {
 const args = arg(
   {
     '--debug': Boolean,
     '--bcup-path': String,
     '-d': '--debug',
     '-b': '--bcup-path',
   },
   {
     argv: rawArgs.slice(2),
   }
 );
 return {
   debug: args['--debug'] || false,
   bcupPath: args['--bcup-path'],
 };
}
