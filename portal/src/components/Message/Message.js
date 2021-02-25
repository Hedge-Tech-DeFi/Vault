import React, {Component} from 'react';

import './Message.css';

class Message extends Component {
  render() {
    let network;

    if(this.props.network === 'Rinkeby') {
      network = 'rinkeby.';
    }

    if(this.props.message) {
      return(
        <a 
          className="message"
          target="_blank"
          rel="noopener noreferrer"
          href={this.props.txHash ? `http://${network}bscscan.io/tx/${this.props.txHash}` : null}
        >
          {this.props.message}
        </a>
      );
    } else {
      return null;
    }
  }
}

export default Message;