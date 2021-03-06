// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.3.0/contracts/utils/Address.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.3.0/contracts/math/SafeMath.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.3.0/contracts/GSN/Context.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.3.0/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.3.0/contracts/token/ERC20/IERC20.sol";

import "./IVLTRecipient.sol";

contract VLT is Context, IERC20, Ownable {
    using SafeMath for uint256;
    using Address for address;

    mapping (address => mapping (address => uint256)) private _allowances;
    mapping (address => uint256) private _balances;

    string private _name = "Vault";
    string private _symbol = "VLT";
    uint8 private _decimals = 18;
    uint256 private _totalSupply = 100000e18;

    address vaultContractAddress;
    bool isVaultContractAddressSet;
            
    uint16 public TAX_FRACTION = 33;
    address public taxReceiveAddress;

    bool public isTaxEnabled;
    mapping(address => bool) public nonTaxedAddresses;

    constructor () public {
        isTaxEnabled = true;
        taxReceiveAddress =  msg.sender;
        _balances[msg.sender] = _balances[msg.sender].add(_totalSupply);
        isVaultContractAddressSet = false;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }


    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }


    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, _msgSender(), _allowances[sender][_msgSender()].sub(amount, "ERC20: transfer amount exceeds allowance"));
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].add(addedValue));
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].sub(subtractedValue, "ERC20: decreased allowance below zero"));
        return true;
    }


    function _approve(address owner, address spender, uint256 amount) private {
        require(isVaultContractAddressSet == true, "VLT: Vault Contract address must be set");
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        require(isVaultContractAddressSet == true, "VLT: Vault Contract address must be set");
        if(recipient == vaultContractAddress) {
            require(balanceOf(_msgSender()) >= amount, "Doesn't have as many tokens as specified");

            if(nonTaxedAddresses[_msgSender()] == true || TAX_FRACTION == 0 || recipient == vaultContractAddress){
                IVLTRecipient receiver = IVLTRecipient(recipient);
                address payable payableTransferer = payable(_msgSender());
                
                receiver.tokenFallback(payableTransferer, amount);
            } else {
                uint256 feeAmount = amount.div(TAX_FRACTION);
                uint256 newAmount = amount.sub(feeAmount);
                
                IVLTRecipient receiver = IVLTRecipient(recipient);
                address payable payableTransferer = payable(_msgSender());

                receiver.tokenFallback(payableTransferer, newAmount);
            }

        }
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

  

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(isVaultContractAddressSet == true, "VLT: Vault Contract address must be set");
        require(sender != address(0), "Mute: transfer from the zero address");
        require(recipient != address(0), "Mute: transfer to the zero address");

        if(nonTaxedAddresses[sender] == true || TAX_FRACTION == 0 || recipient == vaultContractAddress){
          _balances[sender] = _balances[sender].sub(amount, "Mute: transfer amount exceeds balance");
          _balances[recipient] = _balances[recipient].add(amount);


          emit Transfer(sender, recipient, amount);


          return;
        }

        uint256 feeAmount = amount.div(TAX_FRACTION);
        uint256 newAmount = amount.sub(feeAmount);

        require(amount == feeAmount.add(newAmount), "Mute: math is broken");

        _balances[sender] = _balances[sender].sub(amount, "Mute: transfer amount exceeds balance");

        _balances[recipient] = _balances[recipient].add(newAmount);

        _balances[taxReceiveAddress] = _balances[taxReceiveAddress].add(feeAmount);


        emit Transfer(sender, recipient, newAmount);
        emit Transfer(sender, taxReceiveAddress, feeAmount);
    }
    
    function setTaxReceiveAddress(address _taxReceiveAddress) external onlyOwner {
        taxReceiveAddress = _taxReceiveAddress;
    }
    
    function setVaultContractAddress(address _vaultContractAddress) external onlyOwner {
        require(isVaultContractAddressSet == false, "Vault Contract Address already set");
        vaultContractAddress = _vaultContractAddress;
        isVaultContractAddressSet = true;
    }
}
