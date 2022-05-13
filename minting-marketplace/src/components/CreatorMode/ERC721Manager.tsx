//@ts-nocheck
import {useState, useEffect, useCallback} from 'react'
import * as ethers from 'ethers'
import { useSelector } from 'react-redux';

import * as ERC721Token from '../../contracts/RAIR_ERC721.json';
import ProductManager from './CollectionManager';

const erc721Abi = ERC721Token.default.abi;

const ERC721Manager = ({ tokenAddress }) => {
	const [erc721Instance, setERC721Instance] = useState();
	const [tokenInfo, setTokenInfo] = useState();
	
	const [minterApproved, setMinterApproved] = useState();
	const [productName, setProductName] = useState('');
	const [productLength, setProductLength] = useState(0);
	const [existingProductsData, setExistingProductsData] = useState();
	const [refetchingFlag, setRefetchingFlag] = useState(false);
	
	const { minterInstance, currentUserAddress, programmaticProvider} = useSelector(state => state.contractStore);

	const refreshData = useCallback(async () => {
		setRefetchingFlag(true);
		setMinterApproved(await erc721Instance.hasRole(await erc721Instance.MINTER(), minterInstance.address));
		let tokInfo = {
			name: await erc721Instance.name(),
			symbol: await erc721Instance.symbol(),
			totalSupply: (await erc721Instance.totalSupply()).toString(),
			productCount: (await erc721Instance.getProductCount()).toString(),
			balance: (await erc721Instance.balanceOf(currentUserAddress)).toString(),
			address: erc721Instance.address
		} 
		setTokenInfo(tokInfo)
		let productsData = [];
		for await (let index of [...Array.apply(null, {length: tokInfo.productCount}).keys()]) {
			let colData = (await erc721Instance.getProduct(index));
			productsData.push({
				name: colData.productName,
				startingToken: colData.startingToken.toString(),
				endingToken: colData.endingToken.toString(),
				mintableTokensLeft: colData.mintableTokensLeft.toString(),
				locks: colData.locks?.map(item => item.toString())
			});
		}
		setExistingProductsData(productsData);
		setRefetchingFlag(false);
	}, [erc721Instance, currentUserAddress, minterInstance.address]);

	useEffect(() => {
		if (erc721Instance) {
			refreshData();
		}
	}, [erc721Instance, refreshData])

	useEffect(() => {
		let signer = programmaticProvider;
		if (window.ethereum) {
			let provider = new ethers.providers.Web3Provider(window.ethereum);
			signer = provider.getSigner(0);
		}
		let erc721 = new ethers.Contract(tokenAddress, erc721Abi, signer);
		setERC721Instance(erc721);
	}, [programmaticProvider, tokenAddress])
	
	return <details className='text-center border border-white rounded' style={{position: 'relative'}}>
		<summary className='py-1'>
			<b>
				ERC721 {tokenInfo && tokenInfo.name}<br />
			</b>
		</summary>
		Contract Address: <b>{tokenAddress}</b>
		<button
			style={{position: 'absolute', left: 0, top: 0, color: 'inherit'}}
			onClick={refreshData}
			disabled={refetchingFlag}
			className='btn'>
			{refetchingFlag ? '...' : <i className='fas fa-redo' />}
		</button>
		<br />
		<br />
		{tokenInfo && erc721Instance ? <div className='row text-center mx-0 px-0'>
			<div className='col-12 col-md-6 border border-secondary rounded'>
				<h5> ERC721 Info </h5>
				Name: <b>{tokenInfo.name}</b><br />
				Symbol: {tokenInfo.symbol}<br /><br />
				Total Supply: {tokenInfo.totalSupply}<br />
				Products Created: {tokenInfo.productCount}<br />
				Current Balance: {tokenInfo.balance}<br />
			</div>
			<div className='col-12 col-md-6 border border-secondary rounded'>
				<h5> Create a new product </h5>
				Product Name: <input className='w-50' value={productName} onChange={e => setProductName(e.target.value)} />
				<br/>
				Product's length: <input className='w-50' type='number' value={productLength} onChange={e => setProductLength(e.target.value)} />
				<br />
				<button disabled={productName === '' || productLength === 0} onClick={() => {
					erc721Instance.createProduct(productName, productLength);
				}} className='btn btn-royal-ice'>
					Create {productLength} tokens under product {productName}
				</button>
			</div>
			{minterApproved === false ? <div className='col-12 col-md-6 border border-secondary rounded'>
				To sell your unminted products<br />
				<button onClick={async e => {
					erc721Instance.grantRole(await erc721Instance.MINTER(), minterInstance.address);
				}} className='btn btn-warning'>
					Approve the Marketplace as a Minter!
				</button>
				<br />
				(once)
			</div> : <div className='col-3' />}
			<div className='col-12 col-md border border-secondary rounded'>
				{existingProductsData && <>
					<h5> Existing Products </h5>
					
					{existingProductsData.map((item, index) => {
						return <ProductManager
									key={index}
									productIndex={index}
									productInfo={item}
									tokenInstance={erc721Instance}
									tokenAddress={tokenInfo.address} />
					})}
				</>}
			</div>
		</div> : <>Fetching info...</>}
	</details>
}

export default ERC721Manager;