const log = require('./logger')(module);
const fetch = require('node-fetch');

const {
	insertContract,
	insertCollection,
	insertTokenClassic,
	insertTokenDiamond,
	insertOfferPool,
	insertOffer,
	insertDiamondOffer,
	insertLock,
	insertDiamondRange,
	metadataForToken,
	metadataForProduct,
	updateOfferClassic,
	updateDiamondRange
} = require('./eventCatcherUtils');

const ethers = require('ethers');
const {
	erc721Abi,
	minterAbi,
	factoryAbi,
	erc777Abi,
	diamondMarketplaceAbi,
	diamondFactoryAbi,
	classicDeprecatedEvents,
	diamondDeprecatedEvents
} = require('../integrations/ethers/contracts');

const findContractFromAddress = async (address, network, transactionReceipt, dbModels) => {
	return await dbModels.Contract.findOne({contractAddress: address.toLowerCase(), blockchain: network});
}

const metadataForContract = async (
	dbModels,
	chainId,
	transactionReceipt,
	diamondEvent,
	newURI,
	appendTokenIndex = true // Assume it's true for the classic contracts that don't have the append index feature
) => {

	let contract = await findContractFromAddress(transactionReceipt.to ? transactionReceipt.to : transactionReceipt.to_address, chainId, transactionReceipt, dbModels);
	
	//{"indexed":false,"internalType":"string","name":"newURI","type":"string"},	
	//{"indexed":false,"internalType":"bool","name":"appendTokenIndex","type":"bool"}

	/*
		{
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "newURI",
          "type": "string"
        }
      ],
      "name": "BaseURIChanged",
      "type": "event"
    },
	*/
}

// Events from this list will be stored on the database
const insertionMapping = {
	// Diamond Factory
	DeployedContract: insertContract,
	CreatedCollection: insertCollection,
	CreatedRange: insertDiamondRange,
	UpdatedRange: updateDiamondRange,
	UpdatedBaseURI: metadataForContract,
	UpdatedProductURI: metadataForProduct,
	UpdatedTokenURI: metadataForToken,
	
	// Diamond Marketplace 
	AddedMintingOffer: insertDiamondOffer,
	TokenMinted: insertTokenClassic,
	MintedToken: insertTokenDiamond,

	// Classic Factory
	NewContractDeployed: insertContract,

	// Classic ERC721
	BaseURIChanged: metadataForContract,
	ProductURIChanged: metadataForProduct,
	TokenURIChanged: metadataForToken,
	ProductCreated: insertCollection,

	// Classic Marketplace
	AddedOffer: insertOfferPool,
	AppendedRange: insertOffer,
	RangeLocked: insertLock,
	UpdatedOffer: updateOfferClassic,
	SoldOut: null,
};

const getContractEvents = (abi, isDiamond = false) => {
	// Generate an interface with the ABI found
	let interface = new ethers.utils.Interface(abi);
	// Initialize the mapping of each event
	let mapping = {};

	Object.keys(interface.events).forEach((eventSignature) => {
		// Find the one entry in the ABI for the signature
		let [singleAbi] = abi.filter(item => {
			return item.name === eventSignature.split('(')[0];
		});
		if (!singleAbi) {
			console.error(`Couldn't find ABI for signature ${eventSignature}`);
		} else {
			mapping[ethers.utils.id(eventSignature)] = {
				signature: eventSignature,
				abi: [singleAbi],
				diamondEvent: isDiamond,
				operation: insertionMapping[singleAbi.name],
			};
		}
	});
	return mapping;
};

const masterMapping = {
	...getContractEvents(erc721Abi),
	...getContractEvents(minterAbi),
	...getContractEvents(factoryAbi),

	...getContractEvents(diamondFactoryAbi, true),
	...getContractEvents(diamondMarketplaceAbi, true),
	
	...getContractEvents(classicDeprecatedEvents, false),
	...getContractEvents(diamondDeprecatedEvents, true),
}

const processLog = (event) => {
	// Array of found events
	let foundEvents = [];

	// Depending on the method, the label for some fields change
	let transactionHashLabel = 'transactionHash';
	let blockNumberLabel = 'blockNumber';
	let logIndexLabel = 'logIndex';

	// Ethers expects an array, not 4 separate topics
	if (event.topic0) {
		event.topics = [
			event.topic0,
			event.topic1,
			event.topic2,
			event.topic3
		];
		// Filters any empty topic
		event.topics = event.topics.filter(item => item !== null);
		// Separate topics is also a flag to change the label name
		transactionHashLabel = 'transaction_hash';
		blockNumberLabel = 'block_number';
		logIndexLabel = 'log_index';
	}
	event.topics.forEach(item => {
		let found = masterMapping[item];
		if (found) {
			let interface = new ethers.utils.Interface(found.abi);
			//log.info(`Found ${found.signature}`);
			foundEvents.push({
				eventSignature: found.signature,
				arguments: interface.decodeEventLog(
					found.signature,
					event.data,
					event.topics
				),
				diamondEvent: found.diamondEvent,
				logIndex: event[logIndexLabel],
				transactionHash: event[transactionHashLabel],
				blockNumber: event[blockNumberLabel],
				operation: found.operation
			});
		}
	});
	return foundEvents;
}

module.exports = {
	processLog,
	getContractEvents,
	wasteTime: (ms) => new Promise((resolve, reject) => {
		setTimeout(resolve, ms);
	})
}