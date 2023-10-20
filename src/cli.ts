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
  const prompt = require('prompt-sync')({
    history: require('prompt-sync-history')() //open history file
  });

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
  let titleSearch;
  let promptText;
  try {
    fileDatasource
      .load(credentials)
      .then(({ format, history }) => Vault.createFromHistory(history, format))
      .then(vault => {
        do {
          console.log("\n");
          promptText = `Search text in folder or title. You can use RegExp (${titleSearch}): `
          titleSearch = prompt(promptText, titleSearch);
          prompt.history.save();
          const re = new RegExp(titleSearch, 'i');
          entries = vault.findEntriesByProperty('title', re);
          const groups = vault.findGroupsByTitle(re);
          const groupEntries = groups.map(group => group.getEntries());
          entries = flatten(groupEntries).concat(entries);
          if (debug) console.log(entries);
          entries = uniqBy(entries, entry => entry.id);
          console.log('0 exit');
          entries.forEach((entry, idx) => {
              const title = emphSearch(entry.getProperty('title'), titleSearch);
              const username = entry.getProperty('username');
              const url = entry.getProperty('URL');
              const group = emphSearch(entry.getGroup().getTitle(), titleSearch);
              const sep = ` ${chalk.bold('|')} `
              console.log(`${idx + 1} ${group}${chalk.bold('->')}${title}${sep}url: ${url}${sep}username: ${username}`);
          });

          console.log("\n");
          do {
            num = prompt('Select entry to copy or press enter to search again: ')
            if (debug) console.log('num: "'+ num + '"');
            if (invalidSelection(num, entries.length)) {
              console.log(`wrong selection (0-${entries.length})`)
            }
            if (num === '0') return;
          } while (invalidSelection(num, entries.length))
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

function invalidSelection(num, max) {
  return num == undefined || (num.length > 0 && (!num.match(/\d+/) || num > max || num < 0))
}

function emphSearch(string, titleSearch) {
  const chalk = require('chalk');
  const re = new RegExp(titleSearch, 'ig');

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
