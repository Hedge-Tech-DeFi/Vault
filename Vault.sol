// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.3.0/contracts/math/SafeMath.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.3.0/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.3.0/contracts/utils/Address.sol";

import "./IVLTRecipient.sol";

contract Vault is IVLTRecipient {
  using SafeMath for uint256;
  using Address for address;

  // The VLT token
  IERC20 public vlt;
  address public vltAddress;

  // The circulating supply of the VLT token
  uint256 public circulatingSupply;
  
  // To handle receiving ETH payments
  receive() external payable {}

  constructor (address _vlt) public {
    // Initializing VLT token as ERC 20
    vlt = IERC20(_vlt);
    vltAddress = _vlt;
    // Initially, circulating supply is token supply
    circulatingSupply = vlt.totalSupply();
  }
  
  // Returns the ETH locked in the Vault
  function getVaultETHBalance() public view returns (uint256) {
    return address(this).balance;
  }

  // Returns the amount of VLT tokens locked in the vault
  function getVaultVLTBalance() public view returns (uint256) {
    return vlt.balanceOf(address(this));
  }

  // Returns the current circulating supply of the VLT token
  function getCirculatingSupply() public view returns (uint256) {
    return circulatingSupply;
  }

  function tokenFallback(address payable _from, uint _value) public override returns (bool) {
    require(msg.sender == vltAddress, "Only vault token can call this function");
    sendBackEth(_from, _value);
    return true;
  }

  // Swaps VLT tokens for ETH
  function sendBackEth(address payable _from, uint256 _tokenAmount) internal {
    require(getVaultETHBalance() > 0, "Vault has no ETH");

    uint256 tokenPerEth = getCirculatingSupply().div(getVaultETHBalance());
    uint256 totalEth = _tokenAmount.div(tokenPerEth);
    address payable swapInitator = _from;

    swapInitator.transfer(totalEth);

    circulatingSupply = circulatingSupply.sub(_tokenAmount);
  }
}