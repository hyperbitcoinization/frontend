import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.sass';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {EthereumClient, w3mConnectors} from '@web3modal/ethereum';
import {Web3Modal} from '@web3modal/react';
import {configureChains, createClient, WagmiConfig} from 'wagmi';
import {mainnet} from 'wagmi/chains';
import {infuraProvider} from 'wagmi/providers/infura'

const chains = [mainnet];

if (!process.env.REACT_APP_WALLETCONNECT_PROJECT_ID) {
  throw new Error("REACT_APP_WALLETCONNECT_PROJECT_ID not provided")
}
if (!process.env.REACT_APP_INFURA_API_KEY) {
  throw new Error("REACT_APP_INFURA_API_KEY not provided")
}

const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID;

const {provider} = configureChains(chains, [
  // w3mProvider({
  //   projectId
  // }),
  infuraProvider({apiKey: process.env.REACT_APP_INFURA_API_KEY})
]);
const wagmiClient = createClient({
  autoConnect: true,
  connectors: w3mConnectors({projectId, version: 1, chains}),
  provider,
});
const ethereumClient = new EthereumClient(wagmiClient, chains);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <WagmiConfig client={wagmiClient}>
      <App/>
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient}/>
    </WagmiConfig>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
