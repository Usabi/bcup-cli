# bcup-cli

Introduction
------------

Lightweight command line client (cli) for [Buttercup password manager](https://buttercup.pw/)

Ease your terminal password use by copying into the clipboard any entry from a buttercup vault.

Install
-------
Install as global package

```npm install -g bcup-cli```

Usage
-----

```bcup-cli [-b|--bcup-path path_to_buttercup_vault] [-d|--debug]```

Your vault password will be prompted, then a title entry search filter (string or regexp).

A search against group and entry titles will be done.

Once the results are displayed, you can select an entry that will be copied to your clipboard. You can also select '0' to exit or enter to repeat search.

NOTE: If no bcup path is specified, the vault will be supposed to be ~/.bcup-cli/vault.bcup

License
-------

May be freely distributed under the [MIT license](https://raw.githubusercontent.com/Usabi/bcup-cli/master/LICENSE).
