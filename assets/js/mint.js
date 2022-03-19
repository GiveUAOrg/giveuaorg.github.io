const contractAddress = "0xEb4b65a82114f235677a91A2b0c254B1747D0C38";
const networkName = "mainnet";
let mintCount = 1;
let useTorus = true;
let torus;
let web3;
let contract;

let costPerNFT = 24081991000000000;
let topupPerNFT = 30000000000000000;
let maxMintCount = 25;

const sendEvent = (action) => {
    gtag('event', action);
}

const sendEventValue = (action, value) => {
    gtag('event', action, { 'eventValue' : value });
}

const sendException = (error) => {
    sendEvent(error);
    gtag('event', 'exception', {
        'description': error,
        'fatal': false
    });
}

const initTorus = () => {
    torus = new Torus();
    return torus.init({
        showTorusButton: false,
        clientId: "BHRa4fTMnD-zuo91dEyYV_c1s_wOtEpGo7smos2LufU6Dl9rrGLqYRhcF2-3i-mnwVyG5nMBpyaqSRpjqISWl7Y",
        whiteLabel: {
            theme: {
                isDark: false,
                colors: {
                torusBrand1: "#4597C0",
                },
            },
            logoDark: "https://giveua.org/assets/img/apple-touch-icon.png", // Dark logo for light background
            logoLight: "https://giveua.org/assets/img/apple-touch-icon.png", // Light logo for dark background
            topupHide: true,
            featuredBillboardHide: true,
            disclaimerHide: true,
            tncLink: [],
            privacyPolicy:[],
            defaultLanguage: "en",
        },
        network: {
            host: networkName
        }
    });
}

const getWeb3 = () => {
    return new Promise((resolve, reject) => {
        if (useTorus) {
            web3 = new Web3(torus.provider);
        } else {
            if (window.ethereum) {
                web3 = new Web3(window.ethereum);
            } else {
                sendException("Wallet not installed");
                reject("Must install MetaMask");
            }
        }
        sendEvent("Web3 resolved");
        try {
            resolve(web3);
        } catch (error) {
            reject(error);
        }
    });
};

const getContract = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await $.getJSON("./assets/contract/GiveUkraineOrg.json");
            contract = new web3.eth.Contract(
                data.abi,
                contractAddress
            );
            sendEvent("Contract resolved");
            console.log("Contract resolved");
            resolve(contract);
        } catch (error) {
            console.log(`Contract not resolved: ${error}`);
            sendException("Contract not resolved");
            reject(error);
        }
    });
};

const getAccounts = async () => {
    if (useTorus) {
        return web3.eth.getAccounts();
    } else {
        return window.ethereum.request({ method: "eth_requestAccounts" });
    }
}

const checkBalance = async () => {
    const balance = await web3.eth.getBalance((await getAccounts())[0]);
    console.log(`Balance is: ${balance}`);
    if (balance < mintCount * topupPerNFT) {
        setError(`Looks like your balance (${ (balance / 1000000000000000000).toPrecision(2) } ETH) is low! You should Topup before you can donate!`);
        $("#topup-wallet").show();
    }
}

const updateMintCountText = async () => {
    const nftText = (mintCount > 1) ? "NFTs" : "NFT";
    const cost = (mintCount * costPerNFT) / 1000000000000000000;
    $("#mint-count").text(mintCount);
    $("#nfts-count").text(`${mintCount} ${nftText}`);
    $("#nfts-cost").text(`${ cost.toPrecision(8) }`);
}

const setError = async (message) => {
    $("#mint-success").hide();
    $("#mint-error").text(message).show();
}

const disableState = async () => {
    $("#mint-count-minus").prop( "disabled", true );
    $("#mint-count-plus").prop( "disabled", true );
    $("#mint-button").text("Donating...").prop( "disabled", true );
    $("#mint-error").hide();
    $("#mint-success").hide();
}

const enableState = async () => {
    $("#mint-count-minus").prop( "disabled", false );
    $("#mint-count-plus").prop( "disabled", false );
    $("#mint-button").text("Donate").prop( "disabled", false );
}

