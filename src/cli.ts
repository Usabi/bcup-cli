#!/usr/bin/env node

import arg from 'arg';
import { flatten, uniqBy } from 'lodash';
import { name, version, description, author, license, repository } from '../package.json';

export function cli(args) {
  const options = parseArgumentsIntoOptions(args);
  const debug = options.debug || false;
  if (debug) console.log(args);
  const homedir = require('os').homedir();
  const bcupFile = options.bcupPath || `${homedir}/.bcup-cli/vault.bcup`;

  const { Vault, FileDatasource, Credentials, init, Search } = require('buttercup');
  const clipboardy = require('clipboardy');
  const chalk = require('chalk');
  const prompt = require('prompt-sync')();

  console.log(`= ${name} v${version} (${description}) =`);
  console.log(`author: ${author}`);
  console.log(`license: ${license}`);
  console.log(`repository: ${repository}\n`);

  const password = prompt('Vault password: ', { echo: '*' })
  if (password == undefined || password.length == 0) return

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
              const sep = ` ${chalk.bold('|')} `
              console.log(`${idx + 1} ${group}${chalk.bold('->')}${title}${sep}url: ${url}${sep}username: ${username}`);
          });

          console.log("\n");
          do {
            num = prompt('Select entry to copy or enter for search again: ')
            if (debug) console.log('num: "'+ num + '"');
            if (num == undefined || (num.length > 0 && (!num.match(/\d+/) || num > entries.length || num < 0))) {
              console.log(`wrong selection (0-${entries.length})`)
            }
            if (num === '0') return;
          } while (num == undefined || num.length > 0 && (!num.match(/\d+/) || num > entries.length || num < 0))
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
