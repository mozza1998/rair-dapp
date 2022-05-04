const log = require('./logger')(module);
const fetch = require('node-fetch');

const findContractFromAddress = async (address, network, transactionReceipt, dbModels) => {
	let contract = await dbModels.Contract.findOne({contractAddress: address.toLowerCase(), blockchain: network});
	if (contract === null) {
		console.error(`[${network}] Error parsing tx ${transactionReceipt.transactionHash}, couldn't find a contract entry for address ${address}`);
		return;
	}
	return contract;
}

const handleDuplicateKey = (err) => {
	if (err.code === 11000) {
		console.error(`Duplicate keys found! ${err.keyValue.toString()}`);
	} else {
		throw err;
	}
}

//event NewContractDeployed(address owner, uint id, address token);

const insertTokenDiamond = async (
	dbModels,
	chainId,
	transactionReceipt,
	diamondEvent,
	erc721Address,
	rangeIndex,
	tokenIndex,
	buyer
) => {
	let forbiddenContract = await dbModels.SyncRestriction.findOne({
		blockchain: chainId,
		contractAddress: erc721Address.toLowerCase(),
		tokens: false
	}).distinct('contractAddress');

	if (forbiddenContract?.length > 0) {
		log.error(`[${chainId}] Minted token from ${erc721Address} won't be stored!`);
		return undefined;
	}
	
	let contract = await findContractFromAddress(erc721Address.toLowerCase(), chainId, transactionReceipt, dbModels);

	if (!contract) {
		return undefined;
	}

	let foundLock = await dbModels.LockedTokens.findOne({
		contract: contract._id,
		lockIndex: rangeIndex // For diamonds, lock index = range index = offer index
	});

	if (foundLock === null) {
		//console.log(`[${chainId}] Couldn't find a lock for diamond mint ${erc721Address}:${tokenIndex}`);
		return undefined;
	}

	let product = await dbModels.Product.findOne({
		contract: contract._id,
		collectionIndexInContract: foundLock.product
	});

	let foundOffer = await dbModels.Offer.findOne({
		contract: contract._id,
	});

	let foundToken = await dbModels.MintedToken.findOne({
		contract: contract._id,
		token: tokenIndex
	})

	if (foundToken === null) {
		foundToken = new dbModels.MintedToken({});
	}

	// 3 possible sources of metadata
	// 1.- Direct metadata on the token
	let foundMetadata = await dbModels.MetadataLink.findOne({
		contract: contract._id,
		tokenIndex: tokenIndex
	}).populate('metadata');

	if (foundMetadata === null) {
		// 2.- Product wide metadata
		foundMetadata = await dbModels.MetadataLink.findOne({
			contract: contract._id,
			tokenIndex: { $exists: false },
			collectionIndex: foundLock.product
		}).populate('metadata');

		if (foundMetadata === null) {
			// Last try
			// 3.- Contract wide metadata
			foundMetadata = await dbModels.MetadataLink.findOne({
				contract: contract._id,
				tokenIndex: { $exists: false },
				collectionIndex: { $exists: false }
			}).populate('metadata');
		}
	}

	// If metadata exists, set it as the token's metadata
	if (foundMetadata !== null) {
		//console.log(`[${contract.address}:${tokenIndex.toString()}] - Found metadata!`);
		//console.log('will set', foundToken, 'with', foundMetadata.metadata);
		foundToken.metadata = {...foundMetadata.metadata};
		foundToken.metadataURI = foundMetadata.uri;
	}

	foundToken.token = tokenIndex;
	foundToken.uniqueIndexInContract = tokenIndex.add(product.firstTokenIndex);
	foundToken.ownerAddress = buyer;
	foundToken.offer = rangeIndex;
	foundToken.contract = contract._id;
	foundToken.isMinted = true;

	if (foundOffer) {
		foundOffer.soldCopies += 1;
		foundOffer.save().catch(handleDuplicateKey);
	}

	if (product) {
		product.soldCopies += 1;
		product.save().catch(handleDuplicateKey);
	}

	foundToken?.save().catch(handleDuplicateKey);

	return foundToken;
}

