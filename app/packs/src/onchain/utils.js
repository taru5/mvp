import { ethers } from "ethers";
import Addresses from "./addresses.json";
import POAP from "../abis/POAP.json";
import { externalGet } from "src/utils/requests";
import { FetchWrapper } from "use-nft";

export const parseAndCommify = (value, nrOfDecimals = 2) => {
  return ethers.utils.commify(parseFloat(value).toFixed(nrOfDecimals));
};

export const ipfsToURL = (ipfsAddress) => {
  if (ipfsAddress.includes("http")) {
    return ipfsAddress;
  }
  return "https://ipfs.io/" + ipfsAddress.replace("://", "/");
};

export const getENSFromAddress = async (walletAddress, apiKey) => {
  let name = null;
  try {
    const provider = new ethers.providers.EtherscanProvider("mainnet", apiKey);
    name = await provider.lookupAddress(walletAddress);
  } catch (err) {
    console.log(err);
  }
  return name;
};

export const chainIdToName = (chainId, env) => {
  if (Addresses[env][chainId]) {
    return Addresses[env][chainId].chainName;
  }
};

export const chainNameToId = (chainName, env) => {
  const chainId = Object.keys(Addresses[env]).filter(
    (item) => Addresses[env][item].chainName == chainName
  );

  if (chainId.length == 0) {
    return undefined;
  }

  return Addresses[env][chainId[0]].chainId;
};

export const getAllChainOptions = (env) => {
  return Object.keys(Addresses[env]).map((chain) => ({
    name: Addresses[env][chain].chainName,
    id: Addresses[env][chain].chainId,
  }));
};

const XDAI_PARAMS = {
  chainId: "0x64",
  chainName: "Gnosis Chain",
  rpcUrl: "https://rpc.gnosischain.com",
  blockExplorerUrls: ["https://blockscout.com/xdai/mainnet/"],
};

export const getPOAPData = async (contractId, tokenId) => {
  const provider = new ethers.providers.JsonRpcProvider(XDAI_PARAMS.rpcUrl);
  const poap = new ethers.Contract(contractId, POAP, provider);
  const uri = await poap.tokenURI(ethers.BigNumber.from(tokenId));
  const result = await externalGet(uri);

  return result;
};

const CHAIN_RPC_URLS = {
  1: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
  89: "https://polygon-rpc.com/",
  44787: "https://forno.celo.org",
};

export const getNftData = async (nft) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      CHAIN_RPC_URLS[nft.chain_id]
    );

    const fetcher = ["ethers", { provider: provider }];

    const fetchWrapper = new FetchWrapper(fetcher);

    const result = await fetchWrapper.fetchNft(nft.address, nft.token_id);
    return result;
  } catch (e) {
    console.log("error", e);
    return {};
  }
};
