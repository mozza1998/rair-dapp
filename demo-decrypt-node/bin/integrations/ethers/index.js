const ethers = require('ethers');
const _ = require('lodash');
const Factory = require('./contracts/RAIR_Token_Factory.json').abi;
const Market = require('./contracts/Minter_Marketplace.json').abi;
const Token = require('./contracts/RAIR_ERC721.json').abi;
const log = require('../../utils/logger')(module);
const { addMetadata, addPin } = require('../../integrations/ipfsService')();
const providers = require('./providers');

module.exports = async (db) => {
  // Helpers
  const setProductListeners = async (contractAddress, provider) => {
    const tokenInstance = new ethers.Contract(contractAddress, Token, provider);
    const contract = contractAddress.toLowerCase();

    tokenInstance.on('ProductCreated(uint256,string,uint256,uint256)', async (index, name, firstTokenIndex, copies) => {
      try {
        await db.Product.create({
          name,
          collectionIndexInContract: index,
          contract,
          copies,
          firstTokenIndex
        });

        log.info(`RAIR: New Product ID#${ index } created for Contract ${ contract } with ${ copies } tokens, first token index ${ firstTokenIndex }`);
      } catch (err) {
        log.error(err);
      }
    });

    tokenInstance.on('ProductCompleted(uint256,string)', async (index, name) => {
      try {
        await db.Product.findOneAndUpdate({ collectionIndexInContract: index, contract }, { sold: true });

        log.info(`RAIR: Product ID#${ index } with name "${ name }" ran out of mintable copies!`);
      } catch (err) {
        log.error(err);
      }
    });

    tokenInstance.on('RangeLocked(uint256,uint256,uint256,uint256,string)', async (product, startingToken, endingToken, lockedTokens, name) => {
      try {
        await db.LockedTokens.create({
          contract,
          product,
          range: [startingToken, endingToken],
          lockedTokens,
          isLocked: true
        });

        log.info(`RAIR: The range of tokens gets locked lock for Product ID#${ product }, name "${ name }", of Contract ${ contract }, for range from ${ startingToken } to ${ endingToken }, total number ${ lockedTokens }.`);
      } catch (err) {
        log.error(err);
      }
    });

    tokenInstance.on('RangeUnlocked(uint256,uint256,uint256)', async (product, startingToken, endingToken) => {
      try {
        await db.LockedTokens.findOneAndUpdate({
          contract,
          product
        }, { $set: { isLocked: false } });

        log.info(`RAIR: The range is unlocked for Product ID#${ product }, contract ${ contract }, for range from ${ startingToken } to ${ endingToken }.`);
      } catch (err) {
        log.error(err);
      }
    });

    tokenInstance.on('BaseURIChanged(string)', async (contractURI) => {
      log.info(`RAIR: Base URI of the contract changed, new URI: ${ contractURI }.`);
    });

    tokenInstance.on('TokenURIChanged(uint256,string)', async (token, tokenURL) => {
      log.info(`RAIR: Token is given an unique metadata URL, new metadata URL: ${ tokenURL } for token ${ token }.`);
    });

    tokenInstance.on('ProductURIChanged(uint256,string)', async (product, productURI) => {
      log.info(`RAIR: Product is given a new URI, new URI: ${ productURI } for product ${ product }.`);
    });
  };

  // Listeners
  const contractListeners = (factoryInstance, provider) => {
    try {
      factoryInstance.on('NewContractDeployed(address,uint256,address)', async (userOwner, length, contractAddress) => {
        try {
          const user = userOwner.toLowerCase();
          const erc777Instance = new ethers.Contract(contractAddress, Token, provider);
          const title = await erc777Instance.name();
          const contract = erc777Instance.address.toLowerCase();

          await db.Contract.create({
            user,
            title,
            contractAddress: contract,
            blockchain: provider._network.symbol
          });

          log.info(`Factory: New Contract ${ contract } of User ${ user } was stored to the DB.`);

          await setProductListeners(contract, provider);
        } catch (err) {
          log.error(err);
        }
      });

      // TODO: need to be clarify events below
      factoryInstance.on('TokensWithdrawn(address,address,uint256)', async (recipientAddress, token, amountOfTokens) => {
        log.info(`Factory: ERC777 token ${ token } received, total length ${ amountOfTokens } through deployments are sent to the owner ${ recipientAddress }.`);
      });

      factoryInstance.on('NewTokensAccepted(address,uint256)', async (token, amountOfTokens) => {
        log.info(`Factory: ERC777 token ${ token } is accepted as a deployment method from total amount of tokens ${ amountOfTokens }.`);
      });

      factoryInstance.on('TokenNoLongerAccepted(address)', async (token) => {
        log.info(`Factory: ERC777 token ${ token } is no longer accepted for deployments.`);
      });
    } catch (err) {
      log.error(err);
    }
  };

  const productListeners = async (provider, factoryInstance, ownerAddress) => {
    try {
      const numberOfTokens = await factoryInstance.getContractCountOf(ownerAddress);
      const foundContracts = await db.Contract.find({ user: ownerAddress }).distinct('contractAddress');

      log.info(`${ ownerAddress } has deployed, ${ numberOfTokens.toString() }, contracts in ${provider._network.name} network.`);

      for (let j = 0; j < numberOfTokens; j++) {
        const contractAddress = await factoryInstance.ownerToContracts(ownerAddress, j);
        const user = ownerAddress.toLowerCase();
        const contract = contractAddress.toLowerCase();
        const erc777Instance = new ethers.Contract(contract, Token, provider);
        const title = await erc777Instance.name();

        log.info(`Contract ${ contractAddress } found for network ${provider._network.name}!`);

        if (!_.includes(foundContracts, contract)) {
          await db.Contract.create({
            user,
            title,
            contractAddress: contract,
            blockchain: provider._network.symbol
          });

          log.info(`Stored an additional Contract ${ contract } for User ${ user } from network ${provider._network.name}`);
        }

        await setProductListeners(contract, provider);

        if (j === (numberOfTokens - 1)) log.info(`Contract search complete in ${provider._network.name} network!`);
      }
    } catch (err) {
      log.error(err);
    }
  };

  const offerListeners = (minterInstance) => {
    try {
      minterInstance.on('AddedOffer(address,uint256,uint256,uint256)', async (contractAddress, product, rangeNumber, catalogIndex) => {
        try {
          const contract = contractAddress.toLowerCase();

          await db.OfferPool.create({
            marketplaceCatalogIndex: catalogIndex,
            contract,
            product,
            rangeNumber
          });

          log.info(`Minter Marketplace: Created a new offerPool ${ catalogIndex } (from ${ contract }), Product ID#${ product }.`);
        } catch (err) {
          log.error(err);
        }
      });

      minterInstance.on('AppendedRange(address,uint256,uint256,uint256,uint256,uint256,uint256,string)', async (contractAddress, product, offerPool, offerIndex, startingToken, endingToken, price, offerName) => {
        try {
          const contract = contractAddress.toLowerCase();

          await db.Offer.create({
            offerIndex,
            contract,
            product,
            offerPool,
            price,
            range: [startingToken, endingToken],
            offerName
          });

          log.info(`Minter Marketplace: Created new Offer ${ offerIndex }, name ${ offerName } (from Contract ${ contract }, Product ${ product }), offerPool ${ offerPool }, range from ${ startingToken } to ${ endingToken } by price ${ price } WEI each.`);
        } catch (err) {
          log.error(err);
        }
      });

      minterInstance.on('UpdatedOffer(address,uint256,uint256,uint256,uint256,string)', async (contractAddress, offerPool, offerIndex, copies, price, offerName) => {
        try {
          const contract = contractAddress.toLowerCase();

          await db.Offer.findOneAndUpdate({ offerPool, contract, offerIndex }, { copies, price, offerName });

          log.info(`Minter Marketplace: Update a Offer ${ offerIndex }, in offerPool ${ offerPool }, name ${ offerName } (from ${ contract }), new amount of tokens ${ copies } by ${ price } WEI each.`);
        } catch (err) {
          log.error(err);
        }
      });

      minterInstance.on('TokenMinted(address,address,uint256,uint256,uint256)', async (ownerAddress, contractAddress, offerPool, offerIndex, tokenIndex) => {
        try {
          const contract = contractAddress.toLowerCase();
          const OfferP = parseInt(offerPool);

          const product = await db.OfferPool.aggregate([
            { $match: { contract, marketplaceCatalogIndex: OfferP } },
            {
              $lookup: {
                from: 'Product',
                localField: 'product',
                foreignField: 'collectionIndexInContract',
                as: 'products'
              }
            },
            { $unwind: '$products' },
            { $replaceRoot: { newRoot: '$products' } },
          ]);

          const foundToken = await db.MintedToken.findOne({
            contract,
            offerPool,
            token: tokenIndex,
          });

          if (!_.isEmpty(foundToken)) {
            let metadataURI = 'none';

            if (!_.isEmpty(foundToken.metadata)) {
              const CID = await addMetadata(foundToken.metadata, foundToken.metadata.name);
              await addPin(CID, `metadata_${ foundToken.metadata.name }`);
              metadataURI = `${ process.env.PINATA_GATEWAY }/${ CID }`;
            }

            await db.MintedToken.findOneAndUpdate({
              contract,
              offerPool,
              token: tokenIndex,
            }, {
              ownerAddress,
              metadataURI,
              isMinted: true
            });
          } else {
            await db.MintedToken.create({
              token: tokenIndex,
              ownerAddress,
              offerPool,
              offer: offerIndex,
              contract,
              uniqueIndexInContract: (product[0].firstTokenIndex + parseInt(tokenIndex)),
              isMinted: true
            });
          }

          const updatedOffer = await db.Offer.findOneAndUpdate({
            offerIndex,
            offerPool
          }, { $inc: { soldCopies: 1 } });

          await db.Product.findOneAndUpdate({
            collectionIndexInContract: updatedOffer.product,
            contract
          }, { $inc: { soldCopies: 1 } });

          log.info(`Minter Marketplace: Minted new token ${ tokenIndex } of the offer ${ offerIndex } in offerPool ${ offerPool } for User ${ ownerAddress }.`);
        } catch (err) {
          log.error(err);
        }
      });

      minterInstance.on('SoldOut(address,uint256,uint256)', async (contractAddress, offerPool, offerIndex) => {
        try {
          const contract = contractAddress.toLowerCase();

          const offer = await db.Offer.findOneAndUpdate({ offerIndex, offerPool }, { $set: { sold: true } });

          const product = await db.Product.findOne({ collectionIndexInContract: offer.product, contract });

          log.info(`Minter Marketplace: Offer ${ offerIndex } from Product ${ product.name } runs out of allowed tokens.`);
        } catch (err) {
          log.error(err);
        }
      });

      // TODO: need to be clarify events below
      minterInstance.on('ChangedTreasury(address)', async (newTreasuryAddress) => {
        log.info(`Minter Marketplace: Updates it’s treasury address ${ newTreasuryAddress }.`);
      });

      minterInstance.on('ChangedTreasuryFee(address,uint16)', async (treasuryAddress, fee) => {
        log.info(`Minter Marketplace: The treasury ${ treasuryAddress } fee ${ fee } gets updated.`);
      });

      minterInstance.on('ChangedNodeFee(uint16)', async (fee) => {
        log.info(`Minter Marketplace: Updates the node fee ${ fee }.`);
      });
    } catch (err) {
      log.error(err);
    }
  };

  return Promise.all(_.map(providers, async providerData => {
    console.log('Connected to', providerData.provider._network.name);
    console.log('Symbol:', providerData.provider._network.symbol);

    // These connections don't have an address associated, so they can read but can't write to the blockchain
    let factoryInstance = await new ethers.Contract(providerData.factoryAddress, Factory, providerData.provider);
    let minterInstance = await new ethers.Contract(providerData.minterAddress, Market, providerData.provider);

    // Contracts
    contractListeners(factoryInstance, providerData.provider);

    // Products
    const arrayOfUsers = await db.User.distinct('publicAddress');
    await Promise.all(_.map(arrayOfUsers, user => productListeners(providerData.provider, factoryInstance, user)));

    // Offers
    offerListeners(minterInstance);
  }));
};
