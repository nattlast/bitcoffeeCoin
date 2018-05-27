'use strict';

module.exports = {
  networks: {
    local: {
      host: 'localhost',
      port: 9545,
      gas: 50000000,
      network_id: '*'
    },
    ropsten: {
      host: 'localhost',
      port: 8545,
      gas: 50000000,
      network_id: 1
    }
  }
};
