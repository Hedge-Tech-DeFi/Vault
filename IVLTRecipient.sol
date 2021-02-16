// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

 /**
 * @title Contract that will work with ERC223 tokens.
 */
 
interface IVLTRecipient { 
/**
 * @dev Standard function that will handle incoming VLT transfers to the Vault.
 *
 * @param _from  Token sender address.
 * @param _value Amount of tokens.
 */
  function tokenFallback(address payable _from, uint _value) external returns (bool);
}