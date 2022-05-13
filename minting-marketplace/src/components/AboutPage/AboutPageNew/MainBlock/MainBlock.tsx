//@ts-nocheck
import React, { useState, /*useCallback, useEffect*/ } from "react";
import Modal from "react-modal";
import { useSelector } from "react-redux";
import { web3Switch } from "../../../../utils/switchBlockchain";
import Swal from "sweetalert2";
// import { rFetch } from "../../../../utils/rFetch";
// import { erc721Abi } from "../../../../contracts";
import { metamaskCall } from "../../../../utils/metamaskUtils";
import { diamondFactoryAbi } from "../../../../contracts/index";

const customStyles = {
  overlay: {
    zIndex: "1",
  },
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: "column",
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    fontFamily: "Plus Jakarta Text",
    borderRadius: "16px",
  },
};

Modal.setAppElement("#root");

const MainBlock = ({ Metamask, primaryColor, termsText, connectUserData, purchaseButton }) => {
  const [modalIsOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState({ policy: false, use: false });

  const { diamondMarketplaceInstance, contractCreator, currentUserAddress } = useSelector(
    (store) => store.contractStore
  );

  const switchToNetwork = "0x38";
  const aboutPageAddress = "0xb6163454da87e9f3fd63683c5d476f7d067f75a2".toLowerCase();
  const offerIndexInMarketplace = 1;

  let subtitle;

  // const openModal = useCallback(() => {
  //   setIsOpen(true);
  // }, []);

  function afterOpenModal() {
    subtitle.style.color = "#9013FE";
  }
  function closeModal() {
    setIsOpen(false);
    setActive((prev) => ({
      ...prev,
      policy: false,
      use: false,
    }));
  }

  const buyWatchToken = async () => {
    if (!currentUserAddress) {
      connectUserData();
      return;
    }
    if (window.ethereum.chainId !== switchToNetwork) {
      web3Switch(switchToNetwork);
      return;
    }
    if (!diamondMarketplaceInstance) {
      Swal.fire({
        title: "An error has ocurred",
        html: `Please try again later`,
        icon: "info",
      });
      return;
    }
    let watchTokenOffer = await metamaskCall(diamondMarketplaceInstance.getOfferInfo(offerIndexInMarketplace));
    if (!watchTokenOffer) {
      Swal.fire({
        title: "An error has ocurred",
        html: `Please try again later`,
        icon: "info",
      });
      return;
    }
    if (watchTokenOffer) {
      let instance = contractCreator(aboutPageAddress, diamondFactoryAbi);
      let nextToken = await metamaskCall(instance.getNextSequentialIndex(
        watchTokenOffer.productIndex,
        watchTokenOffer.rangeData.rangeStart,
        watchTokenOffer.rangeData.rangeEnd
      ));
      if (!nextToken) {
        Swal.fire({
          title: "An error has ocurred",
          html: `Please try again later`,
          icon: "info",
        });
        return;
      }
      Swal.fire({
        title: "Please wait...",
        html: `Buying Watch Token #${nextToken.toString()}`,
        icon: "info",
        showConfirmButton: false,
      });
      if (await metamaskCall(
        diamondMarketplaceInstance.buyMintingOffer(
          offerIndexInMarketplace,
          nextToken,
          {
            value: watchTokenOffer.rangeData.rangePrice,
          }
        ),
        "Sorry your transaction failed! When several people try to buy at once - only one transaction can get to the blockchain first. Please try again!"
      )) {
        Swal.fire({
          // title : "Success", 
          title: `You own #${nextToken}!`,
          icon: "success"
        });
      }
    }
  };

  return (
    <div className="information-author">
      <div className="home-about-desc">
        <h2
          style={{
            color: `${primaryColor === "rhyno" ? "#000" : "#fff"}`,
          }}
        >
          Encrypted,
          <br />
          Streaming NFTs
        </h2>
        <div
          className="autor-about-text"
          style={{
            color: `${primaryColor === "rhyno" ? "#000" : "#A7A6A6"}`,
          }}
        >
          Our platform makes it possible to attach digital goods
          <br />
          to an NFT using encrypted streaming - making today's
          <br />
          NFT multi-dimensional.
        </div>
        {purchaseButton}
        <div className="modal__wrapper__about__page">
          <Modal
            isOpen={modalIsOpen}
            onAfterOpen={afterOpenModal}
            onRequestClose={closeModal}
            style={customStyles}
            contentLabel="Example Modal"
          >
            <h2
              style={{
                fontSize: "60px",
                fontWeight: "bold",
                paddingTop: "3rem",
                cursor: "default",
              }}
              ref={(_subtitle) => (subtitle = _subtitle)}
            >
              Terms of Service
            </h2>
            <div className="modal-content-wrapper">
              <div className="modal-form">
                <form>
                  <div className="form-group">
                    <input type="checkbox" id="policy" />
                    <label
                      onClick={() =>
                        setActive((prev) => ({
                          ...prev,
                          policy: !prev.policy,
                        }))
                      }
                      htmlFor="policy"
                    >
                      I agree to the{" "}
                    </label>
                    <span
                      onClick={() => window.open("/privacy", "_blank")}
                      style={{
                        color: "#9013FE",
                        fontSize: "24px",
                        paddingRight: "1rem",
                        marginLeft: "-2.5rem",
                      }}
                    >
                      Privacy Policy
                    </span>
                  </div>
                  <div className="form-group sec-group ">
                    <input type="checkbox" className="dgdfgd" id="use" />
                    <label
                      onClick={() =>
                        setActive((prev) => ({ ...prev, use: !prev.use }))
                      }
                      htmlFor="use"
                    >
                      I accept the{" "}
                    </label>
                    <span
                      onClick={() => window.open("/terms-use", "_blank")}
                      style={{
                        color: "#9013FE",
                        fontSize: "24px",
                        paddingRight: "2.3rem",
                        marginLeft: "-2.5rem",
                      }}
                    >
                      Terms of Use
                    </span>
                  </div>
                </form>
              </div>
              <div className="modal-content-np">
                <div className="modal-text-wrapper">
                  <span className="modal-text">
                    {termsText}
                  </span>
                </div>
                <div className="modal-btn-wrapper">
                  <button
                    onClick={buyWatchToken}
                    disabled={
                      !Object.values(active).every((el) => el)
                    }
                    className="modal-btn"
                  >
                    <img
                      style={{ width: "100px", marginLeft: "-1.5rem" }}
                      className="metamask-logo modal-btn-logo"
                      src={Metamask}
                      alt="metamask-logo"
                    />{" "}
                    {currentUserAddress ? "PURCHASE" : "Connect your wallet!"}
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default MainBlock;