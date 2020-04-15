#!/usr/bin/env node

require('@buttercup/app-env/native');
import arg from 'arg';

export function cli(args) {
  const options = parseArgumentsIntoOptions(args);
  const debug = options.debug || false;
  if (debug) console.log(args);
  const homedir = require('os').homedir();
  const bcupFile = options.bcupPath || `${homedir}/.bcup-cli/vault.bcup`;

  const { Archive, Datasources, Credentials } = require('buttercup');
  const clipboardy = require('clipboardy');
  const prompt = require('prompt-sync')();

  const { FileDatasource } = Datasources;
  const fileDatasource = new FileDatasource(bcupFile);

  const password = prompt('Vault password: ', { echo: '*' })
  const credentials = Credentials.fromPassword(password);

  let num;
  try {
    fileDatasource
      .load(credentials)
      .then(Archive.createFromHistory)
      .then(archive => {
        do {
          const titleSearch = prompt('Title filter: ')
          const re = new RegExp(titleSearch, 'i');
          const entries = archive.findEntriesByProperty('title', re);
          entries.forEach((entry, idx) => {
              const title = entry.getProperty('title');
              const username = entry.getProperty('username');
              const url = entry.getProperty('URL');
              const group = entry.getGroup().getTitle();
              console.log(`${idx + 1} ${group} / ${title} | url: ${url} | username: ${username}`);
          });

          num = prompt('Select entry to copy or enter for search again: ')
          if (debug) console.log(num);
        } while (!num.length)
          const pass = entries[num - 1].getProperty('password');
          clipboardy.writeSync(pass);
      });
    }
    catch(error) {
      console.error(error);
    }
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
