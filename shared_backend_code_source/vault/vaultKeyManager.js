const axios = require('axios');
const {
  getVaultNamespace,
  getVaultUrl,
} = require('./vaultUtils');

class VaultKeyManager {
  getKVProviderName() {
    return "key_storage"
  }

  getKeyWriteReadUrl({
    secretKVDestinationName,
    secretName,
  }) {
    return `${getVaultUrl()}/v1/${secretKVDestinationName}/data/${secretName}`;
  }

  generateVaultHeaders({ vaultToken }) {
    return {
      'X-Vault-Request': true,
      'X-Vault-Namespace': getVaultNamespace(),
      'X-Vault-Token': vaultToken,
    };
  }

  async write({ secretName, data, vaultToken }) {
    try {
      const secretKVDestinationName = this.getKVProviderName();
      const url = this.getKeyWriteReadUrl({
        secretKVDestinationName,
        secretName,
      });
      const res = await axios({
        method: 'POST',
        url,
        headers: this.generateVaultHeaders({ vaultToken }),
        data: {
          data: {
            ...data,
          },
        },
      });
      return res;
    } catch (err) {
      throw err;
    }
  }

  async read({ secretName, vaultToken }) {
    try {
      const secretKVDestinationName = this.getKVProviderName();
      const url = this.getKeyWriteReadUrl({
        secretKVDestinationName,
        secretName
      })
      const res = await axios({
        method: "POST",
        url,
        headers: this.generateVaultHeaders({vaultToken}),
        data: {
          data: {
            ...data
          }
        }
      });
      return res;
    } catch(err) {
      throw new Error('Error writing key to vault');
    }    
  }

  async read({secretName, vaultToken}) {
    try {
      const secretKVDestinationName = this.getKVProviderName()
      const url = this.getKeyWriteReadUrl({
        secretKVDestinationName,
        secretName
      });
      const axiosParams = {
        method: 'GET',
        url,
        headers: this.generateVaultHeaders({ vaultToken }),
      };
      const res = await axios(axiosParams);
      if (res.status !== 200) {
        throw new Error('Vault received non 200 code while trying to retrive secret!');
      }
      const { data } = res.data.data;
      return data;
    } catch(err) {
      throw new Error('Error reading key from Vault');
    }
  }
}

const vaultKeyManager = new VaultKeyManager();

module.exports = {
  vaultKeyManager,
};