module.exports = {
	updateDiamondRange: async (
		dbModels,
		chainId,
		transactionReceipt,
		diamondEvent,
		rangeIndex,
		name,
		price,
		tokensAllowed,
		lockedTokens
	) => {

		let contract = await findContractFromAddress(transactionReceipt.to ? transactionReceipt.to : transactionReceipt.to_address, chainId, transactionReceipt, dbModels);

		if (!contract) {
			return;
		}

		let foundOffer = await dbModels.Offer.findOne({
			contract: contract._id,
			diamond: diamondEvent,
			offerPool: undefined,
			diamondRangeIndex: rangeIndex
		});
		if (!foundOffer) {
			return;
		}

		foundOffer.range[1] = tokensAllowed.add(foundOffer.range[0]);
		foundOffer.price = price;
		foundOffer.offerName = name;

		let updatedOffer = await foundOffer.save().catch(handleDuplicateKey);

		let foundLock = await dbModels.LockedTokens.findOne({
			contract: contract._id,
			lockIndex: rangeIndex,
			product: updatedOffer.product
		});

		if (foundLock) {
			foundLock.range[1] = lockedTokens.add(foundLock.range[0]);
			await foundLock.save().catch(handleDuplicateKey);
		}

		return updatedOffer;
	},
	updateOfferClassic: async (
		dbModels,
		chainId,
		transactionReceipt,
		diamondEvent,
		contractAddress,
		offerIndex,
		rangeIndex,
		tokens,
		price,
		name
	) => {
		let contract = await findContractFromAddress(contractAddress, chainId, transactionReceipt, dbModels);

		if (!contract) {
			return;
		}

		let foundOffer = await dbModels.Offer.findOne({
			contract: contract._id,
			diamond: false,
			offerPool: offerIndex,
			offerIndex: rangeIndex
		});
		if (!foundOffer) {
			return;
		}

		foundOffer.range[1] = tokens.add(foundOffer.range[0]);
		foundOffer.price = price;

		return foundOffer.save().catch(handleDuplicateKey);
	},
	insertContract: async (
		dbModels,
		chainId,
		transactionReceipt,
		diamondEvent,
		deployerAddress,
		deploymentIndex,
		deploymentAddress,
		deploymentName = "UNKNOWN"
	) => {
		let transactionHash = transactionReceipt.transactionHash ? transactionReceipt.transactionHash : transactionReceipt.hash
		
		let contract = new dbModels.Contract({
			diamond: diamondEvent,
			transactionHash,
			title: deploymentName,
			user: deployerAddress,
			blockchain: chainId,
			contractAddress: deploymentAddress.toLowerCase(),
			lastSyncedBlock: transactionReceipt.blockNumber,
			external: false
		}).save().catch(handleDuplicateKey);

		return [contract];
	},
	insertCollection: async (
		dbModels,
		chainId,
		transactionReceipt,
		diamondEvent,
		collectionIndex,
		collectionName,
		startingToken,
		collectionLength
	) => {
		let contract = await findContractFromAddress(transactionReceipt.to ? transactionReceipt.to : transactionReceipt.to_address, chainId, transactionReceipt, dbModels);
		
		if (!contract) {
			return;
		}

		let product = new dbModels.Product({
			name: collectionName,
			collectionIndexInContract: collectionIndex,
			contract: contract._id,
			copies: collectionLength,
			firstTokenIndex: startingToken,
			transactionHash: transactionReceipt.transactionHash ? transactionReceipt.transactionHash : transactionReceipt.hash,
			diamond: diamondEvent,
		}).save().catch(handleDuplicateKey);

		return [product];
	},
	insertTokenClassic: async (
		dbModels,
		chainId,
		transactionReceipt,
		diamondEvent,
		ownerAddress,
		contractAddress,
		catalogIndex,
		rangeIndex,
		tokenIndex
	) => {
		if (diamondEvent) {
			// This is a special case of a token minted before the events were renamed
			// The data will be sent to the diamond version of the tokenMinted handler
			// Because even though the names were the same, the signature is different
			return await insertTokenDiamond(
				dbModels,
				chainId,
				transactionReceipt,
				diamondEvent,
				// These 4 events are not really what they're called
				ownerAddress, // Argument 0 of the real event is erc721Address
				contractAddress, // Argument 2 of the real event is rangeIndex
				catalogIndex, // Argument 3 of the real event is tokenIndex
				rangeIndex, // Argument 4 of the real event is buyer
			);
		}

		let forbiddenContract = await dbModels.SyncRestriction.findOne({
			blockchain: chainId,
			contractAddress: contractAddress.toLowerCase(),
			tokens: false
		}).distinct('contractAddress');

		if (forbiddenContract?.length > 0) {
			log.error(`Minted token from ${contractAddress} can't be stored!`);
			return [undefined];
		}
		
		let contract = await findContractFromAddress(contractAddress.toLowerCase(), chainId, transactionReceipt, dbModels);

		if (!contract) {
			return;
		}

		let offerPool = await dbModels.OfferPool.findOne({
			contract: contract._id,
			marketplaceCatalogIndex: catalogIndex
		});

		if (offerPool === null) {
			log.error("Couldn't find offer pool")
			return [undefined];
		}

		let product = await dbModels.Product.findOne({
			contract: contract._id,
			collectionIndexInContract: offerPool.product
		});

		if (!product) {
			log.error(`Couldn't find product for ${contractAddress}`);
			return [undefined];
		}

		let offers = await dbModels.Offer.find({
			contract: contract._id,
			offerPool: offerPool.marketplaceCatalogIndex
		});

		let [foundOffer] = offers.filter(item => {
			return tokenIndex >= item.range[0] && tokenIndex <= item.range[1]
		});

		if (!foundOffer) {
			log.error(`Couldn't find offer!`);
			return [undefined];
		}

		let foundToken = await dbModels.MintedToken.findOne({
			contract: contract._id,
			offerPool: offerPool.marketplaceCatalogIndex,
			token: tokenIndex
		})

		if (foundToken === null) {
			foundToken = new dbModels.MintedToken({});
		}

		// 3 possible sources of metadata

		// 1.- Direct metadata on the token
		let foundMetadata = await dbModels.MetadataLink.findOne({
			contract: contract._id,
			tokenIndex: tokenIndex
		}).populate('metadata');

		if (foundMetadata === null) {
			// 2.- Product wide metadata
			foundMetadata = await dbModels.MetadataLink.findOne({
				contract: contract._id,
				tokenIndex: { $exists: false },
				collectionIndex: product.collectionIndexInContract
			}).populate('metadata');

			if (foundMetadata === null) {
				// Last try
				// 3.- Contract wide metadata
				foundMetadata = await dbModels.MetadataLink.findOne({
					contract: contract._id,
					tokenIndex: { $exists: false },
					collectionIndex: { $exists: false }
				}).populate('metadata');
			}
		}

		// If metadata exists, set it as the token's metadata
		if (foundMetadata !== null) {
			//console.log(`[${contract.contractAddress}:${tokenIndex.toString()}] - Found metadata!`);
			//console.log('will set', foundToken, 'with', foundMetadata.metadata);
			foundToken.metadata = {...foundMetadata.metadata};
			foundToken.metadataURI = foundMetadata.uri;
		}

		foundToken.token = tokenIndex;
		foundToken.uniqueIndexInContract = tokenIndex.add(product.firstTokenIndex);
		foundToken.ownerAddress = ownerAddress;
		foundToken.offerPool = catalogIndex;
		foundToken.offer = foundOffer.offerIndex;
		foundToken.contract = contract._id;
		foundToken.isMinted = true;

		foundOffer.soldCopies += 1;
		product.soldCopies += 1;

		foundToken.save().catch(handleDuplicateKey);
		foundOffer.save().catch(handleDuplicateKey);
		product.save().catch(handleDuplicateKey);

		return [foundToken, foundOffer, product];
	},
	insertTokenDiamond,
	insertOfferPool: async (
		dbModels,
		chainId,
		transactionReceipt,
		diamondEvent,
		contractAddress,
		productIndex,
		rangesCreated,
		catalogIndex
	) => {
		let contract = await findContractFromAddress(contractAddress, chainId, transactionReceipt, dbModels);
		
		if (!contract) {
			return;
		}

		let offerPool = new dbModels.OfferPool({
			marketplaceCatalogIndex: catalogIndex,
			contract: contract._id,
			product: productIndex,
			rangeNumber: rangesCreated,
			minterAddress: transactionReceipt.to ? transactionReceipt.to : transactionReceipt.to_address,
			transactionHash: transactionReceipt.transactionHash ? transactionReceipt.transactionHash : transactionReceipt.hash
		}).save().catch(handleDuplicateKey);

		return [offerPool];
	},
	insertOffer: async (
		dbModels,
		chainId,
		transactionReceipt,
		diamondEvent,
		contractAddress,
		productIndex,
		offerIndex,
		rangeIndex,
		startToken,
		endToken,
		price,
		name,
	) => {
		let contract = await findContractFromAddress(contractAddress, chainId, transactionReceipt, dbModels);
		
		if (!contract) {
			return;
		}
		
		let offer = new dbModels.Offer({
			offerIndex: rangeIndex,
			contract: contract._id,
			product: productIndex,
			offerPool: offerIndex,
			copies: endToken.sub(startToken),
			price: price,
			range: [startToken.toString(), endToken.toString()],
			offerName: name,
			transactionHash: transactionReceipt.transactionHash ? transactionReceipt.transactionHash : transactionReceipt.hash
		}).save().catch(handleDuplicateKey);
		
		return [offer];
	},
	insertDiamondOffer: async (
		dbModels,
		chainId,
		transactionReceipt,
		diamondEvent,
		erc721Address,
		rangeIndex,
		rangeName,
		price,
		feeSplitsLength,
		offerIndex,
	) => {
		let contract = await findContractFromAddress(erc721Address, chainId, transactionReceipt, dbModels);
		
		if (!contract) {
			return;
		}

		let foundOffer = await dbModels.Offer.findOneAndUpdate({
			contract: contract._id,
			offerName: rangeName,
			price: price,
			offerIndex: {'$exists': false}
		}, { offerIndex: offerIndex	});

		return foundOffer;
	},
	insertLock: async (
		dbModels,
		chainId,
		transactionReceipt,
		diamondEvent,
		productIndex,
		startingToken,
		endingToken,
		tokensLocked,
		productName,
		lockIndex
	) => {
		let contract = await findContractFromAddress(transactionReceipt.to ? transactionReceipt.to : transactionReceipt.to_address, chainId, transactionReceipt, dbModels);
		
		if (!contract) {
			return;
		}
		
		let lockedTokens = new dbModels.LockedTokens({
			lockIndex: lockIndex,
			contract: contract._id,
			product: productIndex,
			range: [startingToken, endingToken],
			lockedTokens: tokensLocked,
			isLocked: true
		}).save().catch(handleDuplicateKey);
		
		return [lockedTokens];
	},
	insertDiamondRange: async (
		dbModels,
		chainId,
		transactionReceipt,
		diamondEvent,
		productIndex,
		start,
		end,
		price,
		tokensAllowed, // Unused on the processing
		lockedTokens,
		name,
		rangeIndex
	) => {
		let contract = await findContractFromAddress(transactionReceipt.to ? transactionReceipt.to : transactionReceipt.to_address, chainId, transactionReceipt, dbModels);
		if (!contract) {
			return;
		}
		let offer = new dbModels.Offer({
			//offerIndex: undefined, // Offer is not defined yet
			contract: contract._id,
			product: productIndex,
			//offerPool: undefined, // Diamond contracts have no offer pools
			copies: end.sub(start),
			price: price,
			range: [start, end],
			offerName: name,
			diamond: true,
			diamondRangeIndex: rangeIndex,
			transactionHash: transactionReceipt.transactionHash ? transactionReceipt.transactionHash : transactionReceipt.hash
		}).save().catch(handleDuplicateKey);

		// Locks are always made on Diamond Contracts, they're part of the range event
		let tokenLock = new dbModels.LockedTokens({
			lockIndex: rangeIndex,
			contract: contract._id,
			product: productIndex,
			// Substract 1 because lockedTokens includes the start token
			range: [start, start.add(lockedTokens).sub(1)],
			lockedTokens: lockedTokens,
			isLocked: true
		}).save().catch(handleDuplicateKey);

		return offer;
	},
	metadataForToken: async (
		dbModels,
		chainId,
		transactionReceipt,
		diamondEvent,
		tokenId,
		newURI
	) => {
		let contract = await findContractFromAddress(transactionReceipt.to ? transactionReceipt.to : transactionReceipt.to_address, chainId, transactionReceipt, dbModels);

		if (!contract) {
			return;
		}

		let fetchedMetadata = {};
		// New URI can come empty, it means it got unset
		if (newURI !== '') {
			fetchedMetadata = await (await fetch(newURI)).json();
		}

		let databaseMetadata = await (new dbModels.TokenMetadata(fetchedMetadata)).save().catch(handleDuplicateKey);

		let foundToken = await dbModels.MintedToken.findOne({
			contract: contract._id,
			uniqueIndexInContract: tokenId.toString()
		});
	
		// The token exists, update the metadata for that token
		if (foundToken) {
			foundToken.metadata = fetchedMetadata;
			foundToken.metadataURI = newURI;
			foundToken.isMetadataPinned = true;
			await foundToken.save().catch(handleDuplicateKey);
		}

		let link = await (new dbModels.MetadataLink({
			sourceURI: newURI,
			metadata: databaseMetadata._id,
			uri: newURI,
			contract: contract._id,
			tokenIndex: tokenId,
		})).save().catch(handleDuplicateKey);

		return foundToken;
	},
	metadataForProduct: async (
		dbModels,
		chainId,
		transactionReceipt,
		diamondEvent,
		productId,
		newURI,
		appendTokenIndex = true
	) => {
		let contract = await findContractFromAddress(transactionReceipt.to ? transactionReceipt.to : transactionReceipt.to_address, chainId, transactionReceipt, dbModels);
		
		if (!contract) {
			return;
		}

		// Parse metadata
		let fetchedMetadata = {};
		let databaseMetadata;

		if (appendTokenIndex === false) {
			if (newURI !== '') {
				fetchedMetadata = await (await fetch(newURI)).json();
			}
			databaseMetadata = await (new dbModels.TokenMetadata(fetchedMetadata)).save().catch(handleDuplicateKey);
		}

		// Find tokens with Unique URIs set
		let uniqueURIdToken = await dbModels.MetadataLink.find({
			contract: contract._id,
			tokenIndex: {$exists: true}
		}).distinct('tokenIndex');

		// Find the offers tied to that product
		let foundOffers = await dbModels.Offer.find({
			contract: contract._id,
			product: productId
		}).distinct('offerIndex');

		// Update all tokens that have no unique URI set
		if (appendTokenIndex) {
			// Have to fetch the URL for each token
			let foundTokensToUpdate = await dbModels.MintedToken.find({
				contract: contract._id,
				offerIndex: { $in: foundOffers },
				uniqueIndexInContract: { $in: uniqueURIdToken }
			});
			for await (let token of foundTokensToUpdate) {
				if (newURI !== '') {
					token.metadata = await (await fetch(`${newURI}${token.token}`));
					token.metadataURI = `${newURI}${token.token}`;
				} else {
					token.metadata = databaseMetadata;
					token.metadataURI = '';
				}
				await token.save().catch(handleDuplicateKey);
			}
		} else {
			// Can update all tokens in batch
			await dbModels.MintedToken.updateMany({
				contract: contract._id,
				offerIndex: { $in: foundOffers },
				uniqueIndexInContract: { $nin: uniqueURIdToken }
			} , {
				$set: { metadata: fetchedMetadata }
			});
		}

		// Create link for future minted tokens
		let link = (new dbModels.MetadataLink({
			sourceURI: newURI,
			metadata: appendTokenIndex ? undefined : databaseMetadata._id,
			uri: newURI,
			contract: contract._id,
			collectionIndex: productId,
			appendTokenIndex
		})).save().catch(handleDuplicateKey);

		return link;
	}
}