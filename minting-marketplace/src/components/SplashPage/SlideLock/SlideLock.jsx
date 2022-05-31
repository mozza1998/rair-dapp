import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import "../SplashPageTemplate/AuthorCard/AuthorCard.css";
import "../../AboutPage/AboutPageNew/AboutPageNew.css";
import "./SlideLock.css";

/* importing images*/
import SlideLock_IMG from '../images/slidelock_background.png';
import slideNFT0 from '../images/Slide-Toppic-01.jpg';
import slideNFT1 from '../images/slide-NFT1.png';
import slideNFT2 from '../images/slide-NFT2.png';
import slideNFT3 from '../images/slide-NFT3.png';
import slideNFT4 from '../images/slide-NFT4.png';

import videoBackground from '../images/slidelock_video_background.png'
import nftCountUkraine from '../images/UkrainianSoldierswithMedical/nftCountUkraine.jpeg';
import titleImage from './../images/NEW-Logo-sample-slidelock-1.png';


// import NFTLA_Video from "../images/NFT-LA-RAIR-2021.mp4"
import MetaMaskIcon from "../images/metamask_logo.png"


/* importing Components*/
import TeamMeet from "../TeamMeet/TeamMeetList";
import AuthorCard from "../SplashPageTemplate/AuthorCard/AuthorCard";
import NotCommercialTemplate from "../NotCommercial/NotCommercialTemplate";
import VideoPlayerModule from "../SplashPageTemplate/VideoPlayer/VideoPlayerModule";
import StaticTiles from "../SplashPageTemplate/VideoTiles/StaticTiles";
import NFTImages from "../SplashPageTemplate/NFTImages/NFTImages";
import TokenLeftTemplate from "../TokenLeft/TokenLeftTemplate";

import PurchaseTokenButton from '../../common/PurchaseToken.tsx';
import Swal from 'sweetalert2';
// import MetaTags from '../../SeoTags/MetaTags'
import { rFetch } from '../../../utils/rFetch';

// Google Analytics
//const TRACKING_ID = 'UA-209450870-5'; // YOUR_OWN_TRACKING_ID
//ReactGA.initialize(TRACKING_ID);

// This will be the default contract used in this splash page
const mainContract = {
    contractAddress: '0xbd034e188f35d920cf5dedfb66f24dcdd90d7804',
    requiredBlockchain: '0x1',
    offerIndex: [0, 1]
};
// By setting REACT_APP_TEST_CONTRACTS
const testContract = {
    contractAddress: '0x971ee6dd633cb6d8cc18e5d27000b7dde30d8009',
    requiredBlockchain: '0x5',
    offerIndex: [52, 0]
};

