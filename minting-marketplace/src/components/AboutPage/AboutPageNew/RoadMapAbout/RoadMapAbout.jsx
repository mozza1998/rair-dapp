import React from 'react'

const RoadMap = ({ primaryColor }) => {
    return (
        <div className="about-roadmap">
            <div className="about-road-title">2022 Roadmap</div>
            <div className="roadmap-container-mobile">
                <div className="about-map-item">
                    <div className="map-item-progress">
                        <div className="map-progress">
                            <div className="line-purple"></div>
                            <div className="line-grey"></div>
                            <div style={{
                                color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                            }} className="progress-box">Q1</div>
                            <div style={{
                                color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                            }} className="progress-box">Q2</div>
                            <div style={{
                                color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                            }} className="progress-box">Q3</div>
                        </div>
                        <div className="progress-title">
                            Curation Alpha
                            <span></span>
                        </div>
                    </div>
                    <div className="map-item-desc">
                        <p>EVM NFT suite for Ethereum, Matic, BSC</p>
                        <p>Custom minting, royalty splits, aggregation</p>
                        <p>Encrypted streaming video</p>
                    </div>
                </div>
                <div className="about-map-item">
                    <div className="map-item-progress">
                        <div className="map-progress">
                            <div className="line-private"></div>
                            <div className="line-grey"></div>
                            <div style={{
                                color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                            }} className="progress-box">Q2</div>
                            <div style={{
                                color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                            }} className="progress-box">Q3</div>
                            <div style={{
                                color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                            }} className="progress-box">Q4</div>
                        </div>
                        <div className="progress-title">
                            Private Beta
                            <span></span>
                        </div>
                    </div>
                    <div className="map-item-desc">
                        <p>Scale to customer</p>
                        <p>EVM Aidrops to token holders</p>
                        <p>Curated marketplace</p>
                    </div>
                </div>
                <div className="about-map-item">
                    <div className="map-item-progress">
                        <div className="map-progress">
                            <div className="line-public"></div>
                            <div className="line-grey"></div>
                            <div style={{
                                color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                            }} className="progress-box">Q3</div>
                            <div style={{
                                color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                            }} className="progress-box">Q4</div>
                            <div style={{
                                color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                            }} className="progress-box">Q5</div>
                        </div>
                        <div className="progress-title">
                            Public Release
                            <span></span>
                        </div>
                    </div>
                    <div className="map-item-desc">
                        <p>Toolset release for all creators</p>
                        <p>Encrypted data streaming</p>
                        <p>Marketplaces for NFT stakers</p>
                    </div>
                </div>
            </div>
            <div className="roadmap-container">
                <div className="container-curation-public">
                    <div className="about-map-item">
                        <div className="map-item-progress">
                            <div className="map-progress">
                                <div className="line-purple"></div>
                                <div className="line-grey"></div>
                                <div style={{
                                    color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                                }} className="progress-box">Q1</div>
                                <div style={{
                                    color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                                }} className="progress-box">Q2</div>
                                <div style={{
                                    color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                                }} className="progress-box">Q3</div>
                            </div>
                            <div className="progress-title">
                                Curation Alpha
                                <span></span>
                            </div>
                        </div>
                        <div className="map-item-desc">
                            <p>EVM NFT suite for Ethereum, Matic, BSC</p>
                            <p>Custom minting, royalty splits, aggregation</p>
                            <p>Encrypted streaming video</p>
                        </div>
                    </div>
                    <div className="about-map-item">
                        <div className="map-item-progress">
                            <div className="map-progress">
                                <div className="line-public"></div>
                                <div className="line-grey"></div>
                                <div style={{
                                    color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                                }} className="progress-box">Q3</div>
                                <div style={{
                                    color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                                }} className="progress-box">Q4</div>
                                <div style={{
                                    color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                                }} className="progress-box">Q5</div>
                            </div>
                            <div className="progress-title">
                                Public Release
                                <span></span>
                            </div>
                        </div>
                        <div className="map-item-desc">
                            <p>Toolset release for all creators</p>
                            <p>Encrypted data streaming</p>
                            <p>Marketplaces for NFT stakers</p>
                        </div>
                    </div>
                </div>
                <div className="block-devide-box">
                    <div className="squere"></div>
                    <div className="squere"></div>
                    <div className="squere"></div>
                </div>
                <div className="container-private-beta">
                    <div className="about-map-item">
                        <div className="map-item-progress">
                            <div className="map-progress">
                                <div className="line-private"></div>
                                <div className="line-grey"></div>
                                <div style={{
                                    color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                                }} className="progress-box">Q2</div>
                                <div style={{
                                    color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                                }} className="progress-box">Q3</div>
                                <div style={{
                                    color: `${primaryColor === "rhyno" ? "#fff" : "#fff"}`,
                                }} className="progress-box">Q4</div>
                            </div>
                            <div className="progress-title">
                                Private Beta
                                <span></span>
                            </div>
                        </div>
                        <div className="map-item-desc">
                            <p>Scale to customer</p>
                            <p>EVM Aidrops to token holders</p>
                            <p>Curated marketplace</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RoadMap