// Add listeners for button
const addListeners = async () => {
    mintCount = 1;
    $("#connect-metamask-button").on("click", async (e) => {
        e.preventDefault();
        sendEvent("Connect wallet metamask");
        $("#connect-metamask-button").text("Connecting...");
        useTorus = false;
        getWeb3()
        .then(() => getAccounts())
        .then(() => getContract())
        .then(() => {
            $("#mint-counters").show();
            $("#mint-button").show();
            $("#connect-wallet-buttons").hide();
            $("#mint-error").hide();
            sendEvent("Wallet connected");
        }).catch((error) => {
            $("#mint-counters").hide();
            $("#mint-button").hide();
            $("#connect-wallet-buttons").show();
            setError("Error connecting to Metamask. Please try again!");
            sendException("Metamask connection failed");
        }).finally(async () => {
            $("#connect-metamask-button").text("Connect with Metamask");
        })
        .then(() => checkBalance());
    });
    $("#connect-torus-button").on("click", async (e) => {
        e.preventDefault();
        sendEvent("Connect wallet torus");
        $("#connect-torus-button").text("Connecting...");
        useTorus = true;
        getWeb3()
        .then(() => torus.login())
        .then(() => getContract())
        .then(() => {
            $("#mint-counters").show();
            $("#mint-button").show();
            $("#connect-wallet-buttons").hide();
            $("#mint-error").hide();
            sendEvent("Wallet connected");
        }).catch(() => {
            $("#mint-counters").hide();
            $("#mint-button").hide();
            $("#connect-wallet-buttons").show();
            setError("Error connecting to Torus. Please try again!");
            sendException("Torus connection failed");
        }).finally(async () => {
            $("#connect-torus-button").text("Connect with Email");
        })
        .then(() => checkBalance());
    });
    $("#topup-wallet").on("click", async (e) => {
        return torus.initiateTopup("wyre", {
            fiatValue: mintCount * 100,
            selectedCryptoCurrency: "ETH",
            selectedAddress: (await getAccounts())[0],
        });
    });
    $("#mint-count-minus").on("click", async (e) => {
        e.preventDefault();
        if (mintCount > 1) mintCount--;
        sendEventValue("Mint count minus", mintCount);
        updateMintCountText();
    });
    $("#mint-count-plus").on("click", async (e) => {
        e.preventDefault();
        if (mintCount < maxMintCount) mintCount++;
        sendEventValue("Mint count plus", mintCount);
        updateMintCountText();
    });
    $("#mint-button").on("click", async (e) => {
        e.preventDefault();
        sendEventValue("Mint", mintCount);
        donateAndMint();
    });
}

const fetchSupply = async () => {
    remainingSupply = await contract.methods.remainingSupply().call();
    $("#nfts-left").text(remainingSupply);
};

const donateAndMint = async () => {
    disableState();
    await checkBalance() 
        .then(() => fetchSupply())
        .then(() => getAccounts())
        .then(async (accounts) => {
            let mintStatus;
            const totalCost = costPerNFT * mintCount;

            // Safe max for 1 NFT (mint + donation) + cost per additional NFT
            const gasCost = 110000 + 30000 * (mintCount - 1);

            sendEvent("Donate and Mint");
            mintStatus = contract.methods.donateAndMint(mintCount).send({ 
                from: accounts[0], 
                gas: gasCost,
                value: totalCost
            });

            await mintStatus.then((success) => {
                $("#mint-error").hide();
                $("#mint-success").show();
                sendEvent("Mint success");
                console.log(success);
            }).catch((error) => {
                setError(`Mint failed! ${error.message} Please retry!`);
                $("#mint-success").hide();
                sendException("Mint failed");
            }).finally(() => {
                enableState();
            }).then(() => fetchSupply());
    }).catch((error) => {
        console.log(error);
        setError("Please select the correct network in the Wallet!");
        sendException("Incorrect network");
        enableState();
    });
}

async function giveUAOrgMinter() {
    await addListeners()
        .then(() => initTorus())
        .then(() => getWeb3())
        .then(() => getContract())
        .then(() => fetchSupply())
        .catch((error) => {
            console.log(`Error fetching initial details. ${error}`);
        })
}

giveUAOrgMinter();