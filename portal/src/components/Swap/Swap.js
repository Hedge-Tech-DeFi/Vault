import React, {Component} from 'react';

import './Swap.css';

class Swap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      vltValue: "",
      ethValue: "",
      ethBalance: 0,
      vltBalance: 1,
      circulatingSupplySet: false,
      ethBalanceSet: false
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    setInterval(() => {
      this.getEthBalance();
      this.getCirculatingSupply();
      console.log(this.state)
    }, 2000);
  }


  getEthBalance = async () => {
    if(this.state.network === 'Mainnet') {
      this.props.xhr(
        `https://api-hedgetech.herokuapp.com/mainnet/vault/etherbalance/`, 
      (res) => {
        const data = JSON.parse(res);
        const ethBalance = data / 10**18;
        if(ethBalance > 0) {
          this.setState({
            ethBalance: ethBalance,
            ethBalanceSet: true,
          });
        }
      });
    } else if(this.state.network === 'Rinkeby') {
      this.props.xhr(
        `https://api-hedgetech.herokuapp.com/rinkeby/vault/etherbalance/`, 
      (res) => {
        const data = JSON.parse(res);
        const ethBalance = data / 10**18;
        if(ethBalance > 0) {
          this.setState({
            ethBalance: ethBalance,
            ethBalanceSet: true,
          });
        }
      });
    } else {
      this.props.xhr(
        `https://api-hedgetech.herokuapp.com/mainnet/vault/etherbalance/`, 
      (res) => {
        const data = JSON.parse(res);
        const ethBalance = data / 10**18;
        if(ethBalance > 0) {
          this.setState({
            ethBalance: ethBalance,
            ethBalanceSet: true,
          });
          return ethBalance;
        }
      });
    }
  }

  getCirculatingSupply = async () => {
    if(this.state.network === 'Mainnet') {
      this.props.xhr(
        `https://api-hedgetech.herokuapp.com/mainnet/vault/circulatingsupply/`, 
      (res) => {
        const data = JSON.parse(res);
        const circulatingSupply = data / 10**18;
        if(circulatingSupply > 0) {
          this.setState({
            circulatingSupply: circulatingSupply,
            circulatingSupplySet: true,
          });
        }
      });
    } else if(this.state.network === 'Rinkeby') {
      this.props.xhr(
        `https://api-hedgetech.herokuapp.com/rinkeby/vault/circulatingsupply/`, 
      (res) => {
        const data = JSON.parse(res);
        const circulatingSupply = data / 10**18;
        if(circulatingSupply > 0) {
          this.setState({
            circulatingSupply: circulatingSupply,
            circulatingSupplySet: true,
          });
        }
      });
    } else {
      this.props.xhr(
        `https://api-hedgetech.herokuapp.com/mainnet/vault/circulatingsupply/`, 
      (res) => {
        const data = JSON.parse(res);
        const circulatingSupply = data / 10**18;
        if(circulatingSupply > 0) {
          this.setState({
            circulatingSupply: circulatingSupply,
            circulatingSupplySet: true,
          });
        }
      });
    }
  }


  handleChange(event) {
    this.setState({
      vltValue: event.target.value,
      ethValue: this.getEthValue(event.target.value)
    });
  }

  getEthValue(vltValue) {
    let ethValue = parseFloat(vltValue); 
    ethValue = ethValue * (parseFloat(this.state.ethBalance) / parseFloat(this.state.circulatingSupply)); 

    if (isNaN(ethValue)) {
      return 0;
    } else {
      return ethValue;
    }
  }

  handleSubmit(event) {}

  handleSwap = () => {
    const transferValue = this.props.web3.utils.toWei(this.state.vltValue);
    this.props.contract.methods.transfer("0x28e041cc0D451980BD2CC4Fa5aD47805a6E4F9F8", transferValue)
    .send({from: this.props.account}, (err, transactionHash) => {
      this.props.setMessage('Transaction Pending...', transactionHash);
    }).on('confirmation', (number, receipt) => {
      if(number === 0) {
        this.props.setMessage('Transaction Confirmed!', receipt.transactionHash);
      }
      setTimeout(() => {
        this.props.clearMessage();
      }, 5000);
    }).on('error', (err, receipt) => {
      this.props.setMessage('Transaction Failed.', receipt ? receipt.transactionHash : null);
    });
  }

  render() {
    return (
      <div className="container">
        <div className="swap">
          <div className="inputContainer">
            <label>VLT: </label>
            <input 
              text="text" 
              value={this.state.vlValue} 
              className="swap__input" 
              onChange={this.handleChange} 
              disabled={!this.state.ethBalanceSet || !this.state.circulatingSupplySet}
            />
          </div>
          <div className="inputContainer">
            <label>BNB: </label>
            <input text="text" value={this.state.ethValue} disabled/>
          </div>
          <div className="inputContainer">
            <button className="hedgeTechButton" onClick={this.handleSwap}>Swap</button>
          </div>
        </div>
      </div>
    );
  }
}

export default Swap;