const splashData = {
  title: "",
  titleImage: titleImage,
  titleColor: "#57B69C",
  description: [
    "The most secure way to stream encrypted documents"
  ],
  // seoInformation: {
  //   title: "Слава Україні!",
  //   contentName: "author",
  //   content: "#UkraineGlitch",
  //   description: "1991 Generative Abstract Glitch Art pieces to aid Ukraine",
  //   favicon: faviconUkraine,
  //   image: UKR_rounded
  // },
  buttonLabel: "Unlock Document",
  backgroundImage: SlideLock_IMG,
  purchaseButton: {
    // Reusable component
    buttonComponent: PurchaseTokenButton,
    // OPTIONAL: Image on the purchase button
    img: MetaMaskIcon,
    // Contract address
    ...(process.env.REACT_APP_TEST_CONTRACTS === 'true' ? testContract : mainContract),
    // Custom style for the button
    customStyle: {
      backgroundColor: "#57B69C"
    },
    // presaleMessage: 'By accepting these terms, I agree to glitch the flag and support the country in distress.',
    // Custom class for the div surrounding the button
    customWrapperClassName: 'btn-submit-with-form',
    blockchainOnly: true,
    // Custom function that will be called if the minting is a success
    // First parameter will be the minted token's number
    customSuccessAction: async (nextToken) => {
      let tokenMetadata = await rFetch(`/api/nft/network/0x1/0xbd034e188f35d920cf5dedfb66f24dcdd90d7804/0/token/${nextToken}`);
      if (tokenMetadata.success && tokenMetadata?.result?.metadata?.image) {
        Swal.fire({
          imageUrl: tokenMetadata.result.metadata.image,
          imageHeight: "auto",
          imageWidth: "65%",
          imageAlt: "Your NFT's image",
          title: `You own #${nextToken}!`,
          icon: "success"
        });
      } else {
        Swal.fire('Success', `Bought token #${nextToken}`, 'success');
      }
    }
  },

  // button1: {
  //   buttonColor: "#035BBC",
  //   buttonLabel: "Mint for .1 ETH",
  //   buttonImg: MetaMaskIcon,
  //   buttonLink: "https://placekitten.com/200/300",
  // },

  // button2: {
  //   buttonColor: "#FFD505",
  //   buttonLabel: "Join Our Discord",
  //   buttonImg: DiscordIcon,
  //   buttonLink: "https://discord.com/invite/y98EMXRsCE",
  // },
  
  exclusiveNft: {
    title: "NFTs",
    titleColor: "#57B69C",
  },
  // carouselTitle: "Our Developers",
  // carouselData: [
  //   {
  //     title: "Alex & Arsenii",
  //     img: UKR126,
  //     description:
  //       "Originally based in Kharkiv, Alex and Arsenii are experienced frontend REACT developers that created the site you see here",
  //   },
  //   {
  //     title: "Masha",
  //     img: UKR497,
  //     description:
  //       "Born in Odessa, Masha emigrated with her family to the US when she was a small child. They remained closely connected to the Post-Soviet immigrant community of the Pacific NW while growing up. She created these pieces of glitch art as a way to process the grief of a country in dispair, and to continue funding the shipment of medical supplies to the war-torn area.",
  //   },
  //   {
  //     title: "Valerii & Natalia",
  //     img: UKR1294,
  //     description:
  //       "Originally based in Kharkiv, Valerii and Natalia are respsonsible for backend database architecture and syncing to allow for seemless purchase",
  //   },
  // ],
  videoData: {
    // video: null,
    // videoTitle: "Watch the Transformation",
    // videoModuleDescription: "NFT owners can learn more about the project by signing with metamask to unlock an encrypted document",
    // videoModuleTitle: "Only NFT owners can see these slides",
    // baseURL: 'https://storage.googleapis.com/rair-videos/',
    // mediaId: 'VUPLZvYEertdAQMiZ4KTI9HgnX5fNSN036GAbKnj9XoXbJ',
  },
  tilesTitle: "More streaming documents",
  // videoArr: [
  //   {
  //       typeVideo: "NFTLA-EXCLUSIVE-1",
  //       unlockVideoName: "Slide Streaming",
  //       timeVideo: "00:00:00",
  //       locked: true
  //   },
  //   {
  //       typeVideo: "NFTLA-EXCLUSIVE-2",
  //       unlockVideoName: "Sales Pipeline",
  //       timeVideo: "00:00:00",
  //       locked: false
  //   },
  //   {
  //       typeVideo: "NFTLA-EXCLUSIVE-3",
  //       unlockVideoName: "Marketing Plan",
  //       timeVideo: "00:00:00",
  //       locked: false
  //   },
  //   {
  //       typeVideo: "NFTLA-EXCLUSIVE-4",
  //       unlockVideoName: "Security Threat Model",
  //       timeVideo: "00:00:00",
  //       locked: true
  //   }
  // ],
  NFTName: "NFT",
  counterData: {
    titleColor: "#57B69C",
    title1: "Your files",
    title2: " secured",
    backgroundImage: SlideLock_IMG,
    btnColorIPFS: "#035BBC",
    nftCount: 960,
    nftTitle: "Access passes",
    royaltiesNft: null,
    properties: [
      // {
      //   titleProperty: "Fermion Freckles",
      //   titleColor: "#FFD505",
      //   propertyDesc: "14",
      //   percent: "32%",
      // },
      // {
      //   titleProperty: "Boson Movement",
      //   titleColor: "#035BBC",
      //   propertyDesc: "Sparklink / Still",
      //   percent: "1.7%",
      // },
    ],
    description: ["NFTs are the access credentials of the future", "-Automated public record of accounting", "-One user one stream . No password sharing", "-Offchain control of private data repositories"]
  }
}

const SlideLock = ({ loginDone, connectUserData }) => {
  const [soldCopies, setSoldCopies] = useState(0);
  const { primaryColor } = useSelector((store) => store.colorStore);
  const { currentChain, minterInstance } = useSelector((store) => store.contractStore);
  const carousel_match = window.matchMedia("(min-width: 900px)");
  const [carousel, setCarousel] = useState(carousel_match.matches);
  window.addEventListener("resize", () => setCarousel(carousel_match.matches));

  const getAllProduct = useCallback(async () => {
    if (loginDone) {
      if (currentChain === splashData.purchaseButton.requiredBlockchain) {
        setSoldCopies((await minterInstance.getOfferRangeInfo(...splashData.purchaseButton.offerIndex)).tokensAllowed.toString());
      } else {
        setSoldCopies();
      }
    }

  }, [setSoldCopies, loginDone, currentChain, minterInstance]);

  useEffect(() => {
    getAllProduct()
  }, [getAllProduct])

  // useEffect(() => {
  //   setTitle(`#UkraineGlitch`);
  // }, []);

  return (
    <div className="wrapper-splash-page slidelock">
      {/* <MetaTags seoMetaTags={splashData.seoInformation} /> */}
      <div className="template-home-splash-page">
        <AuthorCard {...{ splashData, connectUserData }} />
        {/* <NFTCounterTemplate 
          primaryColor={"rhyno"} 
          leftTokensNumber={0} 
          wholeTokens={0} 
          counterData={splashData.counterData}
        /> */}
        <TokenLeftTemplate
          counterData={splashData.counterData}
          copies={splashData.counterData.nftCount}
          soldCopies={soldCopies}
          primaryColor={primaryColor}
          loginDone={loginDone}
          nftTitle={splashData.counterData.nftTitle}
        />
        <div style={{ height: "108px" }} />
        <VideoPlayerModule backgroundImage={videoBackground} videoData={splashData.videoData} />
        <NFTImages
          NftImage={slideNFT0}
          Nft_1={slideNFT1}
          Nft_2={slideNFT2}
          Nft_3={slideNFT3}
          Nft_4={slideNFT4}
          amountTokens={splashData.counterData.nftCount}
          titleNft={splashData.exclusiveNft.title}
          colorText={splashData.exclusiveNft.titleColor}
          carousel={carousel}
        />
        <TeamMeet primaryColor={primaryColor} arraySplash={"slidelock"} />
        <NotCommercialTemplate
          primaryColor={primaryColor}
          NFTName={splashData.NFTName}
        />
      </div>
    </div>
  );
};

export default SlideLock;