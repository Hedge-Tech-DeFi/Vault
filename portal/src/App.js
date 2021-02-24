import './App.css';

import React, {Component} from 'react';
import Web3 from 'web3';
import Web3Connect from 'web3connect';
import WalletConnectProvider from '@walletconnect/web3-provider';
import Portis from '@portis/web3';
import Fortmatic from 'fortmatic';
import Torus from '@toruslabs/torus-embed';
import Authereum from 'authereum';

import contract from './contracts/VLT.json';

import Swap from './components/Swap/Swap.js';
import Nav from './components/Nav/Nav.js';
import Footer from './components/Footer/Footer.js';


// import keys from './keys';

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      // infuraId: keys.infura
    }
  },
  portis: {
    package: Portis,
    options: {
      // id: keys.portis
    }
  },
  fortmatic: {
    package: Fortmatic,
    options: {
      // key: keys.fortmatic
    }
  },
  torus: {
    package: Torus,
    options: {
      enableLogging: false,
      buttonPosition: "bottom-left",
      buildEnv: "production",
      showTorusButton: true,
      enabledVerifiers: {
        google: false
      }
    }
  },
  authereum: {
    package: Authereum,
    options: {}
  }
};

function initWeb3(provider) {
  const web3 = new Web3(provider)

  web3.eth.extend({
    methods: [
      {
        name: 'chainId',
        call: 'eth_chainId',
        outputFormatter: web3.utils.hexToNumber
      }
    ]
  })

  return web3
}

class App extends Component {
  Web3Connect;

  constructor(props) {
    super(props);

    this.state = {
      web3: null, 
      contract: null,
      accounts: null,
      account: null,
      latestBlock: '',
      network: null,
      message: null,
      txHash: null,
      provider: null,
      connected: null,
      chainId: null,
      networkId: null,
      balance: null,
    }

    this.web3Connect = new Web3Connect.Core({
      network: "mainnet",
      cacheProvider: true,
      providerOptions
    });
  }

  componentDidMount = async () => {
    if (this.web3Connect.cachedProvider) {
      this.onConnect()
    }

    // this.getEthBalance();
    // this.getCirculatingSupply();
  }

  onConnect = async () => {
    const provider = await this.web3Connect.connect();
    await this.subscribeProvider(provider);
    const web3 = initWeb3(provider);

    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    const networkId = await web3.eth.net.getId();
    const chainId = await web3.eth.chainId();

    // Get the contract instance.
    const deployedNetwork = contract.networks[networkId];
    const instance = new web3.eth.Contract(
      contract.abi,
      deployedNetwork && deployedNetwork.address,
    );

    await this.setState({
      web3,
      provider,
      connected: true,
      account,
      chainId,
      networkId,
      contract: instance
    });

    this.interval = setInterval(async () => {
      this.getLatestBlock();
      this.getNetworkName();
    }, 2000);

    await this.getAccount();
    this.getLatestBlock();
    this.getNetworkName();
    this.getTokenBalance();
  }

  subscribeProvider = async (provider) => {
    provider.on('close', () => this.disconnect());

    provider.on('accountsChanged', async (accounts) => {
      await this.setState({ address: accounts[0] });
    });

    provider.on('chainChanged', async (chainId) => {
      const { web3 } = this.state
      const networkId = await web3.eth.net.getId()
      await this.setState({ chainId, networkId });
    });

    provider.on('networkChanged', async (networkId) => {
      const { web3 } = this.state;
      const chainId = await web3.eth.chainId();
      await this.setState({ chainId, networkId });
    });
  }

  disconnect = async () => {
    const { web3 } = this.state
    if (web3 && web3.currentProvider && web3.currentProvider.close) {
      await web3.currentProvider.close()
    }
    await this.web3Connect.clearCachedProvider();
    this.setState({connected: false, account: null});
  }

  getAccount = async () => {
    const accounts = await this.state.web3.eth.getAccounts();
    if (accounts[0] !== this.state.account) {
      this.setState({
        account: accounts[0]
      });
      console.log(this.state.account);
    }
  }

  getLatestBlock = async () => {
    const block = await this.state.web3.eth.getBlock('latest');
    this.setState({latestBlock: block.number});
  }

  getNetworkName = () => {
    const {networkId} = this.state;

    if(networkId === 1) {
      this.setState({network: 'Mainnet'});
    } else if(networkId === 3) {
      this.setState({network: 'Ropsten'});
    } else if(networkId === 4) {
      this.setState({network: 'Rinkeby'});
    } else if(networkId === 5) {
      this.setState({network: 'Goerli'});
    } else if(networkId === 42) {
      this.setState({network: 'Kovan'});
    } else {
      this.setState({network: 'Unknown Network'});
    }
  }

  xhr (api, callback) {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', `${api}`, true);
    xhr.send();

    xhr.onreadystatechange = (e) => {
      if(xhr.readyState === 4 && xhr.status === 200) {
        callback(xhr.responseText);
      }
    }
  }

  setMessage = (newMessage, txHash) => {
    this.setState({
      message: newMessage,
      txHash
    });
    console.log(this.state.message);
    console.log(this.state.txHash);
  }

  clearMessage = () => {
    this.setState({
      message: null,
      txHash: null
    });
  }

  getTokenBalance = () => {
    if(this.state.network === 'Mainnet') {
      this.xhr(
        `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x4F350D2d8C04a165bc8bEE68D16493B06866a5D1&apiKey=2SDT7WUWQDZ8EJZWHP6QUPEZAX8ZE7VPV2&address=${this.state.account}`, 
      (res) => {
        const data = JSON.parse(res);
        const balance = data.result / 10**18;
        if(balance > 0) {
          this.setState({balance});
        }
      });
    } else if(this.state.network === 'Rinkeby') {
      this.xhr(
        `https://api-rinkeby.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x4F350D2d8C04a165bc8bEE68D16493B06866a5D1&apiKey=2SDT7WUWQDZ8EJZWHP6QUPEZAX8ZE7VPV2&address=${this.state.account}`, 
      (res) => {
        const data = JSON.parse(res);
        const balance = data.result / 10**18;
        if(balance > 0) {
          this.setState({balance});
        }
      });
    } else {
      this.xhr(
        `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x4F350D2d8C04a165bc8bEE68D16493B06866a5D1&apiKey=2SDT7WUWQDZ8EJZWHP6QUPEZAX8ZE7VPV2&address=${this.state.account}`, 
      (res) => {
        const data = JSON.parse(res);
        const balance = data.result / 10**18;
        if(balance > 0) {
          this.setState({balance});
        }
      });
    }
  }

  render() {
    return (
      <div className="app">
        <Nav 
          {...this.state}
          onConnect={this.onConnect}
          disconnect={this.disconnect}
        />
        {/* <div className="container"> */}
          <Swap
            {...this.state} 
            xhr={this.xhr}
            setMessage={this.setMessage} 
            clearMessage={this.clearMessage}
          />
        {/* </div> */}
        <Footer {...this.state} />
      </div>
    );
  }
}

export default App;

