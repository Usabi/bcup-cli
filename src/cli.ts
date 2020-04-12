#!/usr/bin/env node

require('@buttercup/app-env/native');
import arg from 'arg';

export function cli(args) {
  console.log(args);
  const options = parseArgumentsIntoOptions(args);
  if (!options.bcupPath) {
    console.log('You must specify bcup file location (--bcup-path)');
    return;
  }

  const { Archive, Datasources, Credentials } = require('buttercup');
  const clipboardy = require('clipboardy');
  const prompt = require('prompt-sync')();

  const { FileDatasource } = Datasources;
  const bcupFile = options.bcupPath;
  const debug = options.debug || false;
  const fileDatasource = new FileDatasource(bcupFile);

  const password = prompt('Vault password: ', { echo: '*' })
  const credentials = Credentials.fromPassword(password);
  const titleSearch = prompt('Title filter: ')

  fileDatasource
    .load(credentials)
    .then(Archive.createFromHistory)
    .then(archive => {
        const re = new RegExp(titleSearch, 'i');
        const entries = archive.findEntriesByProperty('title', re);
        entries.forEach((entry, idx) => {
            const title = entry.getProperty('title');
            const username = entry.getProperty('username');
            const url = entry.getProperty('URL');
            const group = entry.getGroup().getTitle();
            console.log(idx + 1, group, '//', title, '//', url, '//', username);
        });

        const num = prompt('Select entry to copy: ')
        if (debug) console.log(num);
        const pass = entries[num - 1].getProperty('password');
        clipboardy.writeSync(pass);
    });
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
